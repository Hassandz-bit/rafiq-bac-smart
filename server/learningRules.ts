export type MasteryState = "start" | "understand" | "practice" | "near_mastery" | "mastered";

export function deriveMasteryState(input: { accuracy: number; averageHints: number; completedReviews: number; attempted: number }): MasteryState {
  if (input.attempted === 0) return "start";
  if (input.accuracy < 45) return "understand";
  if (input.accuracy < 70 || input.averageHints > 1.5) return "practice";
  if (input.accuracy < 88 || input.completedReviews < 2) return "near_mastery";
  return "mastered";
}

export function deriveReviewReasons(input: { repeatedErrors: number; failedQuestions: number; heavyHintUsage: boolean; due: boolean }) {
  const reasons: string[] = [];
  if (input.repeatedErrors > 0) reasons.push("repeated_error");
  if (input.failedQuestions > 0) reasons.push("failed_question");
  if (input.heavyHintUsage) reasons.push("heavy_hint_usage");
  if (input.due) reasons.push("due_review");
  return reasons;
}
