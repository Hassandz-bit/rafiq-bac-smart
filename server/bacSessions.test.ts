import { describe, expect, it } from "vitest";
import { rescuePlanLevel } from "./bacRules";

describe("تحليل جلسة BAC", () => {
  it("يختار مستوى خطة إنقاذ متناسبًا مع الوقت والإتقان والدروس المتبقية", () => {
    expect(rescuePlanLevel({ remainingDays: 9, masteryAverage: 38, incompleteLessons: 8 })).toBe("rescue");
    expect(rescuePlanLevel({ remainingDays: 35, masteryAverage: 82, incompleteLessons: 0 })).toBe("refine");
  });
});
