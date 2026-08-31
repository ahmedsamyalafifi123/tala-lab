import { describe, expect, it } from "vitest";
import {
  appliesTo,
  asRules,
  canonicalGender,
  evaluateRules,
  formatRules,
  hasNumericRule,
  isQualitative,
  numericBand,
  parseNumeric,
  qualitativeOptions,
  validateRules,
  validateValue,
  hasTextRule,
  TEXT_PRESETS,
  type ReferenceRule,
} from "./reference-rules";

/** Terse rule builder so each test reads as the case it covers. */
function rule(partial: Partial<ReferenceRule> & Pick<ReferenceRule, "op">): ReferenceRule {
  return { id: partial.op + Math.random(), label: "Normal", flag: "normal", ...partial };
}

describe("asRules", () => {
  it("passes an array of rules through", () => {
    const rules = [rule({ op: "between", min: 1, max: 2 })];
    expect(asRules(rules)).toHaveLength(1);
  });

  it("returns an empty list for the pre-migration object shape", () => {
    expect(asRules({ default: { min: 4, max: 11 } })).toEqual([]);
  });

  it("returns an empty list for null, undefined, and scalars", () => {
    expect(asRules(null)).toEqual([]);
    expect(asRules(undefined)).toEqual([]);
    expect(asRules("nonsense")).toEqual([]);
    expect(asRules(7)).toEqual([]);
  });

  it("drops entries that are not rules without throwing", () => {
    const raw = [
      rule({ op: "between", min: 1, max: 2 }),
      null,
      { op: "not_an_operator", flag: "normal" },
      { op: "gt" },
      "string",
    ];
    expect(asRules(raw)).toHaveLength(1);
  });
});

describe("parseNumeric", () => {
  it("parses plain and decimal numbers", () => {
    expect(parseNumeric("7.5")).toBe(7.5);
    expect(parseNumeric(" 12 ")).toBe(12);
    expect(parseNumeric(3)).toBe(3);
  });

  it("parses Arabic and Persian numerals", () => {
    expect(parseNumeric("٧٫٥".replace("٫", "."))).toBe(7.5);
    expect(parseNumeric("١٢")).toBe(12);
    expect(parseNumeric("۱۲")).toBe(12);
  });

  it("rejects partially numeric text so 1+ stays text", () => {
    expect(parseNumeric("1+")).toBeNaN();
    expect(parseNumeric("Negative")).toBeNaN();
    expect(parseNumeric("")).toBeNaN();
    expect(parseNumeric("7.5 mg")).toBeNaN();
  });
});

describe("evaluateRules — operators", () => {
  it("matches between inclusively at both bounds", () => {
    const rules = [rule({ op: "between", min: 4, max: 11 })];
    expect(evaluateRules(rules, 4)?.flag).toBe("normal");
    expect(evaluateRules(rules, 11)?.flag).toBe("normal");
    expect(evaluateRules(rules, 3.99)).toBeNull();
    expect(evaluateRules(rules, 11.01)).toBeNull();
  });

  it("distinguishes lt from lte at the bound", () => {
    expect(evaluateRules([rule({ op: "lt", value: 7.5 })], 7.5)).toBeNull();
    expect(evaluateRules([rule({ op: "lte", value: 7.5 })], 7.5)?.flag).toBe("normal");
  });

  it("distinguishes gt from gte at the bound", () => {
    expect(evaluateRules([rule({ op: "gt", value: 7.5 })], 7.5)).toBeNull();
    expect(evaluateRules([rule({ op: "gte", value: 7.5 })], 7.5)?.flag).toBe("normal");
  });

  it("matches eq exactly", () => {
    const rules = [rule({ op: "eq", value: 0 })];
    expect(evaluateRules(rules, 0)?.flag).toBe("normal");
    expect(evaluateRules(rules, 0.1)).toBeNull();
  });

  it("matches text_eq ignoring case and surrounding space", () => {
    const rules = [rule({ op: "text_eq", text: "Negative" })];
    expect(evaluateRules(rules, "negative")?.flag).toBe("normal");
    expect(evaluateRules(rules, "  NEGATIVE  ")?.flag).toBe("normal");
    expect(evaluateRules(rules, "Positive")).toBeNull();
  });

  it("never matches a numeric rule against text", () => {
    const rules = [rule({ op: "between", min: 0, max: 100 })];
    expect(evaluateRules(rules, "Negative")).toBeNull();
    expect(evaluateRules(rules, "1+")).toBeNull();
  });

  it("returns null for an empty value and an empty rule list", () => {
    expect(evaluateRules([rule({ op: "gt", value: 1 })], "")).toBeNull();
    expect(evaluateRules([], 5)).toBeNull();
  });

  it("returns null when the operator's fields are missing", () => {
    expect(evaluateRules([rule({ op: "between" })], 5)).toBeNull();
    expect(evaluateRules([rule({ op: "gt" })], 5)).toBeNull();
    expect(evaluateRules([rule({ op: "text_eq" })], "x")).toBeNull();
  });
});

