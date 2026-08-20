import { and, asc, desc, eq, isNull, lte } from "drizzle-orm";
import { concepts, errorNotebookEntries, masteryRecords, reviewQueueItems } from "../drizzle/schema";
import { getDb } from "./db";

export async function getStudentProgressSummary(userId: number) {
  const db = await getDb();
  if (!db) return { errors: [], reviews: [], mastery: [] };
  const [errors, reviews, mastery] = await Promise.all([
    db.select({ id: errorNotebookEntries.id, errorType: errorNotebookEntries.errorType, occurrences: errorNotebookEntries.occurrences, nextReviewAt: errorNotebookEntries.nextReviewAt }).from(errorNotebookEntries).where(eq(errorNotebookEntries.userId, userId)).orderBy(desc(errorNotebookEntries.occurrences), desc(errorNotebookEntries.lastOccurredAt)).limit(5),
    db.select({ id: reviewQueueItems.id, reason: reviewQueueItems.reason, dueAt: reviewQueueItems.dueAt }).from(reviewQueueItems).where(and(eq(reviewQueueItems.userId, userId), isNull(reviewQueueItems.completedAt), lte(reviewQueueItems.dueAt, new Date()))).orderBy(asc(reviewQueueItems.dueAt)).limit(5),
    db.select({ conceptNameAr: concepts.nameAr, status: masteryRecords.status, score: masteryRecords.score }).from(masteryRecords).innerJoin(concepts, eq(masteryRecords.conceptId, concepts.id)).where(eq(masteryRecords.userId, userId)).orderBy(desc(masteryRecords.updatedAt)).limit(5),
  ]);
  return { errors, reviews, mastery };
}

export async function completeStudentReview(input: { userId: number; reviewId: number }) {
  const db = await getDb();
  if (!db) return null;
  const review = await db.select({ id: reviewQueueItems.id }).from(reviewQueueItems).where(and(eq(reviewQueueItems.id, input.reviewId), eq(reviewQueueItems.userId, input.userId), isNull(reviewQueueItems.completedAt))).limit(1);
  if (!review[0]) return null;
  await db.update(reviewQueueItems).set({ completedAt: new Date() }).where(eq(reviewQueueItems.id, review[0].id));
  return { reviewId: review[0].id, completed: true } as const;
}
