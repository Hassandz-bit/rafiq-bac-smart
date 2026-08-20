import { vi, describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ completeStudentReview: vi.fn(), getStudentProgressSummary: vi.fn() }));
vi.mock("./studentProgress", () => ({ completeStudentReview: mocks.completeStudentReview, getStudentProgressSummary: mocks.getStudentProgressSummary }));
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const student = { id: 17, openId: "student", email: "student@example.com", name: "طالب", loginMethod: "manus", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("progress.completeReview", () => {
  it("يمرر هوية الطالب للإجراء المقيد بالملكية ويرفض السجل غير القابل للإتمام", async () => {
    mocks.completeStudentReview.mockResolvedValueOnce({ reviewId: 41, completed: true });
    await expect(appRouter.createCaller(context(student)).progress.completeReview({ reviewId: 41 })).resolves.toEqual({ reviewId: 41, completed: true });
    expect(mocks.completeStudentReview).toHaveBeenCalledWith({ userId: 17, reviewId: 41 });

    mocks.completeStudentReview.mockResolvedValueOnce(null);
    await expect(appRouter.createCaller(context(student)).progress.completeReview({ reviewId: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
