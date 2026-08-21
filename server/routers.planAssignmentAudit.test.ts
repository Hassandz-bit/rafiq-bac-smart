import type { TrpcContext } from "./_core/context";
import { describe, expect, it, vi } from "vitest";

const auditMocks = vi.hoisted(() => ({ getPlanAssignmentAudit: vi.fn(), grantPlanAccess: vi.fn(), previewPlanAssignment: vi.fn() }));
vi.mock("./subscriptionGrants", () => auditMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const admin = { id: 1, openId: "admin-assignment-audit", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...admin, id: 42, openId: "student-assignment-audit", role: "student" as const };

describe("administration.planAssignmentAudit", () => {
  it("يعرض للمدير سجلات تعيين محفوظة دون تنفيذ منح جديد", async () => {
    const records = [{ assignmentId: 9, userId: 42, planCode: "season_one_subject", planNameAr: "باقة الموسم — مادة واحدة", productTier: "season", selectedSubjects: ["math"], isActive: true, assignedAt: new Date(), expiresAt: null, activeEntitlements: [{ userId: 42, entitlement: "season:math", expiresAt: null }, { userId: 42, entitlement: "hasm:math", expiresAt: null }] }];
    auditMocks.getPlanAssignmentAudit.mockResolvedValue(records);

    await expect(appRouter.createCaller(context(admin)).administration.planAssignmentAudit({ limit: 20 })).resolves.toEqual(records);
    expect(auditMocks.getPlanAssignmentAudit).toHaveBeenCalledWith(20);
    expect(auditMocks.grantPlanAccess).not.toHaveBeenCalled();
  });

  it("يرفض السجل من الطالب وغير المصدق", async () => {
    await expect(appRouter.createCaller(context(student)).administration.planAssignmentAudit({ limit: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.planAssignmentAudit({ limit: 20 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("administration.previewPlanAssignment", () => {
  it("يعرض للمدير معاينة غير معدِّلة للاستحقاقات دون تنفيذ منح", async () => {
    const preview = {
      plan: { id: 30002, code: "season_one_subject", nameAr: "باقة الموسم — مادة واحدة", subjectBundle: ["math"], subjectLimit: 1, durationDays: 0, isActive: true },
      productTier: "season" as const,
      selectedSubjects: ["math"],
      entitlements: ["season:math", "hasm:math"],
      expiresAt: null,
      isDryRun: true as const,
    };
    auditMocks.previewPlanAssignment.mockResolvedValue(preview);

    await expect(appRouter.createCaller(context(admin)).administration.previewPlanAssignment({ planCode: "season_one_subject", subjects: ["math"] })).resolves.toEqual(preview);
    expect(auditMocks.previewPlanAssignment).toHaveBeenCalledWith({ planCode: "season_one_subject", subjects: ["math"] });
    expect(auditMocks.grantPlanAccess).not.toHaveBeenCalled();
  });

  it("يرفض المعاينة من الطالب وغير المصدق", async () => {
    await expect(appRouter.createCaller(context(student)).administration.previewPlanAssignment({ planCode: "season_one_subject", subjects: ["math"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.previewPlanAssignment({ planCode: "season_one_subject", subjects: ["math"] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