describe("evaluateRules — precedence", () => {
  it("returns the first matching rule when several match", () => {
    const rules = [
      rule({ op: "lt", value: 200, label: "Desirable", flag: "normal" }),
      rule({ op: "lt", value: 240, label: "Borderline", flag: "high" }),
    ];
    expect(evaluateRules(rules, 150)?.label).toBe("Desirable");
    expect(evaluateRules(rules, 220)?.label).toBe("Borderline");
  });

  it("skips a rule that does not apply and falls through to the next", () => {
    const rules = [
      rule({ op: "gt", value: 1, label: "Male only", applies_to: { gender: "male" } }),
      rule({ op: "gt", value: 1, label: "Everyone" }),
    ];
    expect(evaluateRules(rules, 5, { gender: "أنثى" })?.label).toBe("Everyone");
    expect(evaluateRules(rules, 5, { gender: "ذكر" })?.label).toBe("Male only");
  });

  it("carries the matched rule's own flag and label", () => {
    const rules = [rule({ op: "gt", value: 240, label: "High", flag: "critical_high" })];
    expect(evaluateRules(rules, 300)).toMatchObject({ flag: "critical_high", label: "High" });
  });
});

describe("canonicalGender", () => {
  it("maps both the Arabic and English spellings", () => {
    expect(canonicalGender("ذكر")).toBe("male");
    expect(canonicalGender("male")).toBe("male");
    expect(canonicalGender("أنثى")).toBe("female");
    expect(canonicalGender("female")).toBe("female");
  });

  it("treats anything else as unknown", () => {
    expect(canonicalGender(undefined)).toBeUndefined();
    expect(canonicalGender("")).toBeUndefined();
    expect(canonicalGender("M")).toBeUndefined();
  });
});

describe("appliesTo", () => {
  it("applies unconditionally when there is no condition", () => {
    expect(appliesTo(rule({ op: "gt", value: 1 }), {})).toBe(true);
  });

  it("filters by gender", () => {
    const r = rule({ op: "gt", value: 1, applies_to: { gender: "female" } });
    expect(appliesTo(r, { gender: "أنثى" })).toBe(true);
    expect(appliesTo(r, { gender: "ذكر" })).toBe(false);
  });

  it("filters by an age window, inclusively", () => {
    const r = rule({ op: "gt", value: 1, applies_to: { min_age: 18, max_age: 60 } });
    expect(appliesTo(r, { age: 18 })).toBe(true);
    expect(appliesTo(r, { age: 60 })).toBe(true);
    expect(appliesTo(r, { age: 17 })).toBe(false);
    expect(appliesTo(r, { age: 61 })).toBe(false);
  });

  it("honours a one-sided age bound", () => {
    const r = rule({ op: "gt", value: 1, applies_to: { min_age: 18 } });
    expect(appliesTo(r, { age: 90 })).toBe(true);
    expect(appliesTo(r, { age: 10 })).toBe(false);
  });

  it("requires both facts when both are constrained", () => {
    const r = rule({ op: "gt", value: 1, applies_to: { gender: "male", min_age: 18 } });
    expect(appliesTo(r, { gender: "male", age: 20 })).toBe(true);
    expect(appliesTo(r, { gender: "female", age: 20 })).toBe(false);
    expect(appliesTo(r, { gender: "male", age: 5 })).toBe(false);
  });

  it("does not apply a constrained rule when the patient fact is unknown", () => {
    expect(appliesTo(rule({ op: "gt", value: 1, applies_to: { gender: "male" } }), {})).toBe(false);
    expect(appliesTo(rule({ op: "gt", value: 1, applies_to: { min_age: 1 } }), {})).toBe(false);
    expect(
      appliesTo(rule({ op: "gt", value: 1, applies_to: { min_age: 1 } }), { age: NaN })
    ).toBe(false);
  });
});

