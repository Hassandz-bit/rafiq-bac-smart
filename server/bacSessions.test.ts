import { describe, expect, it } from "vitest";
import { analyzeBacResult, rescuePlanLevel } from "./bacRules";

describe("تحليل جلسة BAC", () => {
  it("يختار مستوى خطة إنقاذ متناسبًا مع الوقت والإتقان والدروس المتبقية", () => {
    expect(rescuePlanLevel({ remainingDays: 9, masteryAverage: 38, incompleteLessons: 8 })).toBe("rescue");
    expect(rescuePlanLevel({ remainingDays: 35, masteryAverage: 82, incompleteLessons: 0 })).toBe("refine");
  });

  it("يحوّل النتيجة والإتقان والتراكم المسجل إلى مؤشرات وخطوات إنقاذ عربية صريحة", () => {
    const analysis = analyzeBacResult({ score: 41, elapsedSeconds: 1800, masteryAverage: 38, incompleteLessons: 9, remainingDays: 12 });
    expect(analysis.rescueLevel).toBe("rescue");
    expect(analysis.signals).toEqual(expect.arrayContaining(["العلامة المسجلة: 41/100.", "الأيام المتبقية في الخطة: 12."]));
    expect(analysis.actionsAr).toContain("أكمل مراجعة مستحقة واحدة الآن.");
  });
});
