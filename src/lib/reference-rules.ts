// ============================================================================
// REFERENCE RULES
// ============================================================================
//
// A test's normal range is an ordered list of rules. Each rule states a
// condition and what a value matching it means. The first rule that applies to
// the patient and matches the value wins, so order is authored and meaningful.
//
// This module is the single source of truth for reading, evaluating, and
// formatting that list. Nothing else should inspect the shape directly.

import type { ResultFlag } from '@/types/results';

export type RuleOp = 'between' | 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'text_eq';

export type RuleGender = 'male' | 'female';

/**
 * Narrows a rule to a subset of patients. Every field is optional; an absent
 * field imposes no constraint, so an absent condition matches everyone.
 */
export interface RuleCondition {
  gender?: RuleGender;
  min_age?: number;
  max_age?: number;
}

export interface ReferenceRule {
  id: string;
  label: string;
  op: RuleOp;
  /** Used by lt, lte, gt, gte, eq. */
  value?: number;
  /** Used by between. */
  min?: number;
  /** Used by between. */
  max?: number;
  /** Used by text_eq. */
  text?: string;
  flag: ResultFlag;
  applies_to?: RuleCondition;
}

export interface PatientContext {
  gender?: string;
  age?: number;
}

export interface RuleMatch {
  flag: ResultFlag;
  label: string;
  rule: ReferenceRule;
}

export const RULE_OPS: RuleOp[] = ['between', 'lt', 'lte', 'gt', 'gte', 'eq', 'text_eq'];

/** Operators that compare against a number and cannot match text. */
export const NUMERIC_OPS: RuleOp[] = ['between', 'lt', 'lte', 'gt', 'gte', 'eq'];

export const RULE_OP_LABELS_AR: Record<RuleOp, string> = {
  between: 'بين',
  lt: 'أقل من',
  lte: 'أقل من أو يساوي',
  gt: 'أكبر من',
  gte: 'أكبر من أو يساوي',
  eq: 'يساوي',
  text_eq: 'نص يساوي',
};

/** Symbol used when formatting a rule for display and print. */
const OP_SYMBOLS: Record<Exclude<RuleOp, 'between' | 'text_eq'>, string> = {
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  eq: '=',
};

export const FLAG_LABELS_AR: Record<ResultFlag, string> = {
  normal: 'طبيعي',
  high: 'مرتفع',
  low: 'منخفض',
  critical_high: 'مرتفع حرج',
  critical_low: 'منخفض حرج',
};

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/**
 * Coerce whatever the JSONB column holds into a rule array.
 *
 * The column is untyped and written from the browser, and rows predating the
 * rules migration hold an object. Every read goes through here so a bad row
 * degrades to "no rules" instead of throwing.
 */
export function asRules(raw: unknown): ReferenceRule[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRule);
}

function isRule(candidate: unknown): candidate is ReferenceRule {
  if (!candidate || typeof candidate !== 'object') return false;
  const rule = candidate as Partial<ReferenceRule>;
  if (typeof rule.op !== 'string' || !RULE_OPS.includes(rule.op as RuleOp)) return false;
  return typeof rule.flag === 'string';
}

// ---------------------------------------------------------------------------
// Patient matching
// ---------------------------------------------------------------------------

/**
 * Map the gender values the app uses ('ذكر' / 'أنثى' / 'male' / 'female') onto
 * the two the rules use. Anything else is unknown.
 */
export function canonicalGender(gender?: string): RuleGender | undefined {
  if (gender === 'ذكر' || gender === 'male') return 'male';
  if (gender === 'أنثى' || gender === 'female') return 'female';
  return undefined;
}

/**
 * Whether a rule applies to this patient.
 *
 * A rule constrained by gender or age does not apply when that fact about the
 * patient is unknown: guessing would attach a flag the rule never claimed.
 */
