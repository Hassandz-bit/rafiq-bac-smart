import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
import { getHassemFinalMemory, toggleHassemFinalMemory } from "./hassemFinalMemory";

function memoryDb(initial: Array<Record<string, unknown>> = []) {
  const rows = [...initial] as Array<Record<string, unknown>>;
  return {
    select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => Promise.resolve(rows) }), limit: () => Promise.resolve(rows) }) }) }),
    insert: () => ({ values: (values: Array<Record<string, unknown>>) => { rows.splice(0, rows.length, ...values.map((value, index) => ({ id: index + 1, ...value, completedAt: null }))); return Promise.resolve(); } }),
    update: () => ({ set: (values: Record<string, unknown>) => ({ where: () => { if (rows[0]) Object.assign(rows[0], values); return Promise.resolve(); } }) }),
  };
}

describe("بطاقات ذاكرة الحسم", () => {
  beforeEach(() => mocks.getDb.mockReset());

  it("ينشئ ثلاث بطاقات شخصية آمنة عند أول فتح", async () => {
    mocks.getDb.mockResolvedValue(memoryDb());
    const items = await getHassemFinalMemory(7);
    expect(items).toHaveLength(3);
    expect(items.map(item => item.memoryKey)).toEqual(["personal_cards", "error_signal", "time_check"]);
  });

  it("يبدل حالة الإتمام لبطاقة يملكها الطالب ولا يكشف بطاقة غائبة", async () => {
    mocks.getDb.mockResolvedValue(memoryDb([{ id: 8, userId: 7, memoryKey: "personal_cards", titleAr: "بطاقة", promptAr: "تذكير", completedAt: null }]));
    await expect(toggleHassemFinalMemory({ userId: 7, itemId: 8 })).resolves.toEqual({ id: 8, completed: true });
    mocks.getDb.mockResolvedValue(memoryDb());
    await expect(toggleHassemFinalMemory({ userId: 7, itemId: 999 })).resolves.toBeNull();
  });
});
