import { and, desc, eq, inArray } from "drizzle-orm";
import { plans, studentEntitlements, studentPlanAssignments } from "../drizzle/schema";
import { getDb } from "./db";
import { resolvePlanEntitlementGrant, type EntitledSubject, type GrantablePlanCode } from "./entitlementRules";

/**
 * Internal provisioning only: this does not collect payment details or represent a payment confirmation.
 * It records the access claims that an administrator has already approved operationally.
 */
export async function grantPlanAccess(input: { userId: number; planCode: GrantablePlanCode; subjects: EntitledSubject[]; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const productTier = input.planCode.startsWith("season_") ? "season" : "hasm";
  let resolvedGrant: ReturnType<typeof resolvePlanEntitlementGrant> | null = null;
  let resolvedExpiresAt: Date | null = null;

  await db.transaction(async tx => {
    const plan = await tx.select({ id: plans.id, subjectBundle: plans.subjectBundle, subjectLimit: plans.subjectLimit, durationDays: plans.durationDays, isActive: plans.isActive }).from(plans).where(eq(plans.code, input.planCode)).limit(1);
    if (!plan[0]) throw new Error("الخطة المطلوبة غير مهيأة في كتالوج المنتجات.");
    if (!plan[0].isActive) throw new Error("الخطة المطلوبة موقوفة ولا يمكن تعيينها.");
    if (plan[0].subjectLimit < 1 || plan[0].subjectLimit > 3) throw new Error("سعة المواد في الخطة غير صالحة للتعيين.");
    const grant = resolvePlanEntitlementGrant({ planCode: input.planCode, subjects: input.subjects, requiredSubjectCount: plan[0].subjectLimit });
    const allowedSubjects = Array.isArray(plan[0].subjectBundle) ? plan[0].subjectBundle.filter((subject): subject is EntitledSubject => subject === "math" || subject === "physics" || subject === "natural_sciences") : [];
    if (!allowedSubjects.length || !grant.subjects.every(subject => allowedSubjects.includes(subject))) throw new Error("اختيار المواد لا يطابق تشكيل الحزمة المعتمد.");
    const expiresAt = input.expiresAt ?? (plan[0].durationDays > 0 ? new Date(Date.now() + plan[0].durationDays * 24 * 60 * 60 * 1000) : null);

    await tx.update(studentPlanAssignments).set({ isActive: false }).where(and(eq(studentPlanAssignments.userId, input.userId), eq(studentPlanAssignments.productTier, productTier), eq(studentPlanAssignments.isActive, true)));
    await tx.insert(studentPlanAssignments).values({ userId: input.userId, planId: plan[0].id, productTier, selectedSubjects: grant.subjects, isActive: true, expiresAt });
    await tx.insert(studentEntitlements).values(grant.entitlements.map(entitlement => ({ userId: input.userId, entitlement, expiresAt }))).onDuplicateKeyUpdate({ set: { expiresAt } });
    resolvedGrant = grant;
    resolvedExpiresAt = expiresAt;
  });

  return { ...resolvedGrant!, productTier, expiresAt: resolvedExpiresAt };
}

/**
 * Internal administrator audit. This is deliberately read-only: it exposes
 * the assignment record and the claims that already exist, never creating,
 * renewing, or revoking student access.
 */
export async function getPlanAssignmentAudit(limit = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const assignments = await db
    .select({
      assignmentId: studentPlanAssignments.id,
      userId: studentPlanAssignments.userId,
      planCode: plans.code,
      planNameAr: plans.nameAr,
      productTier: studentPlanAssignments.productTier,
      selectedSubjects: studentPlanAssignments.selectedSubjects,
      isActive: studentPlanAssignments.isActive,
      assignedAt: studentPlanAssignments.assignedAt,
      expiresAt: studentPlanAssignments.expiresAt,
    })
    .from(studentPlanAssignments)
    .innerJoin(plans, eq(studentPlanAssignments.planId, plans.id))
    .orderBy(desc(studentPlanAssignments.assignedAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  if (!assignments.length) return [];
  const userIds = assignments.map(assignment => assignment.userId).filter((userId, index, all) => all.indexOf(userId) === index);
  const entitlements = await db
    .select({ userId: studentEntitlements.userId, entitlement: studentEntitlements.entitlement, expiresAt: studentEntitlements.expiresAt })
    .from(studentEntitlements)
    .where(inArray(studentEntitlements.userId, userIds));
  const byUser = new Map<number, typeof entitlements>();
  for (const entitlement of entitlements) {
    byUser.set(entitlement.userId, [...(byUser.get(entitlement.userId) ?? []), entitlement]);
  }

  return assignments.map(assignment => ({
    ...assignment,
    activeEntitlements: byUser.get(assignment.userId) ?? [],
  }));
}
