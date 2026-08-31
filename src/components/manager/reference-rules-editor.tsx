"use client";

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
import {
  emptyRule,
  FLAG_LABELS_AR,
  RULE_OPS,
  RULE_OP_LABELS_AR,
  type ReferenceRule,
  type RuleOp,
} from "@/lib/reference-rules";
import type { ResultFlag } from "@/types/results";

const FLAGS: ResultFlag[] = ["normal", "high", "low", "critical_high", "critical_low"];

/** Sentinel for "no gender constraint" — Radix Select rejects an empty value. */
const ANY_GENDER = "any";

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>القيم المرجعية</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...rules, emptyRule()])}
        >
          <Plus className="h-4 w-4 ml-1" />
          إضافة قاعدة
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-dashed rounded-md p-3">
          لا توجد قواعد. سيتم إدخال النتيجة كنص حر بدون تقييم.
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
                placeholder="طبيعي"
                className="h-9 w-28 text-right"
              />

              <Select
                value={rule.op}
                onValueChange={(op) => changeOp(index, op as RuleOp)}
              >
                <SelectTrigger className="h-9 w-36 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_OPS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {RULE_OP_LABELS_AR[op]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <RuleValueInputs rule={rule} onChange={(patch) => update(index, patch)} />

              <Select
                value={rule.flag}
                onValueChange={(flag) => update(index, { flag: flag as ResultFlag })}
              >
                <SelectTrigger className="h-9 w-32 text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLAGS.map((flag) => (
                    <SelectItem key={flag} value={flag}>
                      {FLAG_LABELS_AR[flag]}
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
                    title="تخصيص حسب النوع أو العمر"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3 text-right" dir="rtl">
                  <div className="space-y-1.5">
                    <Label className="text-xs">النوع</Label>
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
                      <SelectTrigger className="h-9 text-right">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_GENDER}>الكل</SelectItem>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">من عمر</Label>
                      <Input
                        type="number"
                        value={rule.applies_to?.min_age ?? ""}
                        onChange={(e) =>
                          setCondition(index, { min_age: toNumber(e.target.value) })
                        }
                        className="h-9 text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">إلى عمر</Label>
                      <Input
                        type="number"
                        value={rule.applies_to?.max_age ?? ""}
                        onChange={(e) =>
                          setCondition(index, { max_age: toNumber(e.target.value) })
                        }
                        className="h-9 text-right"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    اترك الحقول فارغة لتطبيق القاعدة على الجميع.
                  </p>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-0.5 mr-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  title="تحريك لأعلى"
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
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => remove(index)}
                  title="حذف القاعدة"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            يتم تطبيق أول قاعدة مطابقة، لذا الترتيب مهم.
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
    return (
      <Input
        value={rule.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Negative"
        className="h-9 w-40 text-right"
      />
    );
  }

  if (rule.op === "between") {
    return (
      <>
        <Input
          type="number"
          step="any"
          value={rule.min ?? ""}
          onChange={(e) => onChange({ min: toNumber(e.target.value) })}
          placeholder="من"
          className="h-9 w-24 text-right"
        />
        <Input
          type="number"
          step="any"
          value={rule.max ?? ""}
          onChange={(e) => onChange({ max: toNumber(e.target.value) })}
          placeholder="إلى"
          className="h-9 w-24 text-right"
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
      placeholder="القيمة"
      className="h-9 w-28 text-right"
    />
  );
}

/** Empty input means "unset", not zero. */
function toNumber(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}
