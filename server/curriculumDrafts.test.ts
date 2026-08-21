import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMocks);

import { createDraftCurriculumLesson, createDraftCurriculumUnit } from "./curriculumDrafts";

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

describe("createDraftCurriculumLesson", () => {
  it("يفرض درس Draft بنيويًا داخل وحدة Draft من دون محتوى تعلم أو نشر", async () => {
    const unitLimit = vi.fn().mockResolvedValue([{ id: 81001, workflowState: "draft" }]);
    const insertValues = vi.fn().mockResolvedValue([{ insertId: 82001 }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: unitLimit })) })) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    dbMocks.getDb.mockResolvedValue(db);

    await expect(createDraftCurriculumLesson({ unitId: 81001, titleAr: "سرعة التفاعل", objectiveAr: "مسودة", estimatedMinutes: 30, sortOrder: 4 })).resolves.toEqual({ id: 82001, unitId: 81001, workflowState: "draft", publicationBlocked: true, learningContentCreated: false });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ unitId: 81001, titleAr: "سرعة التفاعل", workflowState: "draft", estimatedMinutes: 30, sortOrder: 4 }));
  });

  it("يرفض الوحدة غير المسودة قبل أي إدراج", async () => {
    const unitLimit = vi.fn().mockResolvedValue([{ id: 81001, workflowState: "approved" }]);
    const insert = vi.fn();
    dbMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: unitLimit })) })) })), insert });

    await expect(createDraftCurriculumLesson({ unitId: 81001, titleAr: "سرعة التفاعل" })).rejects.toThrow(/وحدة مسودة/);
    expect(insert).not.toHaveBeenCalled();
  });
});