export function appliesTo(rule: ReferenceRule, ctx?: PatientContext): boolean {
  const condition = rule.applies_to;
  if (!condition) return true;

  if (condition.gender) {
    if (canonicalGender(ctx?.gender) !== condition.gender) return false;
  }

  const hasAgeBound =
    typeof condition.min_age === 'number' || typeof condition.max_age === 'number';
  if (hasAgeBound) {
    if (typeof ctx?.age !== 'number' || Number.isNaN(ctx.age)) return false;
    if (typeof condition.min_age === 'number' && ctx.age < condition.min_age) return false;
    if (typeof condition.max_age === 'number' && ctx.age > condition.max_age) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Value matching
// ---------------------------------------------------------------------------

/**
 * Parse a result value to a number, tolerating Arabic and Persian numerals.
 * Returns NaN for anything that is not wholly numeric, so "1+" and "Negative"
 * are text rather than 1.
 */
export function parseNumeric(value: string | number): number {
  if (typeof value === 'number') return value;

  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  if (normalized === '' || !/^[+-]?\d*\.?\d+$/.test(normalized)) return NaN;
  return parseFloat(normalized);
}

function matchesValue(rule: ReferenceRule, value: string | number): boolean {
  if (rule.op === 'text_eq') {
    if (typeof rule.text !== 'string') return false;
    const actual = String(value).trim().toLowerCase();
    return actual !== '' && actual === rule.text.trim().toLowerCase();
  }

  const numeric = parseNumeric(value);
  if (Number.isNaN(numeric)) return false;

  switch (rule.op) {
    case 'between':
      if (typeof rule.min !== 'number' || typeof rule.max !== 'number') return false;
      return numeric >= rule.min && numeric <= rule.max;
    case 'lt':
      return typeof rule.value === 'number' && numeric < rule.value;
    case 'lte':
      return typeof rule.value === 'number' && numeric <= rule.value;
    case 'gt':
      return typeof rule.value === 'number' && numeric > rule.value;
    case 'gte':
      return typeof rule.value === 'number' && numeric >= rule.value;
    case 'eq':
      return typeof rule.value === 'number' && numeric === rule.value;
    default:
      return false;
  }
}

/**
 * First rule that applies to the patient and matches the value, or null.
 */
export function evaluateRules(
  rules: ReferenceRule[],
  value: string | number,
  ctx?: PatientContext
): RuleMatch | null {
  if (value === '' || value === null || value === undefined) return null;

  for (const rule of rules) {
    if (!appliesTo(rule, ctx)) continue;
    if (!matchesValue(rule, value)) continue;
    return { flag: rule.flag, label: rule.label, rule };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Shape questions
// ---------------------------------------------------------------------------

/**
 * A test is qualitative when it has rules and every one of them is a text
 * match. Result entry renders a dropdown for these instead of a number field.
 */
export function isQualitative(rules: ReferenceRule[]): boolean {
  return rules.length > 0 && rules.every((rule) => rule.op === 'text_eq');
}

/** Distinct text values offered by a qualitative test, in authored order. */
export function qualitativeOptions(rules: ReferenceRule[]): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  rules.forEach((rule) => {
    if (rule.op !== 'text_eq' || typeof rule.text !== 'string') return;
    const text = rule.text.trim();
    if (text === '' || seen.has(text.toLowerCase())) return;
    seen.add(text.toLowerCase());
    options.push(text);
  });

  return options;
}

/** True when at least one applicable rule compares against a number. */
export function hasNumericRule(rules: ReferenceRule[], ctx?: PatientContext): boolean {
  return rules.some((rule) => NUMERIC_OPS.includes(rule.op) && appliesTo(rule, ctx));
}

/**
 * Numeric band for the trend chart: the first applicable normal-flagged rule
 * that describes a closed interval. Returns null when there is none, and the
 * chart then omits the reference band.
 */
export function numericBand(
  rules: ReferenceRule[],
  ctx?: PatientContext
): { min: number; max: number } | null {
  for (const rule of rules) {
    if (rule.flag !== 'normal' || !appliesTo(rule, ctx)) continue;

    if (rule.op === 'between' && typeof rule.min === 'number' && typeof rule.max === 'number') {
      return { min: rule.min, max: rule.max };
    }
    if ((rule.op === 'lt' || rule.op === 'lte') && typeof rule.value === 'number') {
      return { min: 0, max: rule.value };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** One rule as a condition string, without its label: "4 - 11", "≤ 7.5". */
export function formatRuleCondition(rule: ReferenceRule): string {
  if (rule.op === 'text_eq') return rule.text ?? '';
  if (rule.op === 'between') {
    if (typeof rule.min !== 'number' || typeof rule.max !== 'number') return '';
    return `${rule.min} - ${rule.max}`;
  }
  if (typeof rule.value !== 'number') return '';
  return `${OP_SYMBOLS[rule.op]} ${rule.value}`;
}

/**
 * Rules as a single display string for the tests table, the entry modal, print,
 * and Excel.
 *
 * The common case -- one normal-flagged rule -- formats as the bare condition,
 * which keeps migrated tests reading exactly as they did before. Anything
 * richer lists each rule with its label.
 */
export function formatRules(rules: ReferenceRule[], ctx?: PatientContext): string {
  const applicable = rules.filter((rule) => appliesTo(rule, ctx));
  if (applicable.length === 0) return '-';

  if (applicable.length === 1 && applicable[0].flag === 'normal') {
    return formatRuleCondition(applicable[0]) || '-';
  }

  const parts = applicable
    .map((rule) => {
      const condition = formatRuleCondition(rule);
      if (!condition) return '';
      return rule.label ? `${rule.label}: ${condition}` : condition;
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : '-';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate an authored rule list before it is saved from the manager form.
 */
export function validateRules(rules: ReferenceRule[]): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  rules.forEach((rule, index) => {
    const position = index + 1;

    if (!rule.label || rule.label.trim() === '') {
      errors.push(`القاعدة ${position}: الاسم مطلوب`);
    }

    if (rule.op === 'text_eq') {
      if (!rule.text || rule.text.trim() === '') {
        errors.push(`القاعدة ${position}: النص مطلوب`);
      }
    } else if (rule.op === 'between') {
      if (typeof rule.min !== 'number' || Number.isNaN(rule.min)) {
        errors.push(`القاعدة ${position}: الحد الأدنى مطلوب`);
      }
      if (typeof rule.max !== 'number' || Number.isNaN(rule.max)) {
        errors.push(`القاعدة ${position}: الحد الأقصى مطلوب`);
      }
      if (
        typeof rule.min === 'number' &&
        typeof rule.max === 'number' &&
        rule.min > rule.max
      ) {
        errors.push(`القاعدة ${position}: الحد الأدنى أكبر من الحد الأقصى`);
      }
    } else if (typeof rule.value !== 'number' || Number.isNaN(rule.value)) {
      errors.push(`القاعدة ${position}: القيمة مطلوبة`);
    }

    const condition = rule.applies_to;
    if (
      condition &&
      typeof condition.min_age === 'number' &&
      typeof condition.max_age === 'number' &&
      condition.min_age > condition.max_age
    ) {
      errors.push(`القاعدة ${position}: نطاق العمر غير صحيح`);
    }
  });

  return { ok: errors.length === 0, errors };
}

/**
 * Validate a result typed during entry.
 *
 * A test with no rules accepts anything: that is how qualitative tests behaved
 * before rules existed, and still how they behave until someone authors rules
 * for them.
 */
export function validateValue(
  value: string,
  rules: ReferenceRule[]
): { isValid: boolean; error?: string } {
  if (!value || value.trim() === '') return { isValid: true };
  if (!hasNumericRule(rules)) return { isValid: true };

  const numeric = parseNumeric(value);
  if (Number.isNaN(numeric)) {
    return { isValid: false, error: 'يجب إدخال رقم صحيح' };
  }
  if (numeric < 0) {
    return { isValid: false, error: 'لا يمكن أن تكون القيمة سالبة' };
  }

  return { isValid: true };
}

/** Fresh rule for the "add rule" button in the manager form. */
export function emptyRule(): ReferenceRule {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
    label: '',
    op: 'between',
    flag: 'normal',
  };
}
