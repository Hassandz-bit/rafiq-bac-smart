import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ reviewLearningItem: vi.fn(), getCurrentCurriculumOverview: vi.fn(), getSourceRegistryForStudio: vi.fn(), getStudioReviewQueue: vi.fn(), getStudentAccessibleExercises: vi.fn(), getStudentPublishedLearningItems: vi.fn(), getStudentVisibleVisualAssets: vi.fn() }));
vi.mock("./contentReview", () => ({ reviewLearningItem: mocks.reviewLearningItem }));
vi.mock("./curriculum", () => ({ getCurrentCurriculumOverview: mocks.getCurrentCurriculumOverview, getSourceRegistryForStudio: mocks.getSourceRegistryForStudio, getStudioReviewQueue: mocks.getStudioReviewQueue, getStudentAccessibleExercises: mocks.getStudentAccessibleExercises, getStudentPublishedLearningItems: mocks.getStudentPublishedLearningItems, getStudentVisibleVisualAssets: mocks.getStudentVisibleVisualAssets }));
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const reviewer = { id: 7, openId: "reviewer", email: "reviewer@example.com", name: "مراجع", loginMethod: "manus", role: "academic_reviewer" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const editor = { ...reviewer, id: 8, openId: "editor", role: "content_editor" as const };

describe("studio.reviewLearningItem", () => {
  it("يقبل قرار المراجع ويرفض المحرر ولا يعرض مسار نشر", async () => {
    mocks.reviewLearningItem.mockResolvedValue({ learningItemId: 90001, workflowState: "approved", decision: "approved", publicationBlocked: true, publishActionAvailable: false });
    await expect(appRouter.createCaller(context(reviewer)).studio.reviewLearningItem({ learningItemId: 90001, decision: "approved", noteAr: "تمت المراجعة" })).resolves.toMatchObject({ publicationBlocked: true, publishActionAvailable: false });
    expect(mocks.reviewLearningItem).toHaveBeenCalledWith(expect.objectContaining({ role: "academic_reviewer", reviewerUserId: 7 }));
    await expect(appRouter.createCaller(context(editor)).studio.reviewLearningItem({ learningItemId: 90001, decision: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
