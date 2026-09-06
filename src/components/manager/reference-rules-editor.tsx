"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Trash2, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFlagLabel } from "@/lib/test-utils";
import {
  emptyRule,
  RULE_OPS,
  RULE_OP_LABELS,
  TEXT_PRESETS,
  type ReferenceRule,
  type RuleOp,
} from "@/lib/reference-rules";
import type { ResultFlag } from "@/types/results";

const FLAGS: ResultFlag[] = [
  "normal",
  "moderate",
  "high",
  "low",
  "critical_high",
  "critical_low",
  "detection_limit",
];

/** Sentinel for "no gender constraint" — Radix Select rejects an empty value. */
const ANY_GENDER = "any";

/** Sentinel for "not one of the presets" — the row then takes free text. */
const CUSTOM_TEXT = "__custom__";

interface ReferenceRulesEditorProps {
  rules: ReferenceRule[];
  onChange: (rules: ReferenceRule[]) => void;
}

/**
 * Authoring UI for a test's reference rules.
 *
 * Rules are evaluated first-match-wins, so the list is ordered and the reorder
 * arrows are part of the semantics, not a convenience.
 */
export function ReferenceRulesEditor({ rules, onChange }: ReferenceRulesEditorProps) {
  const update = (index: number, patch: Partial<ReferenceRule>) => {
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  };

  const remove = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const next = [...rules];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  // Switching operator clears the fields the previous operator used, so a rule
  // never carries a stale bound that no longer applies.
  const changeOp = (index: number, op: RuleOp) => {
    update(index, { op, value: undefined, min: undefined, max: undefined, text: undefined });
  };

  const setCondition = (index: number, patch: Partial<NonNullable<ReferenceRule["applies_to"]>>) => {
    const current = rules[index].applies_to ?? {};
    const next = { ...current, ...patch };

    // Drop the condition entirely once nothing constrains it, so the rule
    // reads as unconditional again.
    const isEmpty =
      next.gender === undefined &&
      next.min_age === undefined &&
      next.max_age === undefined;

    update(index, { applies_to: isEmpty ? undefined : next });
  };

  return (
    <div className="space-y-2" dir="ltr">
      <div className="flex items-center justify-between">
        <Label>Reference values</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rules, emptyRule()])}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed rounded-md p-3">
          No rules. Results for this test are entered as free text and carry no flag.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-2 rounded-md border p-2"
            >
              <Input
                value={rule.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="Normal"
                className="h-9 w-28"
              />

              <Select
                value={rule.op}
                onValueChange={(op) => changeOp(index, op as RuleOp)}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_OPS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {RULE_OP_LABELS[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <RuleValueInputs rule={rule} onChange={(patch) => update(index, patch)} />

              <Select
                value={rule.flag}
                onValueChange={(flag) =>
                  update(index, {
                    flag: flag as ResultFlag,
                    // Only follow the flag while the label is still the one the
                    // previous flag put there; a hand-written label is kept.
                    ...(rule.label === getFlagLabel(rule.flag)
                      ? { label: getFlagLabel(flag as ResultFlag) }
                      : {}),
                  })
                }
              >
                <SelectTrigger className="h-9 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLAGS.map((flag) => (
                    <SelectItem key={flag} value={flag}>
                      {getFlagLabel(flag)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn("h-9 px-2", rule.applies_to && "text-primary")}
                    title="Limit to a gender or age range"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3 text-left" dir="ltr">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender</Label>
                    <Select
                      value={rule.applies_to?.gender ?? ANY_GENDER}
                      onValueChange={(gender) =>
                        setCondition(index, {
                          gender:
                            gender === ANY_GENDER
                              ? undefined
                              : (gender as "male" | "female"),
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-left">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_GENDER}>Everyone</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Age from</Label>
                      <Input
                        type="number"
                        value={rule.applies_to?.min_age ?? ""}
                        onChange={(e) =>
                          setCondition(index, { min_age: toNumber(e.target.value) })
                        }
                        className="h-9 text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Age to</Label>
                      <Input
                        type="number"
                        value={rule.applies_to?.max_age ?? ""}
                        onChange={(e) =>
                          setCondition(index, { max_age: toNumber(e.target.value) })
                        }
                        className="h-9 text-left"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Leave blank to apply the rule to everyone.
                  </p>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-0.5 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  disabled={index === rules.length - 1}
                  onClick={() => move(index, 1)}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => remove(index)}
                  title="Delete rule"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            The first matching rule wins, so the order matters.
          </p>
        </div>
      )}
    </div>
  );
}

/** The value fields a rule needs depend on its operator. */
function RuleValueInputs({
  rule,
  onChange,
}: {
  rule: ReferenceRule;
  onChange: (patch: Partial<ReferenceRule>) => void;
}) {
  if (rule.op === "text_eq") {
    return <TextRuleInputs rule={rule} onChange={onChange} />;
  }

  if (rule.op === "between") {
    return (
      <>
        <Input
          type="number"
          step="any"
          value={rule.min ?? ""}
          onChange={(e) => onChange({ min: toNumber(e.target.value) })}
          placeholder="Min"
          className="h-9 w-24"
        />
        <Input
          type="number"
          step="any"
          value={rule.max ?? ""}
          onChange={(e) => onChange({ max: toNumber(e.target.value) })}
          placeholder="Max"
          className="h-9 w-24"
        />
      </>
    );
  }

  return (
    <Input
      type="number"
      step="any"
      value={rule.value ?? ""}
      onChange={(e) => onChange({ value: toNumber(e.target.value) })}
      placeholder="Value"
      className="h-9 w-28"
    />
  );
}

/**
 * Value fields for the Equals-text operator.
 *
 * Choosing "Other…" clears the text, which on its own would look identical to
 * an untouched row and collapse the field again, so the choice is held in
 * state rather than inferred from the text alone.
 */
function TextRuleInputs({
  rule,
  onChange,
}: {
  rule: ReferenceRule;
  onChange: (patch: Partial<ReferenceRule>) => void;
}) {
  const text = rule.text ?? "";
  const isPreset = (TEXT_PRESETS as readonly string[]).includes(text);
  const [isCustom, setIsCustom] = useState(!isPreset && text !== "");

  // An authored preset always wins over a stale custom flag, so switching back
  // to Positive/Negative closes the free-text field.
  const showCustom = isCustom && !isPreset;
  const selected = isPreset ? text : showCustom ? CUSTOM_TEXT : "";

  return (
      <>
        <Select
          value={selected}
          onValueChange={(next) => {
            setIsCustom(next === CUSTOM_TEXT);
            onChange({ text: next === CUSTOM_TEXT ? "" : next });
          }}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Value" />
          </SelectTrigger>
          <SelectContent>
            {TEXT_PRESETS.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {preset}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_TEXT}>Other…</SelectItem>
          </SelectContent>
        </Select>

        {showCustom && (
          <Input
            value={text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="e.g. 1+, 1/160"
            className="h-9 w-32"
            autoFocus
          />
        )}
      </>
  );
}

/** Empty input means "unset", not zero. */
function toNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}
