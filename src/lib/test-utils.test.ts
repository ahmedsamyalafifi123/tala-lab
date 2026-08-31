import { describe, expect, it } from "vitest";
import { getFlagColor, getFlagIcon, getFlagLabel, isAbnormalFlag } from "./test-utils";
import type { ResultFlag } from "@/types/results";

const ALL_FLAGS: ResultFlag[] = [
  "normal",
  "moderate",
  "high",
  "low",
  "critical_high",
  "critical_low",
  "detection_limit",
];

describe("flag display", () => {
  it("gives every flag a label, an icon, and a colour", () => {
    ALL_FLAGS.forEach((flag) => {
      expect(getFlagLabel(flag), flag).not.toBe("");
      expect(getFlagIcon(flag), flag).not.toBe("");
      expect(getFlagColor(flag), flag).toContain("text-");
    });
  });

  it("labels the two newest flags", () => {
    expect(getFlagLabel("moderate")).toBe("Moderate");
    expect(getFlagLabel("detection_limit")).toBe("Detection Limit");
  });

  it("falls back rather than throwing on a flag it does not know", () => {
    const unknown = "not_a_flag" as ResultFlag;
    expect(getFlagLabel(unknown)).toBe("");
    expect(getFlagColor(unknown)).toContain("text-gray");
  });
});

describe("isAbnormalFlag", () => {
  it("treats normal and detection limit as not needing attention", () => {
    expect(isAbnormalFlag("normal")).toBe(false);
    expect(isAbnormalFlag("detection_limit")).toBe(false);
  });

  it("treats moderate and the rest as needing attention", () => {
    expect(isAbnormalFlag("moderate")).toBe(true);
    expect(isAbnormalFlag("high")).toBe(true);
    expect(isAbnormalFlag("low")).toBe(true);
    expect(isAbnormalFlag("critical_high")).toBe(true);
    expect(isAbnormalFlag("critical_low")).toBe(true);
  });

  it("does not mark an unknown flag abnormal", () => {
    expect(isAbnormalFlag("not_a_flag" as ResultFlag)).toBe(false);
  });
});
