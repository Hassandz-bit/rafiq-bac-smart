import { describe, expect, it } from "vitest";
import { deriveMasteryState, deriveReviewReasons } from "./learningRules";

describe("قواعد الإتقان والمراجعة", () => {
  it("لا تمنح الإتقان بمجرد وجود محاولة", () => {
    expect(deriveMasteryState({ accuracy: 92, averageHints: 0, completedReviews: 0, attempted: 3 })).toBe("near_mastery");
    expect(deriveMasteryState({ accuracy: 92, averageHints: 0, completedReviews: 2, attempted: 3 })).toBe("mastered");
  });

  it("يجمع أسباب إدراج عنصر في قائمة المراجعة", () => {
    expect(deriveReviewReasons({ repeatedErrors: 2, failedQuestions: 1, heavyHintUsage: false, due: true })).toEqual(["repeated_error", "failed_question", "due_review"]);
  });
});
