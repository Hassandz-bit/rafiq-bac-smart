import { and, desc, eq } from "drizzle-orm";
import { hassemFocusSessions } from "../drizzle/schema";
import { getDb } from "./db";

export type HassemFocusDuration = 10 | 20;

export async function startHassemFocusSession(userId: number, durationMinutes: HassemFocusDuration) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const sessionType = durationMinutes === 10 ? "quick_review" : "consolidation";
  const result = await db.insert(hassemFocusSessions).values({ userId, durationMinutes, sessionType, status: "started" });
  return { id: Number(result[0].insertId), durationMinutes, sessionType, status: "started" as const };
}

export async function completeHassemFocusSession(input: { userId: number; sessionId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const active = await db.select({ id: hassemFocusSessions.id, durationMinutes: hassemFocusSessions.durationMinutes }).from(hassemFocusSessions).where(and(eq(hassemFocusSessions.id, input.sessionId), eq(hassemFocusSessions.userId, input.userId), eq(hassemFocusSessions.status, "started"))).limit(1);
  if (!active[0]) return null;
  await db.update(hassemFocusSessions).set({ status: "completed", completedAt: new Date() }).where(and(eq(hassemFocusSessions.id, input.sessionId), eq(hassemFocusSessions.userId, input.userId)));
  return { id: active[0].id, durationMinutes: active[0].durationMinutes, status: "completed" as const };
}

export async function getLatestHassemFocusSession(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ id: hassemFocusSessions.id, durationMinutes: hassemFocusSessions.durationMinutes, status: hassemFocusSessions.status, startedAt: hassemFocusSessions.startedAt, completedAt: hassemFocusSessions.completedAt }).from(hassemFocusSessions).where(eq(hassemFocusSessions.userId, userId)).orderBy(desc(hassemFocusSessions.startedAt)).limit(1);
  return rows[0] ?? null;
}
