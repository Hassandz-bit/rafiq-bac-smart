import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { contentReviews, learningItems, sources } from "../drizzle/schema";
import { canReviewContent, type AppRole } from "./authorization";
import { getDb } from "./db";
import { canTransitionContent } from "./workflowRules";

export type ReviewDecision = "approved" | "changes_requested" | "rejected";

const targetState: Record<ReviewDecision, "approved" | "draft" | "archived"> = {
  approved: "approved",
  changes_requested: "draft",
  rejected: "archived",
};

export async function reviewLearningItem(input: { reviewerUserId: number; role: AppRole; learningItemId: number; decision: ReviewDecision; noteAr?: string }) {
  if (!canReviewContent(input.role)) throw new TRPCError({ code: "FORBIDDEN", message: "قرار المراجعة الأكاديمية متاح للمراجع أو المدير فقط." });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "قاعدة البيانات غير متاحة." });

  const rows = await db
    .select({ id: learningItems.id, workflowState: learningItems.workflowState, sourceStatus: sources.verificationStatus, isInternalPilot: sources.isInternalPilot })
    .from(learningItems)
    .leftJoin(sources, eq(sources.id, learningItems.sourceId))
    .where(eq(learningItems.id, input.learningItemId))
    .limit(1);
  const item = rows[0];
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "عنصر المراجعة غير موجود." });
  if (item.workflowState !== "in_review") throw new TRPCError({ code: "CONFLICT", message: "لا يمكن اتخاذ قرار إلا على عنصر في المراجعة." });

  const nextState = targetState[input.decision];
  if (!canTransitionContent({ role: input.role, from: item.workflowState, to: nextState, sourceStatus: item.sourceStatus, reviewerApproved: input.decision === "approved" })) {
    throw new TRPCError({ code: "FORBIDDEN", message: "انتقال المراجعة غير مسموح." });
  }

  await db.transaction(async tx => {
    await tx.update(learningItems).set({ workflowState: nextState }).where(and(eq(learningItems.id, item.id), eq(learningItems.workflowState, "in_review")));
    await tx.insert(contentReviews).values({ learningItemId: item.id, decision: input.decision, noteAr: input.noteAr?.trim() || null, reviewerUserId: input.reviewerUserId });
  });

  return { learningItemId: item.id, workflowState: nextState, decision: input.decision, publicationBlocked: true, publishActionAvailable: false } as const;
}
