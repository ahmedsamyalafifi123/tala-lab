# Reference Rules — Design

**Date:** 2026-08-31
**Status:** Approved (design), pending implementation plan

## Problem

A lab test's normal range is currently two numbers: `min` and `max`. The manager
form ("إضافة تحليل جديد") exposes them as `الحد الأدنى للقيم الطبيعية` and
`الحد الأقصى للقيم الطبيعية`.

This cannot express how real reference ranges are written:

- A qualitative test has no numbers at all — `Negative` is the normal result.
- Many tests need several bands, not one: `< 200 Desirable`, `200–239 Borderline`,
  `≥ 240 High`.
- A single one-sided threshold (`≤ 7.5`) has to be faked as `0 – 7.5`.

23 of the 95 tests in production store `{"default": {}}` precisely because the
numeric model does not fit them. Those results are saved as free text with no
flag at all.

## Goal

Replace the two numeric fields with an ordered list of **reference rules**. Each
rule states a condition and what it means. The change propagates to result entry,
flag calculation, printing, Excel export, and the trend chart.

## Production data (measured 2026-08-31)

Queried against the live `lab_tests` table:

| Fact | Value |
| --- | --- |
| Total tests | 95 |
| Using only the `default` key | 95 (100%) |
| Using `male` / `female` / `age_ranges` | 0 |
| `default` holding numeric `{min,max}` | 72 |
| `default` empty (`{}`) | 23 |
| Clients with saved results | 90 |

Two consequences:

1. The gender- and age-variant machinery in `ReferenceRanges` is **dead code**.
   Nothing in production uses it. Flattening the model costs nothing.
2. Saved results carry their own `value` and `flag`, written at entry time. They
   are not re-derived from the test definition, so changing the definition shape
   cannot corrupt the 90 existing clients' history.

## Decisions

### D1 — Keep the column name `reference_ranges`

The column keeps its name and changes its contents from object to array.

Renaming to `reference_rules` was considered and rejected. Writes go directly
from the browser through supabase-js, so between running the migration and the
new bundle reaching every open tab, old JS will read the new data. Under the
existing name, old code evaluates `reference_ranges.default` on an array, gets
`undefined`, and renders `-`. Under a new name it would read `undefined.default`
and throw. The degraded path is worth more than the tidier name.

### D2 — Flat rule list, condition per rule

No `default` / `male` / `female` / `age_ranges` nesting. One array. A rule may
carry an optional `applies_to` narrowing it to a gender, an age window, or both.

### D3 — First match wins

Rules are evaluated in array order. The first rule whose condition holds supplies
the result's flag and label. Order is author-controlled and meaningful; the form
must therefore let the user reorder rows.

### D4 — No more inferred critical flags

`calculateFlag` currently invents `critical_high` / `critical_low` at 50% beyond
the stored range (`src/lib/test-utils.ts:63`). That heuristic is removed. A result
is critical only when a rule says so. `ResultFlag` keeps all five values and the
form's flag dropdown offers all five.

This is a deliberate behavior change: after migration, no test will produce a
critical flag until someone adds a rule carrying one. Existing saved results keep
whatever flag they were stored with.

### D5 — Qualitative tests get a dropdown

When every rule in a test's list uses the `text_eq` operator, the result-entry
field renders as a select of those rules' labels instead of a free-text input.
Any numeric rule present means a numeric input. A test with **no** rules keeps
today's behavior: free text, no flag.

### D6 — Validation lives in two places

There is no server route for test writes; `use-lab-tests.ts` calls supabase-js
from the client. Client-side validation in the form is therefore the primary
guard, backed by a DB `CHECK` constraint asserting the column holds a JSON array.
The constraint is a backstop against a malformed write, not a full schema check.

## Data model

```jsonc
// lab_tests.reference_ranges  (jsonb, DEFAULT '[]')
[
  {
    "id": "9f2c…",           // uuid, stable across edits, used as React key
    "label": "Normal",        // shown on the result badge and in print
    "op": "between",
    "min": 4.0,
    "max": 11.0,
    "flag": "normal"
  },
  { "id": "…", "label": "High",     "op": "gt",      "value": 11.0,       "flag": "high"   },
  { "id": "…", "label": "Negative", "op": "text_eq", "text": "Negative",  "flag": "normal" },
  {
    "id": "…", "label": "Normal", "op": "lte", "value": 7.5, "flag": "normal",
    "applies_to": { "gender": "female", "min_age": 18, "max_age": 60 }
  }
]
```

