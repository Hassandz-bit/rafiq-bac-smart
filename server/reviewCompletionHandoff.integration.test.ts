import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));
import { appRouter } from "./routers";
import { getHassemNextAction } from "../client/src/lib/hassemSequence";
import { getStudentProgressSummary } from "./studentProgress";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const student = { id: 17, openId: "student", email: "student@example.com", name: "طالب", loginMethod: "manus", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function handoffDb() {
  let active = true;
  let selectCount = 0;
  return {
    select: () => {
      selectCount += 1;
      const current = selectCount;
      const rows = () => {
        if (current === 2) return active ? [{ id: 41, reason: "خطأ متكرر", dueAt: new Date() }] : [];
        if (current === 4) return active ? [{ id: 41 }] : [];
        if (current === 6) return active ? [{ id: 41, reason: "خطأ متكرر", dueAt: new Date() }] : [];
        return [];
      };
      const chain = { innerJoin: () => chain, where: () => ({ limit: () => Promise.resolve(rows()), orderBy: () => ({ limit: () => Promise.resolve(rows()) }) }) };
      return { from: () => chain };
    },
    update: () => ({ set: () => ({ where: () => { active = false; return Promise.resolve(); } }) }),
  };
}

describe("تسليم إتمام المراجعة إلى تشخيص الحسم", () => {
  beforeEach(() => { mocks.getDb.mockReset(); mocks.getDb.mockResolvedValue(handoffDb()); });

  it("يبقي التشخيص مؤجلاً ثم يفتحه بعد إتمام آخر مراجعة عبر العقد المحمي", async () => {
    const before = await getStudentProgressSummary(student.id);
    expect(getHassemNextAction(before.reviews.length)).toBe("due_reviews");

    await expect(appRouter.createCaller(context(student)).progress.completeReview({ reviewId: 41 })).resolves.toEqual({ reviewId: 41, completed: true });

    const after = await getStudentProgressSummary(student.id);
    expect(after.reviews).toEqual([]);
    expect(getHassemNextAction(after.reviews.length)).toBe("bac_diagnostic");
  });
});
