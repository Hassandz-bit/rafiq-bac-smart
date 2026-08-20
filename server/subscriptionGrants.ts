import { and, eq } from "drizzle-orm";
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
  const grant = resolvePlanEntitlementGrant({ planCode: input.planCode, subjects: input.subjects });
  const expiresAt = input.expiresAt ?? null;
  const productTier = input.planCode.startsWith("season_") ? "season" : "hasm";

  await db.transaction(async tx => {
    const plan = await tx.select({ id: plans.id }).from(plans).where(eq(plans.code, input.planCode)).limit(1);
    if (!plan[0]) throw new Error("الخطة المطلوبة غير مهيأة في كتالوج المنتجات.");

    await tx.update(studentPlanAssignments).set({ isActive: false }).where(and(eq(studentPlanAssignments.userId, input.userId), eq(studentPlanAssignments.productTier, productTier), eq(studentPlanAssignments.isActive, true)));
    await tx.insert(studentPlanAssignments).values({ userId: input.userId, planId: plan[0].id, productTier, selectedSubjects: grant.subjects, isActive: true, expiresAt });
    await tx.insert(studentEntitlements).values(grant.entitlements.map(entitlement => ({ userId: input.userId, entitlement, expiresAt }))).onDuplicateKeyUpdate({ set: { expiresAt } });
  });

  return { ...grant, productTier, expiresAt };
}
