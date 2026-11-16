import { describe, expect, it } from "vitest";
import {
  buildPatch,
  hiddenSharedTests,
  mergeLabTests,
  pickOverridable,
  type LabTestOverride,
} from "./lab-tests";
import type { LabTest } from "@/types/results";

const LAB_A = "lab-a";
const LAB_B = "lab-b";

const shared = (uuid: string, display_order: number, extra: Partial<LabTest> = {}): LabTest => ({
  uuid,
  lab_id: null,
  test_code: uuid.toUpperCase(),
  test_name_ar: `اسم ${uuid}`,
  test_name_en: `Name ${uuid}`,
  category: "Hematology",
  unit: "g/dL",
  reference_ranges: [],
  is_active: true,
  display_order,
  created_at: "",
  updated_at: "",
  ...extra,
});

const own = (uuid: string, lab_id: string, display_order: number): LabTest =>
  shared(uuid, display_order, { lab_id });

const override = (
  lab_id: string,
  test_uuid: string,
  patch: LabTestOverride["patch"] = {},
  is_hidden = false
): LabTestOverride => ({ lab_id, test_uuid, patch, is_hidden });

describe("mergeLabTests", () => {
  it("shows every shared test to a lab with no overrides", () => {
    const rows = [shared("a", 2), shared("b", 1)];
    const view = mergeLabTests(rows, [], LAB_A);

    expect(view.map((t) => t.uuid)).toEqual(["b", "a"]);
    expect(view.every((t) => t.source === "shared" && !t.overridden)).toBe(true);
  });

  it("applies only the overridden fields and leaves the rest shared", () => {
    const rows = [shared("a", 1)];
    const view = mergeLabTests(rows, [override(LAB_A, "a", { unit: "mg/dL" })], LAB_A);

    expect(view[0].unit).toBe("mg/dL");
    expect(view[0].test_name_ar).toBe("اسم a");
    expect(view[0].overridden).toBe(true);
  });

  it("lets a lab clear a field with null", () => {
    const rows = [shared("a", 1)];
    const view = mergeLabTests(rows, [override(LAB_A, "a", { unit: null })], LAB_A);

    expect(view[0].unit).toBeUndefined();
  });

  it("does not leak one lab's overrides into another lab", () => {
    const rows = [shared("a", 1)];
    const overrides = [override(LAB_A, "a", { unit: "mg/dL" })];
    const viewB = mergeLabTests(rows, overrides.filter((o) => o.lab_id === LAB_B), LAB_B);

    expect(viewB[0].unit).toBe("g/dL");
    expect(viewB[0].overridden).toBe(false);
  });

  it("drops shared tests the lab has hidden", () => {
    const rows = [shared("a", 1), shared("b", 2)];
    const view = mergeLabTests(rows, [override(LAB_A, "a", {}, true)], LAB_A);

    expect(view.map((t) => t.uuid)).toEqual(["b"]);
  });

  it("includes the lab's own tests only for that lab", () => {
    const rows = [shared("a", 1), own("x", LAB_A, 2), own("y", LAB_B, 3)];

    expect(mergeLabTests(rows, [], LAB_A).map((t) => t.uuid)).toEqual(["a", "x"]);
    expect(mergeLabTests(rows, [], LAB_B).map((t) => t.uuid)).toEqual(["a", "y"]);
  });

  it("manager view (labId null) returns shared tests only", () => {
    const rows = [shared("a", 1), own("x", LAB_A, 2)];
    const view = mergeLabTests(rows, [override(LAB_A, "a", { unit: "mg/dL" })], null);

    expect(view.map((t) => t.uuid)).toEqual(["a"]);
    expect(view[0].unit).toBe("g/dL");
  });

  it("orders by display_order with uuid as a stable tiebreaker", () => {
    const rows = [shared("b", 1), shared("a", 1)];
    expect(mergeLabTests(rows, [], LAB_A).map((t) => t.uuid)).toEqual(["a", "b"]);
  });
});

describe("hiddenSharedTests", () => {
  it("returns only the shared tests this lab hid", () => {
    const rows = [shared("a", 1), shared("b", 2), own("x", LAB_A, 3)];
    const hidden = hiddenSharedTests(
      rows,
      [override(LAB_A, "a", {}, true), override(LAB_B, "b", {}, true)],
      LAB_A
    );

    expect(hidden.map((t) => t.uuid)).toEqual(["a"]);
  });
});

describe("buildPatch", () => {
  it("stores only the fields that differ from the shared value", () => {
    const base = shared("a", 1);
    const patch = buildPatch({}, base, { unit: "mg/dL", test_name_ar: base.test_name_ar });

    expect(patch).toEqual({ unit: "mg/dL" });
  });

  it("removes a field from the patch when it returns to the shared value", () => {
    const base = shared("a", 1);
    const patch = buildPatch({ unit: "mg/dL" }, base, { unit: "g/dL" });

    expect(patch).toEqual({});
  });

  it("treats an empty unit and a missing unit as the same", () => {
    const base = shared("a", 1, { unit: undefined });
    expect(buildPatch({}, base, { unit: null })).toEqual({});
  });

  it("keeps unrelated existing overrides", () => {
    const base = shared("a", 1);
    const patch = buildPatch({ unit: "mg/dL" }, base, { display_order: 9 });

    expect(patch).toEqual({ unit: "mg/dL", display_order: 9 });
  });
});

describe("pickOverridable", () => {
  it("drops fields a lab may not change", () => {
    const picked = pickOverridable({
      test_code: "X",
      is_active: true,
      unit: "mg/dL",
      display_order: 3,
    } as Partial<LabTest>);

    expect(picked).toEqual({ unit: "mg/dL", display_order: 3 });
  });
});
