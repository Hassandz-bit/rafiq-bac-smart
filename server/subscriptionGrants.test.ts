import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), resolvePlanEntitlementGrant: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./entitlementRules", () => ({ resolvePlanEntitlementGrant: mocks.resolvePlanEntitlementGrant }));

import { grantPlanAccess } from "./subscriptionGrants";

describe("التفعيل الداخلي للاستحقاقات", () => {
  beforeEach(() => vi.resetAllMocks());

  it("يحفظ فقط الاستحقاقات المحسوبة للخطة دون أي معالجة دفع", async () => {
    const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined);
    const entitlementValues = vi.fn().mockReturnValue({ onDuplicateKeyUpdate });
    const assignmentValues = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValueOnce({ values: assignmentValues }).mockReturnValueOnce({ values: entitlementValues });
    const update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    const planQuery = { from: () => planQuery, where: () => planQuery, limit: () => Promise.resolve([{ id: 30003, subjectBundle: ["math", "physics"] }]) };
    const tx = { select: vi.fn().mockReturnValue(planQuery), update, insert };
    mocks.getDb.mockResolvedValue({ transaction: (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) });
    mocks.resolvePlanEntitlementGrant.mockReturnValue({ subjects: ["math", "physics"], entitlements: ["subject:math:access", "subject:physics:access", "hasm:math", "hasm:physics"] });
    const expiry = new Date("2027-06-01T00:00:00.000Z");

    await expect(grantPlanAccess({ userId: 42, planCode: "season_two_subjects", subjects: ["math", "physics"], expiresAt: expiry })).resolves.toEqual({ subjects: ["math", "physics"], entitlements: ["subject:math:access", "subject:physics:access", "hasm:math", "hasm:physics"], productTier: "season", expiresAt: expiry });
    expect(assignmentValues).toHaveBeenCalledWith({ userId: 42, planId: 30003, productTier: "season", selectedSubjects: ["math", "physics"], isActive: true, expiresAt: expiry });
    expect(entitlementValues).toHaveBeenCalledWith([
      { userId: 42, entitlement: "subject:math:access", expiresAt: expiry },
      { userId: 42, entitlement: "subject:physics:access", expiresAt: expiry },
      { userId: 42, entitlement: "hasm:math", expiresAt: expiry },
      { userId: 42, entitlement: "hasm:physics", expiresAt: expiry },
    ]);
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith({ set: { expiresAt: expiry } });
  });

  it("يتوقف بوضوح عند تعذر قاعدة البيانات", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(grantPlanAccess({ userId: 42, planCode: "hasm_one_subject", subjects: ["math"] })).rejects.toThrow("Database unavailable");
  });

  it("يرفض اختيار مادة لا تدخل ضمن تشكيل الحزمة المحفوظ", async () => {
    const update = vi.fn();
    const planQuery = { from: () => planQuery, where: () => planQuery, limit: () => Promise.resolve([{ id: 30002, subjectBundle: ["math"] }]) };
    const tx = { select: vi.fn().mockReturnValue(planQuery), update, insert: vi.fn() };
    mocks.getDb.mockResolvedValue({ transaction: (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) });
    mocks.resolvePlanEntitlementGrant.mockReturnValue({ subjects: ["physics"], entitlements: ["subject:physics:access", "hasm:physics"] });

    await expect(grantPlanAccess({ userId: 42, planCode: "season_one_subject", subjects: ["physics"] })).rejects.toThrow("اختيار المواد لا يطابق تشكيل الحزمة المعتمد");
    expect(update).not.toHaveBeenCalled();
  });
});