describe("isQualitative / qualitativeOptions", () => {
  it("is qualitative only when every rule is a text match", () => {
    expect(isQualitative([rule({ op: "text_eq", text: "Negative" })])).toBe(true);
    expect(
      isQualitative([rule({ op: "text_eq", text: "Negative" }), rule({ op: "gt", value: 1 })])
    ).toBe(false);
  });

  it("is not qualitative when there are no rules", () => {
    expect(isQualitative([])).toBe(false);
  });

  it("lists text options in authored order, without duplicates or blanks", () => {
    const rules = [
      rule({ op: "text_eq", text: "Negative" }),
      rule({ op: "text_eq", text: "Positive", flag: "high" }),
      rule({ op: "text_eq", text: "negative" }),
      rule({ op: "text_eq", text: "  " }),
    ];
    expect(qualitativeOptions(rules)).toEqual(["Negative", "Positive"]);
  });
});

describe("hasNumericRule", () => {
  it("is true when any applicable rule compares against a number", () => {
    expect(hasNumericRule([rule({ op: "between", min: 1, max: 2 })])).toBe(true);
    expect(hasNumericRule([rule({ op: "text_eq", text: "Negative" })])).toBe(false);
    expect(hasNumericRule([])).toBe(false);
  });

  it("ignores a numeric rule that does not apply to the patient", () => {
    const rules = [rule({ op: "gt", value: 1, applies_to: { gender: "male" } })];
    expect(hasNumericRule(rules, { gender: "female" })).toBe(false);
    expect(hasNumericRule(rules, { gender: "male" })).toBe(true);
  });
});

describe("numericBand", () => {
  it("takes the first normal-flagged interval", () => {
    const rules = [
      rule({ op: "gt", value: 11, flag: "high" }),
      rule({ op: "between", min: 4, max: 11 }),
    ];
    expect(numericBand(rules)).toEqual({ min: 4, max: 11 });
  });

  it("treats a normal upper bound as a band from zero", () => {
    expect(numericBand([rule({ op: "lte", value: 7.5 })])).toEqual({ min: 0, max: 7.5 });
  });

  it("returns null when no normal rule describes an interval", () => {
    expect(numericBand([rule({ op: "text_eq", text: "Negative" })])).toBeNull();
    expect(numericBand([rule({ op: "gt", value: 5 })])).toBeNull();
    expect(numericBand([])).toBeNull();
  });

  it("ignores a band that does not apply to the patient", () => {
    const rules = [rule({ op: "between", min: 13, max: 17, applies_to: { gender: "male" } })];
    expect(numericBand(rules, { gender: "female" })).toBeNull();
  });
});

describe("formatRules", () => {
  it("shows a lone normal range as the bare bounds, as before the migration", () => {
    expect(formatRules([rule({ op: "between", min: 4, max: 11 })])).toBe("4 - 11");
  });

  it("labels each rule once there is more than one", () => {
    const rules = [
      rule({ op: "lt", value: 200, label: "Desirable" }),
      rule({ op: "gte", value: 240, label: "High", flag: "high" }),
    ];
    expect(formatRules(rules)).toBe("Desirable: < 200 | High: ≥ 240");
  });

  it("shows the text of a qualitative rule", () => {
    const rules = [
      rule({ op: "text_eq", text: "Negative" }),
      rule({ op: "text_eq", text: "Positive", label: "Positive", flag: "high" }),
    ];
    expect(formatRules(rules)).toBe("Normal: Negative | Positive: Positive");
  });

  it("returns a dash for no rules and for rules that do not apply", () => {
    expect(formatRules([])).toBe("-");
    expect(
      formatRules([rule({ op: "gt", value: 1, applies_to: { gender: "male" } })], {
        gender: "female",
      })
    ).toBe("-");
  });

  it("shows only the rules applying to this patient", () => {
    const rules = [
      rule({ op: "between", min: 13, max: 17, applies_to: { gender: "male" } }),
      rule({ op: "between", min: 12, max: 15, applies_to: { gender: "female" } }),
    ];
    expect(formatRules(rules, { gender: "ذكر" })).toBe("13 - 17");
  });
});

