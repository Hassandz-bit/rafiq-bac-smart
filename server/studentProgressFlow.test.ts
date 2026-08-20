import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { recordStudentAttempt } from "./studentAttempts";

function rowsQuery(rows: unknown[]) {
  const query = {
    from: () => query,
    innerJoin: () => query,
    where: () => query,
    limit: () => Promise.resolve(rows),
  };
  return query;
}

describe("تدفق تقدّم الطالب بعد المحاولة", () => {
  beforeEach(() => vi.resetAllMocks());

  it("يسجل الخطأ ويحدّث الإتقان وينشئ مراجعة مستحقة لتمرين مؤهل", async () => {
    const attemptValues = vi.fn().mockResolvedValue(undefined);
    const masteryDuplicate = vi.fn().mockResolvedValue(undefined);
    const masteryValues = vi.fn().mockReturnValue({ onDuplicateKeyUpdate: masteryDuplicate });
    const errorValues = vi.fn().mockResolvedValue(undefined);
    const reviewValues = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn()
      .mockReturnValueOnce({ values: attemptValues })
      .mockReturnValueOnce({ values: masteryValues })
      .mockReturnValueOnce({ values: errorValues })
      .mockReturnValueOnce({ values: reviewValues });
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(rowsQuery([{ id: 7, lessonId: 11, type: "mcq", answerDefinition: { answer: "A" }, workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "verified", subjectCode: "math" }]))
        .mockReturnValueOnce(rowsQuery([{ conceptId: 101 }]))
        .mockReturnValueOnce(rowsQuery([])),
      insert,
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(recordStudentAttempt({ userId: 42, exerciseId: 7, answerPayload: "B", hintsUsed: 0, revealedSteps: 0, durationSeconds: 38, errorType: "شرط التعويض" })).resolves.toEqual({ isCorrect: false, reviewQueued: true });
    expect(attemptValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, exerciseId: 7, isCorrect: false, errorType: "شرط التعويض" }));
    expect(masteryValues).toHaveBeenCalledWith({ userId: 42, conceptId: 101, score: "30", status: "understand" });
    expect(masteryDuplicate).toHaveBeenCalledWith({ set: { score: "30", status: "understand" } });
    expect(errorValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, exerciseId: 7, errorType: "شرط التعويض" }));
    expect(reviewValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, exerciseId: 7, reason: "failed_question" }));
  });

  it("ينشئ مراجعة للحل الصحيح عند الإفراط في التلميحات دون إضافة خطأ جديد", async () => {
    const attemptValues = vi.fn().mockResolvedValue(undefined);
    const masteryDuplicate = vi.fn().mockResolvedValue(undefined);
    const masteryValues = vi.fn().mockReturnValue({ onDuplicateKeyUpdate: masteryDuplicate });
    const reviewValues = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValueOnce({ values: attemptValues }).mockReturnValueOnce({ values: masteryValues }).mockReturnValueOnce({ values: reviewValues });
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(rowsQuery([{ id: 7, lessonId: 11, type: "mcq", answerDefinition: { answer: "A" }, workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "verified", subjectCode: "math" }]))
        .mockReturnValueOnce(rowsQuery([{ conceptId: 101 }])),
      insert,
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(recordStudentAttempt({ userId: 42, exerciseId: 7, answerPayload: "A", hintsUsed: 2, revealedSteps: 0, durationSeconds: 22 })).resolves.toEqual({ isCorrect: true, reviewQueued: true });
    expect(masteryValues).toHaveBeenCalledWith({ userId: 42, conceptId: 101, score: "76", status: "practice" });
    expect(insert).toHaveBeenCalledTimes(3);
    expect(reviewValues).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, exerciseId: 7, reason: "heavy_hint_usage" }));
  });
});
