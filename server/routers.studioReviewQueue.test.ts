import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getCurrentCurriculumOverview: vi.fn(), getSourceRegistryForStudio: vi.fn(), getStudioReviewQueue: vi.fn(), getStudentAccessibleExercises: vi.fn(), getStudentPublishedLearningItems: vi.fn(), getStudentVisibleVisualAssets: vi.fn() }));
vi.mock("./curriculum", () => mocks);
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const editor = { id: 2, openId: "studio-editor", email: "editor@example.com", name: "محرر", loginMethod: "manus", role: "content_editor" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...editor, id: 42, openId: "studio-student", role: "student" as const };

describe("studio.reviewQueue", () => {
  it("يعرض طابور المراجعة لفريق المحتوى فقط", async () => {
    mocks.getStudioReviewQueue.mockResolvedValue([{ id: 90001, workflowState: "in_review" }]);
    await expect(appRouter.createCaller(context(editor)).studio.reviewQueue()).resolves.toEqual([{ id: 90001, workflowState: "in_review" }]);
    await expect(appRouter.createCaller(context(student)).studio.reviewQueue()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.reviewQueue()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