describe("validateRules", () => {
  it("accepts a well-formed list and an empty list", () => {
    expect(validateRules([]).ok).toBe(true);
    expect(validateRules([rule({ op: "between", min: 1, max: 2 })]).ok).toBe(true);
  });

  it("rejects a missing label", () => {
    expect(validateRules([rule({ op: "gt", value: 1, label: "  " })]).ok).toBe(false);
  });

  it("rejects missing operands", () => {
    expect(validateRules([rule({ op: "between", min: 1 })]).ok).toBe(false);
    expect(validateRules([rule({ op: "gt" })]).ok).toBe(false);
    expect(validateRules([rule({ op: "text_eq", text: "" })]).ok).toBe(false);
  });

  it("rejects an inverted range and an inverted age window", () => {
    expect(validateRules([rule({ op: "between", min: 10, max: 1 })]).ok).toBe(false);
    expect(
      validateRules([rule({ op: "gt", value: 1, applies_to: { min_age: 60, max_age: 18 } })]).ok
    ).toBe(false);
  });

  it("reports one error per problem, naming the rule's position", () => {
    const result = validateRules([rule({ op: "between", label: "" })]);
    expect(result.errors).toHaveLength(3);
    expect(result.errors.every((e) => e.startsWith("Rule 1:"))).toBe(true);
  });
});

describe("validateValue", () => {
  it("accepts an empty value, since a test may be left blank", () => {
    expect(validateValue("", [rule({ op: "between", min: 1, max: 2 })]).isValid).toBe(true);
  });

  it("accepts any text when no rule is numeric", () => {
    expect(validateValue("1+", []).isValid).toBe(true);
    expect(validateValue("Negative", [rule({ op: "text_eq", text: "Negative" })]).isValid).toBe(
      true
    );
  });

  it("rejects text and negatives when a numeric rule exists", () => {
    const rules = [rule({ op: "between", min: 1, max: 2 })];
    expect(validateValue("abc", rules).isValid).toBe(false);
    expect(validateValue("-1", rules).isValid).toBe(false);
    expect(validateValue("1.5", rules).isValid).toBe(true);
  });
});

describe("TEXT_PRESETS", () => {
  it("offers Positive and Negative as ready-made equals-text values", () => {
    expect([...TEXT_PRESETS]).toEqual(["Positive", "Negative"]);
  });

  it("makes a preset-only test qualitative, so entry becomes a dropdown", () => {
    const rules = TEXT_PRESETS.map((text) =>
      rule({ op: "text_eq", text, label: text, flag: text === "Positive" ? "high" : "normal" })
    );
    expect(isQualitative(rules)).toBe(true);
    expect(qualitativeOptions(rules)).toEqual(["Positive", "Negative"]);
    expect(evaluateRules(rules, "positive")?.flag).toBe("high");
    expect(evaluateRules(rules, "Negative")?.flag).toBe("normal");
  });
});

describe("a test with both text and numeric rules", () => {
  // The shape of PCR HCV in production: reports either "Negative" or a titre.
  const viralLoad: ReferenceRule[] = [
    rule({ op: "text_eq", text: "Negative", label: "normal", flag: "normal" }),
    rule({ op: "lte", value: 21, label: "detection limit", flag: "detection_limit" }),
    rule({ op: "lt", value: 100000, label: "low", flag: "low" }),
    rule({ op: "between", min: 100000, max: 1000000, label: "moderate", flag: "moderate" }),
    rule({ op: "gt", value: 1000000, label: "high", flag: "high" }),
  ];

  it("is not qualitative, but still offers its text values", () => {
    expect(isQualitative(viralLoad)).toBe(false);
    expect(hasTextRule(viralLoad)).toBe(true);
    expect(hasNumericRule(viralLoad)).toBe(true);
    expect(qualitativeOptions(viralLoad)).toEqual(["Negative"]);
  });

  it("accepts the text its own rules name, not only numbers", () => {
    expect(validateValue("Negative", viralLoad).isValid).toBe(true);
    expect(validateValue("negative", viralLoad).isValid).toBe(true);
    expect(validateValue("5000", viralLoad).isValid).toBe(true);
  });

  it("still rejects text no rule names", () => {
    expect(validateValue("banana", viralLoad).isValid).toBe(false);
  });

  it("flags each band, text and numeric alike", () => {
    expect(evaluateRules(viralLoad, "Negative")?.flag).toBe("normal");
    expect(evaluateRules(viralLoad, 20)?.flag).toBe("detection_limit");
    expect(evaluateRules(viralLoad, 5000)?.flag).toBe("low");
    expect(evaluateRules(viralLoad, 500000)?.flag).toBe("moderate");
    expect(evaluateRules(viralLoad, 2000000)?.flag).toBe("high");
  });
});
