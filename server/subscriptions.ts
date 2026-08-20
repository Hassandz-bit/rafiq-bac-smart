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
      isActive: plans.isActive,
      entitlement: planEntitlements.entitlement,
    })
    .from(plans)
    .leftJoin(planEntitlements, eq(planEntitlements.planId, plans.id))
    .orderBy(asc(plans.id), asc(planEntitlements.id))
    .limit(30);

  const grouped = new Map<number, { id: number; code: string; nameAr: string; priceDzd: number; isActive: boolean; entitlements: string[] }>();
  for (const row of rows) {
    const current = grouped.get(row.id) ?? { id: row.id, code: row.code, nameAr: row.nameAr, priceDzd: row.priceDzd, isActive: row.isActive, entitlements: [] };
    if (row.entitlement) current.entitlements.push(row.entitlement);
    grouped.set(row.id, current);
  }
  return Array.from(grouped.values());
}
