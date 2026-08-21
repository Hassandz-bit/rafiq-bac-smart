import { eq } from "drizzle-orm";
import { sources, subjects } from "../drizzle/schema";
import { getDb } from "./db";

const optionalText = (value: string | undefined) => value?.trim() || null;

/**
 * Creates evidence metadata only. The record is deliberately unverified and is
 * not a publication decision; an academic reviewer must later verify it.
 */
export async function createUnverifiedSourceRecord(input: {
  sourceAuthority: string;
  documentTitle: string;
  url: string;
  subjectId: number;
  createdByUserId: number;
  academicYear?: string;
  level?: string;
  track?: string;
  edition?: string;
  sourceVersion?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const subject = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, input.subjectId)).limit(1);
  if (!subject[0]) return null;

  const result = await db.insert(sources).values({
    sourceAuthority: input.sourceAuthority.trim(),
    documentTitle: input.documentTitle.trim(),
    url: input.url.trim(),
    subjectId: input.subjectId,
    academicYear: optionalText(input.academicYear),
    level: optionalText(input.level),
    track: optionalText(input.track),
    edition: optionalText(input.edition),
    sourceVersion: optionalText(input.sourceVersion),
    isInternalPilot: false,
    isUserApprovedWorkingReference: false,
    verificationStatus: "unverified",
    verificationDate: null,
    verificationNotes: "سجل مصدر أُنشئ في Content Studio؛ يحتاج تحققًا أكاديميًا بشريًا قبل أي استخدام للنشر.",
    createdByUserId: input.createdByUserId,
  });

  return { id: Number(result[0].insertId), subjectId: input.subjectId, verificationStatus: "unverified" as const, publicationBlocked: true as const, createdByUserId: input.createdByUserId, sourcePromoted: false as const };
}