### Operators

| `op` | Fields used | Matches when |
| --- | --- | --- |
| `between` | `min`, `max` | `min <= v <= max` |
| `lt` | `value` | `v < value` |
| `lte` | `value` | `v <= value` |
| `gt` | `value` | `v > value` |
| `gte` | `value` | `v >= value` |
| `eq` | `value` | `v === value` |
| `text_eq` | `text` | case-insensitive, trimmed string equality |

Numeric operators never match a non-numeric input. `text_eq` never matches a
number-shaped input unless the text itself is that number.

### `applies_to`

Every field optional. An absent field imposes no constraint, so an absent
`applies_to` matches every patient.

```ts
{ gender?: 'male' | 'female'; min_age?: number; max_age?: number }
```

Patient gender arrives as `'ذكر'` / `'أنثى'` or `'male'` / `'female'`. The
existing canonicalization (`test-utils.ts:31`) moves into the new module. A rule
constrained by gender or age does **not** match when the patient's gender or age
is unknown.

## Module: `src/lib/reference-rules.ts`

New, and the single source of truth. It replaces a `hasValidRange` predicate that
is currently copy-pasted, verbatim, in four files:
`test-utils.ts:140`, `test-results-modal.tsx:231`, `[slug]/page.tsx:912`,
`export-results-dialog.tsx:469`.

```ts
export type RuleOp = 'between' | 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'text_eq';
export type ReferenceRule = { /* as above */ };
export type PatientContext = { gender?: string; age?: number };

// First applicable rule that matches, or null.
export function evaluateRules(
  rules: ReferenceRule[], value: string | number, ctx?: PatientContext
): { flag: ResultFlag; label: string } | null;

// Display string for form table, entry modal, print, Excel. '-' when no rules.
export function formatRules(rules: ReferenceRule[], ctx?: PatientContext): string;

// True when the list is non-empty and every rule uses text_eq.
export function isQualitative(rules: ReferenceRule[]): boolean;

// Distinct labels of text_eq rules, for the entry dropdown.
export function qualitativeOptions(rules: ReferenceRule[]): string[];

// Numeric band for the trend chart: first normal-flagged numeric rule, or null.
export function numericBand(
  rules: ReferenceRule[], ctx?: PatientContext
): { min: number; max: number } | null;

// Form-side validation of an authored rule list.
export function validateRules(rules: ReferenceRule[]): { ok: boolean; errors: string[] };

// Entry-side validation of a typed result.
export function validateValue(
  value: string, rules: ReferenceRule[]
): { isValid: boolean; error?: string };

// Defensive coercion: array passes through, anything else becomes [].
export function asRules(raw: unknown): ReferenceRule[];
```

`asRules` exists because the column is untyped JSONB written from the browser.
Every read goes through it.

### Deleted

From `src/lib/test-utils.ts`: `calculateFlag`, `formatReferenceRange`,
`validateTestValue`. From `src/types/results.ts`: `ReferenceRange`,
`ReferenceRanges`.

## Migration

`migrations/2026-08-31_reference_rules.sql`, idempotent via a
`jsonb_typeof(...) = 'object'` guard so a re-run is a no-op.

- 72 rows with numeric `default` → one `between` rule labeled `Normal`,
  flag `normal`, carrying the existing `min` and `max`.
- 23 rows with empty `default` → `[]`. Free-text entry, unchanged behavior,
  until someone authors text rules for them.
- Column default becomes `'[]'::jsonb`.
- Add `CHECK (jsonb_typeof(reference_ranges) = 'array')`.

The migration handles `male`, `female`, and `age_ranges` keys as well — emitting
one rule per variant with the corresponding `applies_to` — even though no
production row currently has them. Cheap insurance against a row appearing
between now and the run.

**Deploy order:** migration first, then the app bundle. See D1 for why that
window is safe.

## UI changes

### Manager form — `src/components/manager/tests-management.tsx`

The two number inputs at lines 400–425 are removed. In their place, a rule list:

