import { describe, expect, it } from "vitest";
import { isSafeInternalMathPilot } from "./pilotSafety";

describe("سلامة Pilot الرياضي الداخلي", () => {
  const validSnapshot = {
    sourceStatus: "historical_official",
    isInternalPilot: true,
    unitState: "draft",
    lessonState: "draft",
    itemTypes: ["concept", "formula", "step_by_step", "example", "bac_tip"],
    mindMapState: "draft",
    nodeCount: 4,
    edgeCount: 3,
    exerciseState: "draft",
    hintCount: 3,
  } as const;

  it("يتطلب جميع عناصر التجربة الداخلية المتوقعة في حالة المسودة", () => {
    expect(isSafeInternalMathPilot(validSnapshot)).toBe(true);
  });

  it("يرفض أي مصدر غير داخلي أو عنصر منشور أو خريطة غير مكتملة", () => {
    expect(isSafeInternalMathPilot({ ...validSnapshot, isInternalPilot: false })).toBe(false);
    expect(isSafeInternalMathPilot({ ...validSnapshot, exerciseState: "published" })).toBe(false);
    expect(isSafeInternalMathPilot({ ...validSnapshot, edgeCount: 2 })).toBe(false);
  });
});
