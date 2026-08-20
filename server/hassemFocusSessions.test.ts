import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { completeHassemFocusSession, startHassemFocusSession } from "./hassemFocusSessions";

function selectQuery(rows: unknown[]) {
  const query = { from: () => query, where: () => query, limit: () => Promise.resolve(rows) };
  return query;
}

describe("جلسات الحسم القصيرة", () => {
  beforeEach(() => vi.resetAllMocks());

  it("يحفظ جلسة 10 دقائق بنوع مراجعة سريع", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 71 }]);
    mocks.getDb.mockResolvedValue({ insert: vi.fn().mockReturnValue({ values }) });
    await expect(startHassemFocusSession(42, 10)).resolves.toEqual({ id: 71, durationMinutes: 10, sessionType: "quick_review", status: "started" });
    expect(values).toHaveBeenCalledWith({ userId: 42, durationMinutes: 10, sessionType: "quick_review", status: "started" });
  });

  it("يتمم الجلسة فقط عندما تنتمي للحساب وما تزال قيد التنفيذ", async () => {
    const set = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mocks.getDb.mockResolvedValue({ select: vi.fn().mockReturnValue(selectQuery([{ id: 71, durationMinutes: 20 }])), update: vi.fn().mockReturnValue({ set }) });
    await expect(completeHassemFocusSession({ userId: 42, sessionId: 71 })).resolves.toEqual({ id: 71, durationMinutes: 20, status: "completed" });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", completedAt: expect.any(Date) }));
  });

  it("لا يحدّث جلسة مفقودة أو تابعة لحساب آخر", async () => {
    const update = vi.fn();
    mocks.getDb.mockResolvedValue({ select: vi.fn().mockReturnValue(selectQuery([])), update });
    await expect(completeHassemFocusSession({ userId: 42, sessionId: 999 })).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
  });
});
