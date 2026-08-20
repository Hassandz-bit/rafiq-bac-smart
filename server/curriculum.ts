import { and, asc, eq } from "drizzle-orm";
import { contentAssets, curriculumVersions, exercises, learningItemAssets, learningItems, lessons, sources, studentEntitlements, subjectSourceGates, subjects, units } from "../drizzle/schema";
import { getDb } from "./db";
import { resolveUnitAccess } from "./entitlementRules";

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

export async function getStudioReviewQueue() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: learningItems.id, sourceId: learningItems.sourceId, titleAr: learningItems.titleAr, type: learningItems.type, body: learningItems.body, workflowState: learningItems.workflowState, subjectNameAr: subjects.nameAr, unitTitleAr: units.titleAr, lessonTitleAr: lessons.titleAr, sourceTitle: sources.documentTitle, sourceAuthority: sources.sourceAuthority, sourceStatus: sources.verificationStatus, isInternalPilot: sources.isInternalPilot })
    .from(learningItems)
    .innerJoin(lessons, eq(lessons.id, learningItems.lessonId))
    .innerJoin(units, eq(units.id, lessons.unitId))
    .innerJoin(subjects, eq(subjects.id, units.subjectId))
    .leftJoin(sources, eq(sources.id, learningItems.sourceId))
    .where(eq(learningItems.workflowState, "in_review"))
    .orderBy(asc(subjects.sortOrder), asc(units.sortOrder), asc(lessons.sortOrder), asc(learningItems.id))
    .limit(100);
  const componentRows = rows.filter(row => (row.body as { draftComponent?: boolean } | null)?.draftComponent === true);
  return rows.filter(row => row.type === "batch_review_package").map(row => {
    const body = row.body as { publicationBlocked?: boolean; sourceReviewRequired?: boolean; reviewComponentState?: string } | null;
    const reviewComponents = componentRows
      .filter(component => (component.body as { parentPackageId?: number } | null)?.parentPackageId === row.id)
      .map(component => {
        const componentBody = component.body as { componentKey?: string; publicationBlocked?: boolean; sourceReviewRequired?: boolean; componentState?: string; contentStatus?: string; draftContent?: { contentAr?: string } } | null;
        return { id: component.id, titleAr: component.titleAr, type: component.type, sourceId: component.sourceId, workflowState: component.workflowState, componentKey: componentBody?.componentKey ?? component.type, componentState: componentBody?.componentState ?? null, contentStatus: componentBody?.contentStatus ?? null, draftContentAr: componentBody?.draftContent?.contentAr ?? null, publicationBlocked: componentBody?.publicationBlocked === true, sourceReviewRequired: componentBody?.sourceReviewRequired === true };
      });
    return {
      ...row,
      publicationBlocked: body?.publicationBlocked === true,
      sourceReviewRequired: body?.sourceReviewRequired === true,
      reviewComponentState: body?.reviewComponentState ?? null,
      reviewComponents,
    };
  });
}

export type StudentLearningItem = {
  id: number;
  subjectCode: string;
  titleAr: string;
  type: string;
  provenance: "official_current" | "user_approved_working_reference";
};

export type StudentExercise = {
  id: number;
  subjectCode: string;
  type: string;
  prompt: unknown;
  provenance: "official_current" | "user_approved_working_reference";
};

export type StudentVisualAsset = {
  id: number;
  learningItemId: number;
  fileUrl: string;
  altTextAr: string | null;
  provenance: "official_current" | "user_approved_working_reference";
};

export function filterStudentVisibleItems<
  T extends { workflowState: string; sourceStatus: string | null; isInternalPilot: boolean | null; isUserApprovedWorkingReference: boolean | null; sourceGate: string | null },
>(items: T[]) {
  return items.filter(
    item =>
      item.workflowState === "published" &&
      (
        (item.sourceStatus === "current_official" && item.isInternalPilot !== true && item.sourceGate === "verified") ||
        item.isUserApprovedWorkingReference === true
      ),
  );
}

export function filterStudentAccessibleItems<
  T extends { workflowState: string; sourceStatus: string | null; isInternalPilot: boolean | null; isUserApprovedWorkingReference: boolean | null; sourceGate: string | null; subjectCode: string; isFreeUnit: boolean },
>(items: T[], entitlements: string[]) {
  return filterStudentVisibleItems(items).filter(item => {
    if (item.subjectCode !== "math" && item.subjectCode !== "physics" && item.subjectCode !== "natural_sciences") return false;
    return resolveUnitAccess({ subject: item.subjectCode, entitlements, isFreeUnit: item.isFreeUnit }).allowed;
  });
}

/** Visual files inherit their publication eligibility from their linked learning item. */
export function filterStudentVisibleVisualAssets<
  T extends { workflowState: string; sourceStatus: string | null; isInternalPilot: boolean | null; isUserApprovedWorkingReference: boolean | null; sourceGate: string | null },
