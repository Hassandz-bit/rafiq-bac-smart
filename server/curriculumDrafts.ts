import { asc, eq } from "drizzle-orm";
import { lessons, subjects, units } from "../drizzle/schema";
import { getDb } from "./db";

/** Creates a structural curriculum draft only; no source, free-access, or publication state is accepted from callers. */
export async function createDraftCurriculumUnit(input: { subjectId: number; titleAr: string; summaryAr?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const subject = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, input.subjectId)).limit(1);
  if (!subject[0]) return null;

  const result = await db.insert(units).values({
    subjectId: input.subjectId,
    titleAr: input.titleAr.trim(),
    summaryAr: input.summaryAr?.trim() || null,
    sortOrder: input.sortOrder ?? 0,
    isFreeUnit: false,
    workflowState: "draft",
  });
  return { id: Number(result[0].insertId), subjectId: input.subjectId, workflowState: "draft" as const, isFreeUnit: false as const, publicationBlocked: true as const };
}

export async function getDraftCurriculumUnitsForStudio() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: units.id, titleAr: units.titleAr, summaryAr: units.summaryAr, subjectId: units.subjectId, subjectNameAr: subjects.nameAr, sortOrder: units.sortOrder })
    .from(units)
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .where(eq(units.workflowState, "draft"))
    .orderBy(asc(subjects.sortOrder), asc(units.sortOrder), asc(units.id))
    .limit(100);
}

export async function getDraftCurriculumLessonsForStudio() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: lessons.id, unitId: lessons.unitId, titleAr: lessons.titleAr, objectiveAr: lessons.objectiveAr, estimatedMinutes: lessons.estimatedMinutes, sortOrder: lessons.sortOrder, unitTitleAr: units.titleAr, subjectNameAr: subjects.nameAr })
    .from(lessons)
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .where(eq(lessons.workflowState, "draft"))
    .orderBy(asc(subjects.sortOrder), asc(units.sortOrder), asc(lessons.sortOrder), asc(lessons.id))
    .limit(100);
}

export async function updateDraftCurriculumUnit(input: { unitId: number; titleAr: string; summaryAr?: string; sortOrder: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: units.id, workflowState: units.workflowState, isFreeUnit: units.isFreeUnit }).from(units).where(eq(units.id, input.unitId)).limit(1);
  if (!existing[0]) return null;
  if (existing[0].workflowState !== "draft" || existing[0].isFreeUnit) throw new Error("لا يمكن تعديل إلا وحدة مسودة غير مجانية؛ لا تتغير حالة النشر أو الوصول من هذا المسار.");

  await db.update(units).set({ titleAr: input.titleAr.trim(), summaryAr: input.summaryAr?.trim() || null, sortOrder: input.sortOrder, workflowState: "draft", isFreeUnit: false }).where(eq(units.id, input.unitId));
  return { unitId: input.unitId, workflowState: "draft" as const, isFreeUnit: false as const, publicationBlocked: true as const, parentChanged: false as const };
}

/** Creates only structural lesson metadata beneath a Draft unit; it cannot add source-linked or publishable learning content. */
export async function createDraftCurriculumLesson(input: { unitId: number; titleAr: string; objectiveAr?: string; estimatedMinutes?: number; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const parentUnit = await db.select({ id: units.id, workflowState: units.workflowState }).from(units).where(eq(units.id, input.unitId)).limit(1);
  if (!parentUnit[0]) return null;
  if (parentUnit[0].workflowState !== "draft") throw new Error("لا يمكن إضافة درس إلا داخل وحدة مسودة؛ لا يفتح هذا المسار أي محتوى منشور.");

  const result = await db.insert(lessons).values({
    unitId: input.unitId,
    titleAr: input.titleAr.trim(),
    objectiveAr: input.objectiveAr?.trim() || null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    sortOrder: input.sortOrder ?? 0,
    workflowState: "draft",
  });
  return { id: Number(result[0].insertId), unitId: input.unitId, workflowState: "draft" as const, publicationBlocked: true as const, learningContentCreated: false as const };
}

export async function updateDraftCurriculumLesson(input: { lessonId: number; titleAr: string; objectiveAr?: string; estimatedMinutes?: number; sortOrder: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ id: lessons.id, unitId: lessons.unitId, lessonState: lessons.workflowState, unitState: units.workflowState }).from(lessons).innerJoin(units, eq(lessons.unitId, units.id)).where(eq(lessons.id, input.lessonId)).limit(1);
  if (!existing[0]) return null;
  if (existing[0].lessonState !== "draft" || existing[0].unitState !== "draft") throw new Error("لا يمكن تعديل إلا درس مسودة داخل وحدة مسودة؛ يُحافظ المسار على الارتباط وحظر النشر.");

  await db.update(lessons).set({ titleAr: input.titleAr.trim(), objectiveAr: input.objectiveAr?.trim() || null, estimatedMinutes: input.estimatedMinutes ?? null, sortOrder: input.sortOrder, workflowState: "draft" }).where(eq(lessons.id, input.lessonId));
  return { lessonId: input.lessonId, unitId: existing[0].unitId, workflowState: "draft" as const, publicationBlocked: true as const, parentChanged: false as const, learningContentChanged: false as const };
}
