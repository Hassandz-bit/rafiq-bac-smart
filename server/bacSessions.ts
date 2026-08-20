import { and, eq } from "drizzle-orm";
import { bacSessions } from "../drizzle/schema";
import { rescuePlanLevel } from "./bacRules";
import { getDb } from "./db";

export async function startBacSession(userId: number, subjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(bacSessions).values({ userId, subjectId, elapsedSeconds: 0, status: "in_progress" });
  return { id: Number(result[0].insertId), status: "in_progress" as const };
}

export async function autosaveBacSession(input: { userId: number; sessionId: number; elapsedSeconds: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(bacSessions)
    .set({ elapsedSeconds: Math.max(0, input.elapsedSeconds) })
    .where(and(eq(bacSessions.id, input.sessionId), eq(bacSessions.userId, input.userId), eq(bacSessions.status, "in_progress")));
  return { success: true } as const;
}

export async function submitBacSession(input: { userId: number; sessionId: number; elapsedSeconds: number; score: number; masteryAverage: number; incompleteLessons: number; remainingDays: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(bacSessions)
    .set({ elapsedSeconds: Math.max(0, input.elapsedSeconds), score: String(Math.max(0, Math.min(100, input.score))), submittedAt: new Date(), status: "analyzed" })
    .where(and(eq(bacSessions.id, input.sessionId), eq(bacSessions.userId, input.userId), eq(bacSessions.status, "in_progress")));
  return {
    score: Math.max(0, Math.min(100, input.score)),
    elapsedSeconds: Math.max(0, input.elapsedSeconds),
    rescueLevel: rescuePlanLevel({ remainingDays: input.remainingDays, masteryAverage: input.masteryAverage, incompleteLessons: input.incompleteLessons }),
  } as const;
}
