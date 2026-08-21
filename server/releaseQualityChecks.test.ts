import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => mocks);

import { getReleaseQualityCheckSummary, recordReleaseQualityEvidence } from "./releaseQualityChecks";

describe("release quality acceptance records", () => {
  it("يعرض أحدث دليل لكل بوابة مع إبقاء البوابات التي لا دليل لها فارغة", async () => {
    const query = { from: vi.fn(), orderBy: vi.fn(), limit: vi.fn() };
    query.from.mockReturnValue(query); query.orderBy.mockReturnValue(query);
    query.limit.mockResolvedValue([
      { checkKey: "real_account_qa", evidenceNoteAr: "اختبار أدوار موثق", recordedAt: new Date("2026-08-21T00:00:00Z"), actorUserId: 7 },
      { checkKey: "real_account_qa", evidenceNoteAr: "دليل أقدم", recordedAt: new Date("2026-08-20T00:00:00Z"), actorUserId: 5 },
    ]);
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => query) });

    await expect(getReleaseQualityCheckSummary()).resolves.toEqual([
      { checkKey: "academic_batch_qa", latestEvidence: null, recordedAt: null, actorUserId: null },
      { checkKey: "real_account_qa", latestEvidence: "اختبار أدوار موثق", recordedAt: new Date("2026-08-21T00:00:00Z"), actorUserId: 7 },
      { checkKey: "operational_qa", latestEvidence: null, recordedAt: null, actorUserId: null },
      { checkKey: "published_bac_session", latestEvidence: null, recordedAt: null, actorUserId: null },
    ]);
  });

  it("يسجل وصف الدليل فقط ويعيد صراحة أن النشر واعتماد المحتوى لم يتغيرا", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    mocks.getDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) });

    await expect(recordReleaseQualityEvidence({ checkKey: "operational_qa", evidenceNoteAr: "فحص يدوي موثق", actorUserId: 4 })).resolves.toEqual({ checkKey: "operational_qa", evidenceNoteAr: "فحص يدوي موثق", actorUserId: 4, publicationChanged: false, contentApprovalChanged: false });
    expect(values).toHaveBeenCalledWith({ checkKey: "operational_qa", evidenceNoteAr: "فحص يدوي موثق", actorUserId: 4 });
  });
});
