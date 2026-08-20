import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const curriculumMocks = vi.hoisted(() => ({
  getCurrentCurriculumOverview: vi.fn(),
  getSourceRegistryForStudio: vi.fn(),
  getStudentPublishedLearningItems: vi.fn(),
}));

vi.mock("./curriculum", () => curriculumMocks);

import { appRouter } from "./routers";

function createStudentContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "student-pilot-safety",
      email: "student@example.com",
      name: "طالب تجريبي",
      loginMethod: "manus",
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("curriculum.studentLearningItems", () => {
  it("يعيد للطالب فقط الحزمة التي مررت بفلاتر المصدر الآمنة", async () => {
    curriculumMocks.getStudentPublishedLearningItems.mockResolvedValue([
      { id: 900, subjectCode: "math", titleAr: "عنصر مرخص للطالب", type: "concept" },
    ]);

    const caller = appRouter.createCaller(createStudentContext());
    const result = await caller.curriculum.studentLearningItems();

    expect(result).toEqual([{ id: 900, subjectCode: "math", titleAr: "عنصر مرخص للطالب", type: "concept" }]);
    expect(curriculumMocks.getStudentPublishedLearningItems).toHaveBeenCalledWith(42);
  });

  it("يرفض الاستدعاء غير المصدق ويُبقي تغذية الموظف ضمن نفس البيانات الآمنة", async () => {
    curriculumMocks.getStudentPublishedLearningItems.mockResolvedValue([]);

    const anonymousCaller = appRouter.createCaller(createAnonymousContext());
    await expect(anonymousCaller.curriculum.studentLearningItems()).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const staffCaller = appRouter.createCaller({
      ...createStudentContext(),
      user: { ...createStudentContext().user!, role: "academic_reviewer" },
    });
    await expect(staffCaller.curriculum.studentLearningItems()).resolves.toEqual([]);
  });
});
