import { describe, expect, it } from "vitest";
import { isStudentSafeExercise } from "./studentAttempts";

describe("بوابة محاولة الطالب", () => {
  const visible = { workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, sourceGate: "verified" } as const;

  it("تتيح المحاولة فقط لمصدر حالي منشور وغير تجريبي", () => {
    expect(isStudentSafeExercise(visible)).toBe(true);
    expect(isStudentSafeExercise({ ...visible, isInternalPilot: true })).toBe(false);
    expect(isStudentSafeExercise({ ...visible, sourceStatus: "historical_official" })).toBe(false);
    expect(isStudentSafeExercise({ ...visible, sourceGate: "waiting_for_current_official_book" })).toBe(false);
  });
});
