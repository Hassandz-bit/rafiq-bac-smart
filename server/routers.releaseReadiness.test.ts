import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const readinessMocks = vi.hoisted(() => ({ getReleaseReadinessDashboard: vi.fn() }));
const qualityMocks = vi.hoisted(() => ({ recordReleaseQualityEvidence: vi.fn(), releaseQualityCheckKeys: ["academic_batch_qa", "real_account_qa", "operational_qa", "published_bac_session"] as const }));
vi.mock("./releaseReadiness", () => readinessMocks);
vi.mock("./releaseQualityChecks", () => qualityMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

const admin = { id: 1, openId: "admin-readiness", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...admin, id: 2, openId: "student-readiness", role: "student" as const };

describe("administration.releaseReadiness", () => {
  it("يعرض للمدير ملخصًا للقراءة فقط", async () => {
    const summary = { isReadOnly: true as const, batch1: { publicationAllowed: false } };
    readinessMocks.getReleaseReadinessDashboard.mockResolvedValue(summary);
    await expect(appRouter.createCaller(context(admin)).administration.releaseReadiness()).resolves.toEqual(summary);
    expect(readinessMocks.getReleaseReadinessDashboard).toHaveBeenCalledTimes(1);
  });

  it("يرفض الطالب وغير المصدق قبل استدعاء ملخص الجاهزية", async () => {
    await expect(appRouter.createCaller(context(student)).administration.releaseReadiness()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.releaseReadiness()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يسمح للمدير بتسجيل وصف دليل فقط ولا ينفذ اعتماد محتوى أو نشرًا", async () => {
    qualityMocks.recordReleaseQualityEvidence.mockResolvedValue({ checkKey: "real_account_qa", evidenceNoteAr: "اختبار عملي موثق للأدوار الأربعة", actorUserId: 1, publicationChanged: false, contentApprovalChanged: false });
    await expect(appRouter.createCaller(context(admin)).administration.recordReleaseQualityEvidence({ checkKey: "real_account_qa", evidenceNoteAr: "اختبار عملي موثق للأدوار الأربعة" })).resolves.toMatchObject({ publicationChanged: false, contentApprovalChanged: false });
    expect(qualityMocks.recordReleaseQualityEvidence).toHaveBeenCalledWith({ checkKey: "real_account_qa", evidenceNoteAr: "اختبار عملي موثق للأدوار الأربعة", actorUserId: 1 });
  });

  it("يرفض تسجيل الدليل من الطالب وغير المصدق", async () => {
    const input = { checkKey: "operational_qa" as const, evidenceNoteAr: "فحص يدوي موثق للهاتف وقارئ الشاشة" };
    await expect(appRouter.createCaller(context(student)).administration.recordReleaseQualityEvidence(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.recordReleaseQualityEvidence(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
