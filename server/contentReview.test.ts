import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), updateWhere: vi.fn(), insertValues: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
import { reviewLearningItem } from "./contentReview";

function mockDb(workflowState: "in_review" | "approved" = "in_review") {
  const item = { id: 90001, workflowState, sourceStatus: "historical_official" as const, isInternalPilot: true };
  const tx = {
    update: () => ({ set: (value: unknown) => ({ where: () => { mocks.updateWhere(value); return Promise.resolve(); } }) }),
    insert: () => ({ values: (value: unknown) => { mocks.insertValues(value); return Promise.resolve(); } }),
  };
  return {
    select: () => ({ from: () => ({ leftJoin: () => ({ where: () => ({ limit: () => Promise.resolve([item]) }) }) }) }),
    transaction: async (callback: (client: typeof tx) => Promise<void>) => callback(tx),
  };
}

describe("قرار المراجعة الأكاديمية", () => {
  beforeEach(() => { mocks.getDb.mockReset(); mocks.updateWhere.mockReset(); mocks.insertValues.mockReset(); });

  it("يسجل اعتماد المراجع كحالة approved مدققة دون إتاحة نشر", async () => {
    mocks.getDb.mockResolvedValue(mockDb());
    await expect(reviewLearningItem({ reviewerUserId: 7, role: "academic_reviewer", learningItemId: 90001, decision: "approved", noteAr: "مطابقة أولية للمصدر." })).resolves.toEqual({ learningItemId: 90001, workflowState: "approved", decision: "approved", publicationBlocked: true, publishActionAvailable: false });
    expect(mocks.updateWhere).toHaveBeenCalledWith({ workflowState: "approved" });
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.objectContaining({ learningItemId: 90001, decision: "approved", reviewerUserId: 7 }));
  });

  it("يرفض قرار محرر المحتوى ويعيد التعديل المطلوب إلى draft", async () => {
    mocks.getDb.mockResolvedValue(mockDb());
    await expect(reviewLearningItem({ reviewerUserId: 5, role: "content_editor", learningItemId: 90001, decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reviewLearningItem({ reviewerUserId: 7, role: "academic_reviewer", learningItemId: 90001, decision: "changes_requested" })).resolves.toMatchObject({ workflowState: "draft", publicationBlocked: true });
  });
});