>(assets: T[]) {
  return filterStudentVisibleItems(assets);
}

export async function getStudentVisibleVisualAssets(userId: number): Promise<StudentVisualAsset[]> {
  const db = await getDb();
  if (!db) return [];
  const entitlementRows = await db.select({ entitlement: studentEntitlements.entitlement }).from(studentEntitlements).where(eq(studentEntitlements.userId, userId)).limit(100);
  const entitlements = entitlementRows.map(row => row.entitlement);
  const rows = await db
    .select({
      id: contentAssets.id,
      learningItemId: learningItemAssets.learningItemId,
      fileUrl: contentAssets.fileUrl,
      altTextAr: contentAssets.altTextAr,
      workflowState: learningItems.workflowState,
      sourceStatus: sources.verificationStatus,
      isInternalPilot: sources.isInternalPilot,
      isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference,
      sourceGate: subjectSourceGates.status,
      subjectCode: subjects.code,
      isFreeUnit: units.isFreeUnit,
    })
    .from(learningItemAssets)
    .innerJoin(contentAssets, eq(learningItemAssets.assetId, contentAssets.id))
    .innerJoin(learningItems, eq(learningItemAssets.learningItemId, learningItems.id))
    .innerJoin(lessons, eq(learningItems.lessonId, lessons.id))
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .innerJoin(sources, eq(learningItems.sourceId, sources.id))
    .innerJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .limit(100);

  return filterStudentAccessibleItems(rows, entitlements).map(row => ({
    id: row.id,
    learningItemId: row.learningItemId,
    fileUrl: row.fileUrl,
    altTextAr: row.altTextAr,
    provenance: row.isUserApprovedWorkingReference ? "user_approved_working_reference" : "official_current",
  }));
}

export async function getStudentPublishedLearningItems(userId: number): Promise<StudentLearningItem[]> {
  const db = await getDb();
  if (!db) return [];

  const entitlementRows = await db
    .select({ entitlement: studentEntitlements.entitlement })
    .from(studentEntitlements)
    .where(eq(studentEntitlements.userId, userId))
    .limit(100);
  const entitlements = entitlementRows.map(row => row.entitlement);

  const rows = await db
    .select({
      id: learningItems.id,
      subjectCode: subjects.code,
      titleAr: learningItems.titleAr,
      type: learningItems.type,
      workflowState: learningItems.workflowState,
      sourceStatus: sources.verificationStatus,
      isInternalPilot: sources.isInternalPilot,
      isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference,
      sourceGate: subjectSourceGates.status,
      isFreeUnit: units.isFreeUnit,
    })
    .from(learningItems)
    .innerJoin(lessons, eq(learningItems.lessonId, lessons.id))
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .innerJoin(sources, eq(learningItems.sourceId, sources.id))
    .innerJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .where(eq(learningItems.workflowState, "published"))
    .limit(100);

  return filterStudentAccessibleItems(rows, entitlements).map(({ id, subjectCode, titleAr, type, isUserApprovedWorkingReference }) => ({ id, subjectCode, titleAr, type, provenance: isUserApprovedWorkingReference ? "user_approved_working_reference" : "official_current" }));
}

export async function getStudentAccessibleExercises(userId: number): Promise<StudentExercise[]> {
  const db = await getDb();
  if (!db) return [];
  const entitlementRows = await db.select({ entitlement: studentEntitlements.entitlement }).from(studentEntitlements).where(eq(studentEntitlements.userId, userId)).limit(100);
  const entitlements = entitlementRows.map(row => row.entitlement);
  const rows = await db
    .select({
      id: exercises.id,
      subjectCode: subjects.code,
      type: exercises.type,
      prompt: exercises.prompt,
      workflowState: exercises.workflowState,
      sourceStatus: sources.verificationStatus,
      isInternalPilot: sources.isInternalPilot,
      isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference,
      sourceGate: subjectSourceGates.status,
      isFreeUnit: units.isFreeUnit,
    })
    .from(exercises)
    .innerJoin(lessons, eq(exercises.lessonId, lessons.id))
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .innerJoin(sources, eq(exercises.sourceId, sources.id))
    .innerJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .where(eq(exercises.workflowState, "published"))
    .limit(100);
  return filterStudentAccessibleItems(rows, entitlements).map(row => ({ id: row.id, subjectCode: row.subjectCode, type: row.type, prompt: row.prompt, provenance: row.isUserApprovedWorkingReference ? "user_approved_working_reference" : "official_current" }));
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
      isInternalPilot: sources.isInternalPilot,
      isUserApprovedWorkingReference: sources.isUserApprovedWorkingReference,
      verificationDate: sources.verificationDate,
      verificationNotes: sources.verificationNotes,
      subjectNameAr: subjects.nameAr,
    })
    .from(sources)
    .leftJoin(subjects, eq(sources.subjectId, subjects.id))
    .orderBy(asc(sources.documentTitle))
    .limit(100);
}
