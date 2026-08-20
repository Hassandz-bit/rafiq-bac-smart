import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const smartAssessmentMocks = vi.hoisted(() => ({ generateSmartAssessment: vi.fn() }));
vi.mock("./smartAssessment", () => smartAssessmentMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const student = { id: 42, openId: "student-smart-assessment", email: "student@example.com", name: "طالب تجريبي", loginMethod: "manus", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("progress.smartAssessment", () => {
  it("يعيد تقييم الطالب الموثق لحساب مصدق فقط", async () => {
    const assessment = { strengths: ["ثبات جيد"], attentionPoint: "راجع الوحدات", feedback: "ملاحظة عملية", nextReview: "ابدأ بالمراجعة", confidence: "low" as const };
    smartAssessmentMocks.generateSmartAssessment.mockResolvedValue(assessment);

    const caller = appRouter.createCaller(context(student));
    await expect(caller.progress.smartAssessment()).resolves.toEqual(assessment);
    expect(smartAssessmentMocks.generateSmartAssessment).toHaveBeenCalledWith(42);
  });

  it("يرفض طلب التقييم الذكي من غير المصدق", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.progress.smartAssessment()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
