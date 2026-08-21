import { desc, eq } from "drizzle-orm";
import { officialBookUploads, sources, subjects } from "../drizzle/schema";
import { getDb } from "./db";

export const officialBookChecklistKeys = ["cover", "title", "level", "track", "publisher", "authorship", "edition", "bookCode", "publicationYear", "tableOfContents"] as const;
export type OfficialBookChecklistKey = (typeof officialBookChecklistKeys)[number];
export type OfficialBookVerificationChecklist = Record<OfficialBookChecklistKey, boolean>;

export function normalizeOfficialBookChecklist(value: unknown): OfficialBookVerificationChecklist {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(officialBookChecklistKeys.map(key => [key, record[key] === true])) as OfficialBookVerificationChecklist;
}

function isCompleteChecklist(checklist: OfficialBookVerificationChecklist) {
  return officialBookChecklistKeys.every(key => checklist[key]);
}

/** Team-visible intake only. Uploaded PDFs remain separate from the academic-source registry. */
export async function getOfficialBookIntake(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: officialBookUploads.id,
      subjectId: officialBookUploads.subjectId,
      subjectNameAr: subjects.nameAr,
      sourceId: officialBookUploads.sourceId,
      sourceTitle: sources.documentTitle,
      fileUrl: officialBookUploads.fileUrl,
      originalFilename: officialBookUploads.originalFilename,
      verificationChecklist: officialBookUploads.verificationChecklist,
      verificationStatus: officialBookUploads.verificationStatus,
      uploadedByUserId: officialBookUploads.uploadedByUserId,
      uploadedAt: officialBookUploads.uploadedAt,
      reviewedByUserId: officialBookUploads.reviewedByUserId,
      reviewedAt: officialBookUploads.reviewedAt,
    })
    .from(officialBookUploads)
    .innerJoin(subjects, eq(officialBookUploads.subjectId, subjects.id))
    .leftJoin(sources, eq(officialBookUploads.sourceId, sources.id))
    .orderBy(desc(officialBookUploads.uploadedAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map(row => ({ ...row, verificationChecklist: normalizeOfficialBookChecklist(row.verificationChecklist) }));
}

/**
 * Records a reviewer checklist against the uploaded file only. It never creates,
 * modifies, or promotes a source record and cannot publish academic content.
 */
export async function reviewOfficialBookUpload(input: {
  uploadId: number;
  reviewerUserId: number;
  verificationStatus: "unverified" | "current_official" | "official_but_version_unconfirmed" | "historical_official";
  verificationChecklist: OfficialBookVerificationChecklist;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const existing = await db.select({ id: officialBookUploads.id }).from(officialBookUploads).where(eq(officialBookUploads.id, input.uploadId)).limit(1);
  if (!existing[0]) return null;

  const verificationChecklist = normalizeOfficialBookChecklist(input.verificationChecklist);
  if (input.verificationStatus === "current_official" && !isCompleteChecklist(verificationChecklist)) {
    throw new Error("لا يمكن تسجيل كتاب مرفوع كنسخة رسمية حالية قبل اكتمال قائمة التحقق.");
  }

  const reviewedAt = new Date();
  await db.update(officialBookUploads).set({ verificationStatus: input.verificationStatus, verificationChecklist, reviewedByUserId: input.reviewerUserId, reviewedAt }).where(eq(officialBookUploads.id, input.uploadId));
  return { id: input.uploadId, verificationStatus: input.verificationStatus, verificationChecklist, reviewedByUserId: input.reviewerUserId, reviewedAt, publicationBlocked: true as const, sourceChanged: false as const };
}
