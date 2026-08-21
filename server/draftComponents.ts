import { and, eq } from "drizzle-orm";
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
