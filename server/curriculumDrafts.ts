import { eq } from "drizzle-orm";
import { subjects, units } from "../drizzle/schema";
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
