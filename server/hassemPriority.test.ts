import { describe, expect, it } from "vitest";
import { buildHassemPlan, scoreHassemPriority } from "./hassemPriority";

describe("Hassem priority", () => {
  it("raises weak repeated-error units above mastered units", () => {
    const plan = buildHassemPlan([
      { unitId: 1, unitTitleAr: "ضعيف", mastery: 30, diagnostic: 35, repeatedErrors: 3, prerequisiteImpact: 4, bacRelevance: 4 },
      { unitId: 2, unitTitleAr: "متقن", mastery: 90, diagnostic: 90, repeatedErrors: 0, prerequisiteImpact: 1, bacRelevance: 2 },
    ], 15);
    expect(plan[0]?.unitId).toBe(1);
    expect(plan[0]?.state).toBe("priority");
  });
  it("increases urgency when remaining time is shorter", () => {
    const base = { unitId: 1, unitTitleAr: "اختبار", mastery: 60, diagnostic: 60, repeatedErrors: 1, prerequisiteImpact: 2, bacRelevance: 2 };
    expect(scoreHassemPriority(base, 10).priorityScore).toBeGreaterThan(scoreHassemPriority(base, 30).priorityScore);
  });
});
