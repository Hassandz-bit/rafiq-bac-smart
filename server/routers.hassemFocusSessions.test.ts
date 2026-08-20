import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ startHassemFocusSession: vi.fn(), completeHassemFocusSession: vi.fn(), getLatestHassemFocusSession: vi.fn() }));
vi.mock("./hassemFocusSessions", () => mocks);
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const student = { id: 42, openId: "hassem-session-student", email: "student@example.com", name: "طالب", loginMethod: "manus", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("hassem focus-session router", () => {
  it("يبدأ جلسة 10 أو 20 دقيقة للحساب المصدق فقط", async () => {
    mocks.startHassemFocusSession.mockResolvedValue({ id: 71, durationMinutes: 10, sessionType: "quick_review", status: "started" });
    await expect(appRouter.createCaller(context(student)).hassem.startSession({ durationMinutes: 10 })).resolves.toMatchObject({ id: 71, status: "started" });
    expect(mocks.startHassemFocusSession).toHaveBeenCalledWith(42, 10);
    await expect(appRouter.createCaller(context(student)).hassem.startSession({ durationMinutes: 15 } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(context(null)).hassem.startSession({ durationMinutes: 20 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يعيد NOT_FOUND عندما لا يمكن إتمام الجلسة المملوكة", async () => {
    mocks.completeHassemFocusSession.mockResolvedValue(null);
    await expect(appRouter.createCaller(context(student)).hassem.completeSession({ sessionId: 71 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.completeHassemFocusSession).toHaveBeenCalledWith({ userId: 42, sessionId: 71 });
  });
});
