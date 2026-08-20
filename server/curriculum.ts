import { and, asc, eq } from "drizzle-orm";
import { curriculumVersions, learningItems, lessons, sources, subjectSourceGates, subjects, units } from "../drizzle/schema";
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

export type StudentLearningItem = {
  id: number;
  subjectCode: string;
  titleAr: string;
  type: string;
};

export function filterStudentVisibleItems<
  T extends { workflowState: string; sourceStatus: string | null; isInternalPilot: boolean | null; sourceGate: string | null },
>(items: T[]) {
  return items.filter(
    item =>
      item.workflowState === "published" &&
      item.sourceStatus === "current_official" &&
      item.isInternalPilot !== true &&
      item.sourceGate === "verified",
  );
}

export async function getStudentPublishedLearningItems(): Promise<StudentLearningItem[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: learningItems.id,
      subjectCode: subjects.code,
      titleAr: learningItems.titleAr,
      type: learningItems.type,
      workflowState: learningItems.workflowState,
      sourceStatus: sources.verificationStatus,
      isInternalPilot: sources.isInternalPilot,
      sourceGate: subjectSourceGates.status,
    })
    .from(learningItems)
    .innerJoin(lessons, eq(learningItems.lessonId, lessons.id))
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .innerJoin(sources, eq(learningItems.sourceId, sources.id))
    .innerJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .where(
      and(
        eq(learningItems.workflowState, "published"),
        eq(sources.verificationStatus, "current_official"),
        eq(sources.isInternalPilot, false),
        eq(subjectSourceGates.status, "verified"),
      ),
    )
    .limit(100);

  return filterStudentVisibleItems(rows).map(({ id, subjectCode, titleAr, type }) => ({ id, subjectCode, titleAr, type }));
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
