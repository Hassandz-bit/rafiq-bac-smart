import { and, desc, eq } from "drizzle-orm";
import { learningItems } from "../drizzle/schema";
import { getDb } from "./db";

export async function createSourceLinkedDraftComponent(input: {
  parentLearningItemId: number;
  titleAr: string;
  componentKey: string;
  draftTextAr: string;
  authorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const parent = await db
    .select({ id: learningItems.id, lessonId: learningItems.lessonId, sourceId: learningItems.sourceId })
    .from(learningItems)
    .where(and(eq(learningItems.id, input.parentLearningItemId)))
    .limit(1);
  if (!parent[0] || !parent[0].sourceId) return null;

  const result = await db.insert(learningItems).values({
    lessonId: parent[0].lessonId,
    sourceId: parent[0].sourceId,
    type: "draft_component",
    titleAr: input.titleAr,
    body: {
      componentKey: input.componentKey,
      draftTextAr: input.draftTextAr,
      sourceReviewRequired: true,
      publicationBlocked: true,
      parentLearningItemId: parent[0].id,
    },
    workflowState: "draft",
    authoredByUserId: input.authorUserId,
    publishedAt: null,
  });

  return {
    id: Number(result[0].insertId),
    workflowState: "draft" as const,
    publicationBlocked: true as const,
    inheritedSourceId: parent[0].sourceId,
  };
}

export async function updateDraftComponent(input: { learningItemId: number; titleAr: string; draftTextAr: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db
    .select({ id: learningItems.id, workflowState: learningItems.workflowState, body: learningItems.body, sourceId: learningItems.sourceId, lessonId: learningItems.lessonId })
    .from(learningItems)
    .where(eq(learningItems.id, input.learningItemId))
    .limit(1);
  if (!existing[0]) return null;
  if (existing[0].workflowState !== "draft") throw new Error("لا يمكن تعديل مكوّن بعد خروجه من حالة المسودة.");

  const currentBody = typeof existing[0].body === "object" && existing[0].body !== null ? existing[0].body as Record<string, unknown> : {};
  await db.update(learningItems).set({
    titleAr: input.titleAr,
    body: { ...currentBody, draftTextAr: input.draftTextAr, sourceReviewRequired: true, publicationBlocked: true },
    workflowState: "draft",
    publishedAt: null,
  }).where(eq(learningItems.id, input.learningItemId));

  return { id: existing[0].id, workflowState: "draft" as const, publicationBlocked: true as const, sourceId: existing[0].sourceId, lessonId: existing[0].lessonId };
}

export async function submitDraftComponentForReview(input: { learningItemId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const existing = await db
    .select({ id: learningItems.id, workflowState: learningItems.workflowState, body: learningItems.body, sourceId: learningItems.sourceId, lessonId: learningItems.lessonId })
    .from(learningItems)
    .where(eq(learningItems.id, input.learningItemId))
    .limit(1);
  if (!existing[0]) return null;
  if (existing[0].workflowState !== "draft") throw new Error("لا يمكن إرسال مكوّن للمراجعة بعد خروجه من حالة المسودة.");

  const currentBody = typeof existing[0].body === "object" && existing[0].body !== null ? existing[0].body as Record<string, unknown> : {};
  await db.update(learningItems).set({
    body: { ...currentBody, sourceReviewRequired: true, publicationBlocked: true, submittedForReviewAt: new Date().toISOString() },
    workflowState: "in_review",
    publishedAt: null,
  }).where(eq(learningItems.id, input.learningItemId));

  return { id: existing[0].id, workflowState: "in_review" as const, publicationBlocked: true as const, sourceId: existing[0].sourceId, lessonId: existing[0].lessonId };
}

export async function getDraftComponents(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: learningItems.id, titleAr: learningItems.titleAr, body: learningItems.body, lessonId: learningItems.lessonId, sourceId: learningItems.sourceId, authoredByUserId: learningItems.authoredByUserId })
    .from(learningItems)
    .where(eq(learningItems.workflowState, "draft"))
    .orderBy(desc(learningItems.id))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows.map(row => {
    const body = typeof row.body === "object" && row.body !== null ? row.body as Record<string, unknown> : {};
    return { id: row.id, titleAr: row.titleAr, lessonId: row.lessonId, sourceId: row.sourceId, authoredByUserId: row.authoredByUserId, componentKey: typeof body.componentKey === "string" ? body.componentKey : "draft_component", draftTextAr: typeof body.draftTextAr === "string" ? body.draftTextAr : "", workflowState: "draft" as const, publicationBlocked: body.publicationBlocked === true };
  });
}
