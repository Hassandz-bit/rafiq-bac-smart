import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMocks);

import { createUnverifiedSourceRecord } from "./sourceRecords";

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
