import { describe, expect, it } from "vitest";
import { getHassemDiagnosticHref, getHassemNextAction, isHassemDiagnosticLocked } from "./hassemSequence";

describe("Hassem review-first sequence", () => {
  it("prioritizes due reviews and keeps the diagnostic locked while they exist", () => {
    expect(getHassemNextAction(2)).toBe("due_reviews");
    expect(isHassemDiagnosticLocked(2)).toBe(true);
  });

  it("unlocks the BAC diagnostic when no due reviews remain", () => {
    expect(getHassemNextAction(0)).toBe("bac_diagnostic");
    expect(isHassemDiagnosticLocked(0)).toBe(false);
    expect(getHassemDiagnosticHref(0)).toBe("/hassem/diagnostic");
  });

  it("does not offer a diagnostic handoff while due reviews are outstanding", () => {
    expect(getHassemDiagnosticHref(1)).toBeNull();
  });
});
