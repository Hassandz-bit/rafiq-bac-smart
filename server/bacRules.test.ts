import { describe, expect, it } from "vitest";
import { bacFocusPolicy, rescuePlanLevel } from "./bacRules";

describe("وضع BAC وخطة الإنقاذ", () => {
  it("يعطل التلميحات والحلول داخل جلسة التركيز", () => {
    expect(bacFocusPolicy()).toMatchObject({ hintsAllowed: false, solutionsAllowed: false, autosave: true });
  });

  it("يرفع حالة الإنقاذ عند ضيق الوقت وضعف الإتقان", () => {
    expect(rescuePlanLevel({ remainingDays: 20, masteryAverage: 35, incompleteLessons: 9 })).toBe("rescue");
    expect(rescuePlanLevel({ remainingDays: 80, masteryAverage: 92, incompleteLessons: 0 })).toBe("refine");
  });
});
