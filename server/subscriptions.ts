import { asc, eq } from "drizzle-orm";
import { planEntitlements, plans } from "../drizzle/schema";
import { getDb } from "./db";

export async function getPlanCatalog() {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: plans.id,
      code: plans.code,
      nameAr: plans.nameAr,
      priceDzd: plans.priceDzd,
      durationDays: plans.durationDays,
      subjectLimit: plans.subjectLimit,
      subjectBundle: plans.subjectBundle,
      isActive: plans.isActive,
      entitlement: planEntitlements.entitlement,
    })
    .from(plans)
    .leftJoin(planEntitlements, eq(planEntitlements.planId, plans.id))
    .orderBy(asc(plans.id), asc(planEntitlements.id))
    .limit(30);

  const grouped = new Map<number, { id: number; code: string; nameAr: string; priceDzd: number; durationDays: number; subjectLimit: number; subjectBundle: string[]; isActive: boolean; entitlements: string[] }>();
  for (const row of rows) {
    const subjectBundle = Array.isArray(row.subjectBundle) ? row.subjectBundle.filter((subject): subject is string => typeof subject === "string") : [];
    const current = grouped.get(row.id) ?? { id: row.id, code: row.code, nameAr: row.nameAr, priceDzd: row.priceDzd, durationDays: row.durationDays, subjectLimit: row.subjectLimit, subjectBundle, isActive: row.isActive, entitlements: [] };
    if (row.entitlement) current.entitlements.push(row.entitlement);
    grouped.set(row.id, current);
  }
  return Array.from(grouped.values());
}

export async function updatePlanConfiguration(input: { id: number; priceDzd: number; durationDays: number; subjectLimit: number; subjectBundle: string[]; isActive: boolean; entitlements: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalizedEntitlements = Array.from(new Set(input.entitlements.map(item => item.trim()).filter(Boolean)));
  const normalizedSubjectBundle = Array.from(new Set(input.subjectBundle));
  if (input.subjectLimit > normalizedSubjectBundle.length) throw new Error("حد المواد لا يمكن أن يتجاوز تشكيل المواد المسموح.");
  await db.transaction(async tx => {
    const existing = await tx.select({ id: plans.id }).from(plans).where(eq(plans.id, input.id)).limit(1);
    if (!existing[0]) throw new Error("الخطة المطلوبة غير موجودة.");
    await tx.update(plans).set({ priceDzd: input.priceDzd, durationDays: input.durationDays, subjectLimit: input.subjectLimit, subjectBundle: normalizedSubjectBundle, isActive: input.isActive }).where(eq(plans.id, input.id));
    await tx.delete(planEntitlements).where(eq(planEntitlements.planId, input.id));
    if (normalizedEntitlements.length) await tx.insert(planEntitlements).values(normalizedEntitlements.map(entitlement => ({ planId: input.id, entitlement })));
  });
  return { success: true as const, entitlements: normalizedEntitlements, subjectBundle: normalizedSubjectBundle };
}
