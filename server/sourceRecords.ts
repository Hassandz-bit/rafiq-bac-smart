import { eq, isNull } from "drizzle-orm";
import { learningItems, officialBookUploads, sources, subjects } from "../drizzle/schema";
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

/**
 * Metadata correction for an untouched intake record only. It intentionally does
 * not accept verification, pilot, working-reference, or publication fields.
 */
export async function updateStandaloneUnverifiedSourceRecord(input: {
  sourceId: number;
  sourceAuthority: string;
  documentTitle: string;
  url: string;
  academicYear?: string;
  level?: string;
  track?: string;
  edition?: string;
  sourceVersion?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const source = await db.select({ id: sources.id, verificationStatus: sources.verificationStatus, isInternalPilot: sources.isInternalPilot, isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference, archivedAt: sources.archivedAt }).from(sources).where(eq(sources.id, input.sourceId)).limit(1);
  if (!source[0]) return null;
  if (source[0].verificationStatus !== "unverified" || source[0].isInternalPilot || source[0].isUserApprovedWorkingReference || source[0].archivedAt) {
    throw new Error("يمكن تعديل بيانات مصدر مستقل وغير متحقق فقط؛ لا تتغير حالة المصدر أو سياسة مرجعه من هذا المسار.");
  }

  const [linkedLearning, linkedUpload] = await Promise.all([
    db.select({ id: learningItems.id }).from(learningItems).where(eq(learningItems.sourceId, input.sourceId)).limit(1),
    db.select({ id: officialBookUploads.id }).from(officialBookUploads).where(eq(officialBookUploads.sourceId, input.sourceId)).limit(1),
  ]);
  if (linkedLearning[0] || linkedUpload[0]) {
    throw new Error("لا يمكن تعديل مصدر بعد ربطه بمحتوى أو كتاب مرفوع؛ حافظ على السجل للمراجعة والتدقيق.");
  }

  await db.update(sources).set({
    sourceAuthority: input.sourceAuthority.trim(),
    documentTitle: input.documentTitle.trim(),
    url: input.url.trim(),
    academicYear: optionalText(input.academicYear),
    level: optionalText(input.level),
    track: optionalText(input.track),
    edition: optionalText(input.edition),
    sourceVersion: optionalText(input.sourceVersion),
    verificationStatus: "unverified",
    verificationDate: null,
  }).where(eq(sources.id, input.sourceId));

  return { sourceId: input.sourceId, verificationStatus: "unverified" as const, publicationBlocked: true as const, sourceStatusChanged: false as const };
}

/** Archives an untouched intake record while retaining it for audit; it never deletes or promotes a source. */
export async function archiveStandaloneUnverifiedSourceRecord(input: { sourceId: number; archivedByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const source = await db.select({ id: sources.id, verificationStatus: sources.verificationStatus, isInternalPilot: sources.isInternalPilot, isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference, archivedAt: sources.archivedAt }).from(sources).where(eq(sources.id, input.sourceId)).limit(1);
  if (!source[0]) return null;
  if (source[0].verificationStatus !== "unverified" || source[0].isInternalPilot || source[0].isUserApprovedWorkingReference || source[0].archivedAt) {
    throw new Error("يمكن أرشفة مصدر مستقل وغير متحقق ونشط فقط؛ لا يُحذف السجل ولا تتغير حالة المصدر من هذا المسار.");
  }

  const [linkedLearning, linkedUpload] = await Promise.all([
    db.select({ id: learningItems.id }).from(learningItems).where(eq(learningItems.sourceId, input.sourceId)).limit(1),
    db.select({ id: officialBookUploads.id }).from(officialBookUploads).where(eq(officialBookUploads.sourceId, input.sourceId)).limit(1),
  ]);
  if (linkedLearning[0] || linkedUpload[0]) {
    throw new Error("لا يمكن أرشفة مصدر بعد ربطه بمحتوى أو كتاب مرفوع؛ حافظ على السجل ضمن مسار التدقيق.");
  }

  const archivedAt = new Date();
  await db.update(sources).set({ archivedAt, archivedByUserId: input.archivedByUserId, verificationStatus: "unverified", verificationDate: null }).where(eq(sources.id, input.sourceId));
  return { sourceId: input.sourceId, archivedAt, archivedByUserId: input.archivedByUserId, verificationStatus: "unverified" as const, publicationBlocked: true as const, deleted: false as const };
}
