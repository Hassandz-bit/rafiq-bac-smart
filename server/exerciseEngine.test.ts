import { describe, expect, it } from "vitest";
import { canRevealSolution, gradeExercise, nextHintIndex } from "./exerciseEngine";
import { errorTypesForSubject } from "./errorClassification";
import { canAccessSubject, resolveUnitAccess, subscriptionPlans } from "./entitlementRules";
import { canTransitionContent } from "./workflowRules";

describe("محرك التمرين والتعلم", () => {
  it("يصحح الإجابات الرقمية واختيارات متعددة", () => {
    expect(gradeExercise({ type: "numeric", answer: 3.14, tolerance: .01 }, 3.145)).toBe(true);
    expect(gradeExercise({ type: "multi_select", answer: ["a", "c"] }, ["c", "a"])).toBe(true);
  });
  it("يدعم كل أنواع الإجابة المطلوبة دون تغيير دلالتها", () => {
    expect(gradeExercise({ type: "mcq", answer: "b" }, "B")).toBe(true);
    expect(gradeExercise({ type: "true_false", answer: "صحيح" }, "صحيح")).toBe(true);
    expect(gradeExercise({ type: "fill", answer: "المعادلة" }, "المعادلة")).toBe(true);
    expect(gradeExercise({ type: "matching", answer: ["أ:1", "ب:2"] }, ["ب:2", "أ:1"])).toBe(true);
    expect(gradeExercise({ type: "ordering", answer: ["أ", "ب", "ج"] }, ["أ", "ب", "ج"])).toBe(true);
    expect(gradeExercise({ type: "ordering", answer: ["أ", "ب", "ج"] }, ["ب", "أ", "ج"])).toBe(false);
    expect(gradeExercise({ type: "math_expression", answer: "x^2" }, "x^2")).toBe(true);
    expect(gradeExercise({ type: "interactive_image", answer: "region-4" }, "region-4")).toBe(true);
  });
  it("يتدرج في التلميحات قبل كشف الحل", () => {
    expect(nextHintIndex(1, 3)).toBe(1);
    expect(canRevealSolution(2, 3)).toBe(false);
    expect(canRevealSolution(3, 3)).toBe(true);
  });
  it("يفصل أنواع الخطأ حسب المادة ويطبق الوصول المجاني", () => {
    expect(errorTypesForSubject("physics")).toContain("unit_conversion");
    expect(canAccessSubject({ subject: "math", entitlements: [], hasFreeUnit: true })).toBe(true);
    expect(resolveUnitAccess({ subject: "physics", entitlements: [], isFreeUnit: false })).toEqual({ allowed: false, reason: "subscription_required" });
    expect(resolveUnitAccess({ subject: "natural_sciences", entitlements: [], isFreeUnit: true })).toEqual({ allowed: true, reason: "free_unit" });
    expect(subscriptionPlans.three_subjects.subjectCount).toBe(3);
  });
  it("يمنع النشر عند غياب المصدر الحالي", () => {
    expect(canTransitionContent({ role: "academic_reviewer", from: "approved", to: "published", sourceStatus: "official_but_version_unconfirmed", reviewerApproved: true })).toBe(false);
  });
});
