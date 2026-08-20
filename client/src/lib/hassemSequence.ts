export type HassemNextAction = "due_reviews" | "bac_diagnostic";

export function getHassemNextAction(dueReviewCount: number): HassemNextAction {
  return dueReviewCount > 0 ? "due_reviews" : "bac_diagnostic";
}

export function isHassemDiagnosticLocked(dueReviewCount: number): boolean {
  return getHassemNextAction(dueReviewCount) === "due_reviews";
}

export function getHassemDiagnosticHref(dueReviewCount: number): string | null {
  return isHassemDiagnosticLocked(dueReviewCount) ? null : "/hassem/diagnostic";
}
