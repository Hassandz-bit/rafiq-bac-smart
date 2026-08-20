import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { updatePlanConfiguration } from "./subscriptions";

function planQuery(rows: unknown[]) {
  const query = { from: () => query, where: () => query, limit: () => Promise.resolve(rows) };
  return query;
}

describe("تحديث كتالوج المنتجات إداريًا", () => {
  beforeEach(() => vi.resetAllMocks());

  it("يحدّث السعر والمدة والسعة ويستبدل الاستحقاقات في معاملة واحدة دون دفع", async () => {
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      select: vi.fn().mockReturnValue(planQuery([{ id: 30003 }])),
      update: vi.fn().mockReturnValue({ set: updateSet }),
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    mocks.getDb.mockResolvedValue({ transaction: (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) });

    await expect(updatePlanConfiguration({ id: 30003, priceDzd: 5100, durationDays: 260, subjectLimit: 2, subjectBundle: ["math", "physics"], isActive: true, entitlements: [" season:subjects ", "hasm:subjects", "season:subjects"] })).resolves.toEqual({ success: true, entitlements: ["season:subjects", "hasm:subjects"], subjectBundle: ["math", "physics"] });
    expect(updateSet).toHaveBeenCalledWith({ priceDzd: 5100, durationDays: 260, subjectLimit: 2, subjectBundle: ["math", "physics"], isActive: true });
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledWith([{ planId: 30003, entitlement: "season:subjects" }, { planId: 30003, entitlement: "hasm:subjects" }]);
  });

  it("يرفض تحديث خطة غير موجودة قبل حذف استحقاقاتها", async () => {
    const deleteWhere = vi.fn();
    const tx = {
      select: vi.fn().mockReturnValue(planQuery([])),
      update: vi.fn(),
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn(),
    };
    mocks.getDb.mockResolvedValue({ transaction: (callback: (database: typeof tx) => Promise<unknown>) => callback(tx) });
    await expect(updatePlanConfiguration({ id: 99999, priceDzd: 0, durationDays: 0, subjectLimit: 0, subjectBundle: ["math"], isActive: false, entitlements: [] })).rejects.toThrow("الخطة المطلوبة غير موجودة");
    expect(deleteWhere).not.toHaveBeenCalled();
  });
});
