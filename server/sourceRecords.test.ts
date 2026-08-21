import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMocks);

import { archiveStandaloneUnverifiedSourceRecord, createUnverifiedSourceRecord, updateStandaloneUnverifiedSourceRecord } from "./sourceRecords";

describe("createUnverifiedSourceRecord", () => {
  it("يفرض دائمًا حالة غير متحققة وقفل النشر ولا يسمح بسمات الترقية عند الإدخال", async () => {
    const subjectLimit = vi.fn().mockResolvedValue([{ id: 301 }]);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 70002 }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: subjectLimit })) })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(createUnverifiedSourceRecord({ sourceAuthority: "جهة مرجعية", documentTitle: "كتاب مقترح", url: "https://example.edu/book", subjectId: 301, createdByUserId: 12 })).resolves.toEqual({ id: 70002, subjectId: 301, verificationStatus: "unverified", publicationBlocked: true, createdByUserId: 12, sourcePromoted: false });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ verificationStatus: "unverified", isInternalPilot: false, isUserApprovedWorkingReference: false, verificationDate: null, createdByUserId: 12 }));
  });
});

describe("updateStandaloneUnverifiedSourceRecord", () => {
  it("يحدّث بيانات سجل مستقل غير متحقق فقط ويحافظ على قفل النشر", async () => {
    const sourceLimit = vi.fn().mockResolvedValue([{ id: 70002, verificationStatus: "unverified", isInternalPilot: false, isUserApprovedWorkingReference: false }]);
    const linkedLearningLimit = vi.fn().mockResolvedValue([]);
    const linkedUploadLimit = vi.fn().mockResolvedValue([]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: sourceLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedLearningLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedUploadLimit })) })) }),
      update: vi.fn(() => ({ set: updateSet })),
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(updateStandaloneUnverifiedSourceRecord({ sourceId: 70002, sourceAuthority: "جهة محدثة", documentTitle: "سجل محدث", url: "https://example.edu/updated" })).resolves.toEqual({ sourceId: 70002, verificationStatus: "unverified", publicationBlocked: true, sourceStatusChanged: false });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ verificationStatus: "unverified", verificationDate: null, documentTitle: "سجل محدث" }));
  });

  it("يرفض السجل المرتبط بمحتوى قبل أي كتابة", async () => {
    const sourceLimit = vi.fn().mockResolvedValue([{ id: 70002, verificationStatus: "unverified", isInternalPilot: false, isUserApprovedWorkingReference: false }]);
    const linkedLearningLimit = vi.fn().mockResolvedValue([{ id: 90001 }]);
    const linkedUploadLimit = vi.fn().mockResolvedValue([]);
    const update = vi.fn();
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: sourceLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedLearningLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedUploadLimit })) })) }),
      update,
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(updateStandaloneUnverifiedSourceRecord({ sourceId: 70002, sourceAuthority: "جهة", documentTitle: "سجل", url: "https://example.edu/updated" })).rejects.toThrow(/ربطه بمحتوى/);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("archiveStandaloneUnverifiedSourceRecord", () => {
  it("يؤرشف سجلًا مستقلًا دون حذفه وبحالة غير متحققة ثابتة", async () => {
    const sourceLimit = vi.fn().mockResolvedValue([{ id: 70002, verificationStatus: "unverified", isInternalPilot: false, isUserApprovedWorkingReference: false, archivedAt: null }]);
    const linkedLearningLimit = vi.fn().mockResolvedValue([]);
    const linkedUploadLimit = vi.fn().mockResolvedValue([]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: sourceLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedLearningLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedUploadLimit })) })) }),
      update: vi.fn(() => ({ set: updateSet })),
    };
    dbMocks.getDb.mockResolvedValue(db);

    const result = await archiveStandaloneUnverifiedSourceRecord({ sourceId: 70002, archivedByUserId: 12 });
    expect(result).toMatchObject({ sourceId: 70002, archivedByUserId: 12, verificationStatus: "unverified", publicationBlocked: true, deleted: false });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ archivedByUserId: 12, verificationStatus: "unverified", verificationDate: null }));
  });

  it("يرفض أرشفة سجل مرتبط بمحتوى قبل أي كتابة", async () => {
    const sourceLimit = vi.fn().mockResolvedValue([{ id: 70002, verificationStatus: "unverified", isInternalPilot: false, isUserApprovedWorkingReference: false, archivedAt: null }]);
    const linkedLearningLimit = vi.fn().mockResolvedValue([{ id: 90001 }]);
    const linkedUploadLimit = vi.fn().mockResolvedValue([]);
    const update = vi.fn();
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: sourceLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedLearningLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: linkedUploadLimit })) })) }),
      update,
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(archiveStandaloneUnverifiedSourceRecord({ sourceId: 70002, archivedByUserId: 12 })).rejects.toThrow(/أرشفة مصدر بعد ربطه بمحتوى/);
    expect(update).not.toHaveBeenCalled();
  });
});
