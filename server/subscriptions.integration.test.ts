import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { appRouter } from "./routers";
import { getPlanCatalog } from "./subscriptions";

const expectedCatalog = [
  { code: "trial_bundle", priceDzd: 0, entitlement: "trial:all" },
  { code: "season_one_subject", priceDzd: 2900, entitlement: "season:subject" },
  { code: "season_two_subjects", priceDzd: 4900, entitlement: "season:subjects" },
  { code: "season_three_subjects", priceDzd: 6900, entitlement: "season:all" },
  { code: "hasm_one_subject", priceDzd: 1200, entitlement: "hasm:subject" },
  { code: "hasm_two_subjects", priceDzd: 2100, entitlement: "hasm:subjects" },
  { code: "hasm_three_subjects", priceDzd: 2900, entitlement: "hasm:all" },
];

const admin = { id: 1, openId: "admin-catalog-verification", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("كتالوج المنتجات المحفوظ", () => {
  it("يعيد حزم التجربة والموسم والحسم بأسعارها واستحقاقاتها التشغيلية المعتمدة", async () => {
    if (!await getDb()) return;
    const catalog = await getPlanCatalog();
    const verified = expectedCatalog.map(expected => {
      const plan = catalog.find(item => item.code === expected.code);
      return { code: plan?.code, priceDzd: plan?.priceDzd, active: plan?.isActive, entitlement: plan?.entitlements[0] };
    });
    expect(verified).toEqual(expectedCatalog.map(item => ({ code: item.code, priceDzd: item.priceDzd, active: true, entitlement: item.entitlement })));
  });

  it("يعرض الكتالوج الحقيقي من الإجراء الإداري المحمي", async () => {
    if (!await getDb()) return;
    const result = await appRouter.createCaller(context(admin)).administration.planCatalog();
    expect(result.filter(item => item.code.startsWith("season_") || item.code.startsWith("hasm_") || item.code === "trial_bundle")).toHaveLength(7);
  });
});
