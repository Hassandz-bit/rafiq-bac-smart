import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMocks);

import { createDraftCurriculumUnit } from "./curriculumDrafts";

describe("createDraftCurriculumUnit", () => {
  it("يفرض Draft ووحدة غير مجانية مع قفل نشر عند إنشاء البنية المنهجية", async () => {
    const subjectLimit = vi.fn().mockResolvedValue([{ id: 301 }]);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 81001 }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: subjectLimit })) })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(createDraftCurriculumUnit({ subjectId: 301, titleAr: "الحركية الكيميائية", summaryAr: "مسودة", sortOrder: 7 })).resolves.toEqual({ id: 81001, subjectId: 301, workflowState: "draft", isFreeUnit: false, publicationBlocked: true });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ subjectId: 301, titleAr: "الحركية الكيميائية", summaryAr: "مسودة", sortOrder: 7, workflowState: "draft", isFreeUnit: false }));
  });
});
