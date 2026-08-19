import { describe, expect, it } from "vitest";
import { canRevealSolution, gradeExercise, nextHintIndex } from "./exerciseEngine";
import { errorTypesForSubject } from "./errorClassification";
import { canAccessSubject } from "./entitlementRules";
import { canTransitionContent } from "./workflowRules";

describe("محرك التمرين والتعلم", () => {
  it("يصحح الإجابات الرقمية واختيارات متعددة", () => {
    expect(gradeExercise({ type: "numeric", answer: 3.14, tolerance: .01 }, 3.145)).toBe(true);
    expect(gradeExercise({ type: "multi_select", answer: ["a", "c"] }, ["c", "a"])).toBe(true);
  });
  it("يتدرج في التلميحات قبل كشف الحل", () => {
    expect(nextHintIndex(1, 3)).toBe(1);
    expect(canRevealSolution(2, 3)).toBe(false);
    expect(canRevealSolution(3, 3)).toBe(true);
  });
  it("يفصل أنواع الخطأ حسب المادة ويطبق الوصول المجاني", () => {
    expect(errorTypesForSubject("physics")).toContain("unit_conversion");
    expect(canAccessSubject({ subject: "math", entitlements: [], hasFreeUnit: true })).toBe(true);
  });
  it("يمنع النشر عند غياب المصدر الحالي", () => {
    expect(canTransitionContent({ role: "academic_reviewer", from: "approved", to: "published", sourceStatus: "official_but_version_unconfirmed", reviewerApproved: true })).toBe(false);
  });
});
