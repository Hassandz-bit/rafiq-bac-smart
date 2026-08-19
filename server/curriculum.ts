import { and, asc, eq } from "drizzle-orm";
import { curriculumVersions, sources, subjectSourceGates, subjects } from "../drizzle/schema";
import { getDb } from "./db";

const CURRENT_CURRICULUM_CODE = "BAC_2027_SCIENCES_EXPERIMENTALES";

export async function getCurrentCurriculumOverview() {
  const db = await getDb();
  if (!db) return { curriculum: null, subjects: [] };

  const rows = await db
    .select({
      curriculumCode: curriculumVersions.code,
      curriculumTitle: curriculumVersions.title,
      academicYear: curriculumVersions.academicYear,
      track: curriculumVersions.track,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      subjectNameAr: subjects.nameAr,
      taglineAr: subjects.taglineAr,
      sourceGate: subjectSourceGates.status,
      sourceGateNote: subjectSourceGates.noteAr,
    })
    .from(subjects)
    .innerJoin(curriculumVersions, eq(subjects.curriculumVersionId, curriculumVersions.id))
    .leftJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .where(and(eq(curriculumVersions.code, CURRENT_CURRICULUM_CODE), eq(subjects.isVisible, true)))
    .orderBy(asc(subjects.sortOrder));

  const first = rows[0];
  return {
    curriculum: first
      ? {
          code: first.curriculumCode,
          title: first.curriculumTitle,
          academicYear: first.academicYear,
          track: first.track,
        }
      : null,
    subjects: rows.map(row => ({
      id: row.subjectId,
      code: row.subjectCode,
      nameAr: row.subjectNameAr,
      taglineAr: row.taglineAr,
      sourceGate: row.sourceGate ?? "requires_user_upload",
      sourceGateNote: row.sourceGateNote,
    })),
  };
}

export async function getSourceRegistryForStudio() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: sources.id,
      sourceAuthority: sources.sourceAuthority,
      documentTitle: sources.documentTitle,
      url: sources.url,
      academicYear: sources.academicYear,
      verificationStatus: sources.verificationStatus,
      verificationDate: sources.verificationDate,
      verificationNotes: sources.verificationNotes,
      subjectNameAr: subjects.nameAr,
    })
    .from(sources)
    .leftJoin(subjects, eq(sources.subjectId, subjects.id))
    .orderBy(asc(sources.documentTitle))
    .limit(100);
}
