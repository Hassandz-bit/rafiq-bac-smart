import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const grantMocks = vi.hoisted(() => ({ grantPlanAccess: vi.fn() }));
vi.mock("./subscriptionGrants", () => grantMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const admin = { id: 1, openId: "admin-subscription", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...admin, id: 42, openId: "student-subscription", role: "student" as const };

describe("administration.grantPlanAccess", () => {
  it("يمرر تفعيلًا تشغيليًا معتمدًا من المدير فقط", async () => {
    const result = { subjects: ["math"], entitlements: ["subject:math:access", "hasm:math"], expiresAt: null };
    grantMocks.grantPlanAccess.mockResolvedValue(result);
    const caller = appRouter.createCaller(context(admin));

    await expect(caller.administration.grantPlanAccess({ userId: 42, planCode: "season_one_subject", subjects: ["math"] })).resolves.toEqual(result);
    expect(grantMocks.grantPlanAccess).toHaveBeenCalledWith({ userId: 42, planCode: "season_one_subject", subjects: ["math"] });
  });

  it("يحظر تفعيل الاستحقاقات على الطالب وغير المصدق", async () => {
    await expect(appRouter.createCaller(context(student)).administration.grantPlanAccess({ userId: 42, planCode: "hasm_one_subject", subjects: ["math"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.grantPlanAccess({ userId: 42, planCode: "hasm_one_subject", subjects: ["math"] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
