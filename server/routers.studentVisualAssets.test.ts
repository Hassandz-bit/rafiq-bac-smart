import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const curriculumMocks = vi.hoisted(() => ({
  getCurrentCurriculumOverview: vi.fn(),
  getSourceRegistryForStudio: vi.fn(),
  getStudentPublishedLearningItems: vi.fn(),
  getStudentVisibleVisualAssets: vi.fn(),
}));

vi.mock("./curriculum", () => curriculumMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const student = {
  id: 42, openId: "student-visual-gate", email: "student@example.com", name: "طالب تجريبي", loginMethod: "manus", role: "student" as const,
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};

describe("curriculum.studentVisualAssets", () => {
  it("يعيد فقط الأصول التي وصلت من مسار الأب المنشور والآمن", async () => {
    curriculumMocks.getStudentVisibleVisualAssets.mockResolvedValue([]);
    const caller = appRouter.createCaller(context(student));
    await expect(caller.curriculum.studentVisualAssets()).resolves.toEqual([]);
    expect(curriculumMocks.getStudentVisibleVisualAssets).toHaveBeenCalledWith(42);
  });

  it("يرفض غير المصدق ولا يسمح لأصل Batch 1 في in_review بتجاوز تغذية الطالب", async () => {
    curriculumMocks.getStudentVisibleVisualAssets.mockResolvedValue([]);
    const anonymousCaller = appRouter.createCaller(context(null));
    await expect(anonymousCaller.curriculum.studentVisualAssets()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const reviewerCaller = appRouter.createCaller(context({ ...student, role: "academic_reviewer" }));
    await expect(reviewerCaller.curriculum.studentVisualAssets()).resolves.toEqual([]);
  });
});
