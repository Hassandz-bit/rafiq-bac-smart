import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => dbMocks);

import { createDraftCurriculumLesson, createDraftCurriculumUnit, updateDraftCurriculumLesson, updateDraftCurriculumUnit } from "./curriculumDrafts";

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

describe("updateDraftCurriculumUnit", () => {
  it("يثبت Draft وعدم المجانية وقفل النشر عند تعديل بيانات الوحدة", async () => {
    const unitLimit = vi.fn().mockResolvedValue([{ id: 81001, workflowState: "draft", isFreeUnit: false }]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    dbMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: unitLimit })) })) })), update: vi.fn(() => ({ set: updateSet })) });

    await expect(updateDraftCurriculumUnit({ unitId: 81001, titleAr: "وحدة محدثة", summaryAr: "ملخص", sortOrder: 3 })).resolves.toEqual({ unitId: 81001, workflowState: "draft", isFreeUnit: false, publicationBlocked: true, parentChanged: false });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ titleAr: "وحدة محدثة", workflowState: "draft", isFreeUnit: false, sortOrder: 3 }));
  });

  it("يرفض وحدة غير Draft أو مجانية قبل الكتابة", async () => {
    const unitLimit = vi.fn().mockResolvedValue([{ id: 81001, workflowState: "approved", isFreeUnit: false }]);
    const update = vi.fn();
    dbMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: unitLimit })) })) })), update });

    await expect(updateDraftCurriculumUnit({ unitId: 81001, titleAr: "وحدة", sortOrder: 0 })).rejects.toThrow(/وحدة مسودة/);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("updateDraftCurriculumLesson", () => {
  it("يثبت الدرس داخل وحدته كمسودة ولا ينشئ محتوى تعلم", async () => {
    const lessonLimit = vi.fn().mockResolvedValue([{ id: 82001, unitId: 81001, lessonState: "draft", unitState: "draft" }]);
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    dbMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: lessonLimit })) })) })) })), update: vi.fn(() => ({ set: updateSet })) });

    await expect(updateDraftCurriculumLesson({ lessonId: 82001, titleAr: "درس محدث", objectiveAr: "هدف", estimatedMinutes: 45, sortOrder: 2 })).resolves.toEqual({ lessonId: 82001, unitId: 81001, workflowState: "draft", publicationBlocked: true, parentChanged: false, learningContentChanged: false });
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ titleAr: "درس محدث", workflowState: "draft", estimatedMinutes: 45, sortOrder: 2 }));
  });

  it("يرفض درسًا أو وحدة غير Draft قبل الكتابة", async () => {
    const lessonLimit = vi.fn().mockResolvedValue([{ id: 82001, unitId: 81001, lessonState: "draft", unitState: "approved" }]);
    const update = vi.fn();
    dbMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: lessonLimit })) })) })) })), update });

    await expect(updateDraftCurriculumLesson({ lessonId: 82001, titleAr: "درس", sortOrder: 0 })).rejects.toThrow(/درس مسودة داخل وحدة مسودة/);
    expect(update).not.toHaveBeenCalled();
  });
});
