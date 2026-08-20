import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const productMocks = vi.hoisted(() => ({ updatePlanConfiguration: vi.fn(), getPlanCatalog: vi.fn() }));
vi.mock("./subscriptions", () => productMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const admin = { id: 1, openId: "admin-product-config", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...admin, id: 42, openId: "student-product-config", role: "student" as const };
const input = { id: 30002, priceDzd: 3200, durationDays: 180, subjectLimit: 1, subjectBundle: ["math", "physics", "natural_sciences"], isActive: true, entitlements: ["season:subject", "hasm:subject"] };

describe("administration.updatePlanConfiguration", () => {
  it("يمرر تحديث كتالوج من المدير فقط", async () => {
    productMocks.updatePlanConfiguration.mockResolvedValue({ success: true, entitlements: input.entitlements, subjectBundle: input.subjectBundle });
    await expect(appRouter.createCaller(context(admin)).administration.updatePlanConfiguration(input)).resolves.toEqual({ success: true, entitlements: input.entitlements, subjectBundle: input.subjectBundle });
    expect(productMocks.updatePlanConfiguration).toHaveBeenCalledWith(input);
  });

  it("يرفض أي تعديل كتالوج من الطالب أو غير المصدق", async () => {
    await expect(appRouter.createCaller(context(student)).administration.updatePlanConfiguration(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.updatePlanConfiguration(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
