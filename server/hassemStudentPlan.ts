import { and, eq, isNull } from "drizzle-orm";
import { concepts, errorNotebookEntries, exercises, lessons, masteryRecords, reviewQueueItems, subjects, units } from "../drizzle/schema";
import { getDb } from "./db";
import { buildHassemPlan, type HassemSignal } from "./hassemPriority";

export type HassemSubjectSnapshot = {
  subjectId: number;
  subjectNameAr: string;
  masteryScores: number[];
  repeatedErrors: number;
  dueReviews: number;
};

export function buildTransparentHassemPlan(snapshots: HassemSubjectSnapshot[], availableDays: number) {
  const signals: HassemSignal[] = snapshots.map(snapshot => {
    const mastery = snapshot.masteryScores.length ? Math.round(snapshot.masteryScores.reduce((sum, score) => sum + score, 0) / snapshot.masteryScores.length) : 50;
    return {
      unitId: snapshot.subjectId,
      unitTitleAr: snapshot.subjectNameAr,
      mastery,
      diagnostic: 60,
      repeatedErrors: Math.min(5, snapshot.repeatedErrors),
      prerequisiteImpact: Math.min(4, snapshot.dueReviews),
      bacRelevance: 4,
    };
  });

  return buildHassemPlan(signals, availableDays).map(item => ({
    ...item,
    nextActionAr: item.state === "priority" ? "ابدأ بمراجعة خطأ متكرر ثم جلسة حسم قصيرة." : item.state === "reinforce" ? "نفّذ جلسة تعزيز قصيرة ثم تحقق من الفهم." : "حافظ على مراجعة خفيفة ولا تزاحم أولوياتك العاجلة.",
    explanationAr: `الإتقان ${item.mastery}% · الأخطاء المتكررة ${item.repeatedErrors} · المراجعات المستحقة ${item.prerequisiteImpact} · الضغط الزمني محسوب على ${availableDays} يومًا.`,
  }));
}

export async function getHassemPlanForStudent(userId: number, availableDays: number) {
  const db = await getDb();
  if (!db) return { availableDays, priorities: [] };
  const [subjectRows, masteryRows, errorRows, reviewRows] = await Promise.all([
    db.select({ subjectId: subjects.id, subjectNameAr: subjects.nameAr }).from(subjects).where(eq(subjects.isVisible, true)).limit(10),
    db.select({ subjectId: concepts.subjectId, score: masteryRecords.score }).from(masteryRecords).innerJoin(concepts, eq(masteryRecords.conceptId, concepts.id)).where(eq(masteryRecords.userId, userId)).limit(200),
    db.select({ subjectId: subjects.id, occurrences: errorNotebookEntries.occurrences }).from(errorNotebookEntries).innerJoin(exercises, eq(errorNotebookEntries.exerciseId, exercises.id)).innerJoin(lessons, eq(exercises.lessonId, lessons.id)).innerJoin(units, eq(lessons.unitId, units.id)).innerJoin(subjects, eq(units.subjectId, subjects.id)).where(eq(errorNotebookEntries.userId, userId)).limit(200),
    db.select({ subjectId: subjects.id }).from(reviewQueueItems).innerJoin(exercises, eq(reviewQueueItems.exerciseId, exercises.id)).innerJoin(lessons, eq(exercises.lessonId, lessons.id)).innerJoin(units, eq(lessons.unitId, units.id)).innerJoin(subjects, eq(units.subjectId, subjects.id)).where(and(eq(reviewQueueItems.userId, userId), isNull(reviewQueueItems.completedAt))).limit(200),
  ]);

  const snapshots = subjectRows.map(subject => ({
    subjectId: subject.subjectId,
    subjectNameAr: subject.subjectNameAr,
    masteryScores: masteryRows.filter(row => row.subjectId === subject.subjectId).map(row => Number(row.score)),
    repeatedErrors: errorRows.filter(row => row.subjectId === subject.subjectId).reduce((sum, row) => sum + row.occurrences, 0),
    dueReviews: reviewRows.filter(row => row.subjectId === subject.subjectId).length,
  }));
  return { availableDays, priorities: buildTransparentHassemPlan(snapshots, availableDays) };
}
