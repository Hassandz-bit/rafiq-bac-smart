import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), updateWhere: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
import { completeStudentReview } from "./studentProgress";

function mockDb(review: { id: number } | undefined) {
  return {
    select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve(review ? [review] : []) }) }) }),
    update: () => ({ set: () => ({ where: (condition: unknown) => { mocks.updateWhere(condition); return Promise.resolve(); } }) }),
  };
}

describe("إتمام مراجعة الطالب", () => {
  beforeEach(() => { mocks.getDb.mockReset(); mocks.updateWhere.mockReset(); });

  it("يؤشر مراجعة مملوكة وغير مكتملة فقط", async () => {
    mocks.getDb.mockResolvedValue(mockDb({ id: 41 }));
    await expect(completeStudentReview({ userId: 7, reviewId: 41 })).resolves.toEqual({ reviewId: 41, completed: true });
    expect(mocks.updateWhere).toHaveBeenCalledTimes(1);
  });

  it("لا يحدّث مراجعة غير مملوكة أو منجزة سابقًا", async () => {
    mocks.getDb.mockResolvedValue(mockDb(undefined));
    await expect(completeStudentReview({ userId: 7, reviewId: 999 })).resolves.toBeNull();
    expect(mocks.updateWhere).not.toHaveBeenCalled();
  });
});