```
القيم المرجعية
┌──────────────────────────────────────────────────────────────┐
│ [Normal    ] [بين     ▾] [4.0] [11.0] [طبيعي ▾] [⋮▾] [↑][↓][🗑] │
│ [High      ] [أكبر من ▾] [11.0]       [مرتفع ▾] [⋮▾] [↑][↓][🗑] │
└──────────────────────────────────────────────────────────────┘
                                              [+ إضافة قاعدة]
```

- Value inputs shown depend on the operator: two for `between`, one for the
  other numeric operators, a text field for `text_eq`.
- `⋮▾` opens the optional `applies_to` popover (gender select, age min/max).
  Collapsed by default so the common case stays a single row.
- `↑` `↓` reorder, because D3 makes order semantic.
- Empty list is valid and means "free text, no flag" — the current behavior of
  the 23 qualitative tests.
- `handleEdit` (line 98) and `handleSave` (line 114) read and write the array
  instead of `reference_min` / `reference_max` form state.
- The table's range column (line 278) uses `formatRules`.

Reuses existing primitives: `select.tsx`, `input.tsx`, `popover.tsx`, `button.tsx`.
No new dependency.

### Result entry — `src/components/results/test-results-modal.tsx`

- `getTestFlag` (line 148) delegates to `evaluateRules`.
- `isQualitative` decides input type: `Select` of `qualitativeOptions` versus the
  current numeric `Input`. Both the desktop branch (line 614) and the mobile
  branch (line 822) change.
- The badge shows the matched rule's `label`; falls back to the existing
  `getFlagLabel` when a flag has no label.
- The `hasValidRange` blob at line 231 is deleted. What gets stored is decided by
  what the field produced: a number from the numeric input, a string from the
  dropdown or free-text field.
- "المدى الطبيعي" line uses `formatRules`.

### Print and export

- `src/app/[slug]/page.tsx:912` — ~14 lines of range-shape probing collapse to
  one `formatRules(asRules(test?.reference_ranges), ctx)` call.
- `src/components/analytics/export-results-dialog.tsx:117` (Excel) and `:469`
  (print HTML) — same collapse.

### Trend chart — `src/components/analytics/client-trend-chart.tsx`

The bespoke range-resolution block at lines 68–91 is replaced by `numericBand`.
When it returns `null` the reference band is not rendered.

## Testing

The repo has no test framework: no `vitest`, no `jest`, no `test` script in
`package.json`. `reference-rules.ts` is pure, dependency-free logic with a table
of operators and a precedence rule — the case where unit tests pay for themselves
immediately.

This design adds `vitest` as a dev dependency plus an `npm test` script. No
runtime dependency, no bundle impact.

`src/lib/reference-rules.test.ts` covers:

- each operator, matching and non-matching, at its boundary
- first-match-wins when several rules match
- `applies_to` filtering by gender, by age, by both; unknown gender and unknown
  age excluded from constrained rules
- Arabic gender strings canonicalized
- `text_eq` case and whitespace insensitivity
- empty list, `null`, object (legacy shape), and malformed input all handled by
  `asRules` without throwing
- `isQualitative` true only for a non-empty all-`text_eq` list
- `numericBand` picks the first normal-flagged numeric rule and returns `null`
  when there is none

Manual verification after implementation:

1. Author a test with three rules covering a numeric range, print a result.
2. Author a qualitative test, confirm the entry dropdown, save, print, export.
3. Open a pre-existing migrated test and confirm its range reads as before.
4. Open a client with pre-existing results and confirm history is unchanged.

## Scope

Edited: `types/results.ts`, `lib/test-utils.ts`,
`components/manager/tests-management.tsx`,
`components/results/test-results-modal.tsx`, `app/[slug]/page.tsx`,
`components/analytics/export-results-dialog.tsx`,
`components/analytics/client-trend-chart.tsx`.

Added: `lib/reference-rules.ts`, `lib/reference-rules.test.ts`,
`migrations/2026-08-31_reference_rules.sql`, vitest config.

## Out of scope

Duplicate test codes differing only by trailing whitespace — `BLOOD BANK` /
`BLOOD BANK `, six `COAGULATION` variants, two each of `SEROLOGY` and
`VIROLOGY`. Pre-existing data hygiene, unrelated to this change, tracked
separately.
