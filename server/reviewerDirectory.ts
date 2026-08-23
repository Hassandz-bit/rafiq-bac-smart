import { desc, eq, inArray } from "drizzle-orm";
import { partnerAuditLogs, users } from "../drizzle/schema";
import { getDb } from "./db";

const reviewableRoles = ["student", "academic_reviewer"] as const;

export async function getAcademicReviewerDirectory() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt })
    .from(users)
    .where(inArray(users.role, reviewableRoles))
    .orderBy(desc(users.lastSignedIn))
    .limit(100);
}

export async function setAcademicReviewerStatus(input: { actorUserId: number; targetUserId: number; enabled: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [target] = await db.select({ id: users.id, role: users.role, name: users.name, email: users.email }).from(users).where(eq(users.id, input.targetUserId)).limit(1);
  if (!target) return null;
  if (!reviewableRoles.includes(target.role as (typeof reviewableRoles)[number])) {
    throw new Error("لا يمكن لمركز المراجعين تعديل هذا الدور.");
  }

  const nextRole = input.enabled ? "academic_reviewer" : "student" as const;
  if (target.role === nextRole) return { ...target, role: nextRole, changed: false };

  await db.transaction(async tx => {
    await tx.update(users).set({ role: nextRole }).where(eq(users.id, target.id));
    await tx.insert(partnerAuditLogs).values({
      actorUserId: input.actorUserId,
      action: input.enabled ? "academic_reviewer_granted" : "academic_reviewer_revoked",
      entityType: "user_role",
      entityId: target.id,
      previousData: { role: target.role },
      nextData: { role: nextRole },
      noteAr: "تغيير دور مراجعة أكاديمية من مركز المراجعين.",
    });
  });

  return { ...target, role: nextRole, changed: true };
}
