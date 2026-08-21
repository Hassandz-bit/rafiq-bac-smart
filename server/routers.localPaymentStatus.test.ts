import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const base = { id: 7, openId: "payment-status-user", email: "admin@example.com", name: "مدير", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const admin = { ...base, role: "admin" as const };
const student = { ...base, id: 8, role: "student" as const };

describe("administration.localPaymentStatus", () => {
  it("يعرض للمدير حد دفع معطّل فقط دون أي عملية تحصيل", async () => {
    const result = await appRouter.createCaller(context(admin)).administration.localPaymentStatus();
    expect(result).toMatchObject({ enabled: false, provider: "none", mode: "manual_only", billingFlowAvailable: false });
    expect(Object.keys(result)).not.toContain("checkoutUrl");
    expect(Object.keys(result)).not.toContain("paymentIntent");
  });

  it("يرفض حساب الطالب", async () => {
    await expect(appRouter.createCaller(context(student)).administration.localPaymentStatus()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
