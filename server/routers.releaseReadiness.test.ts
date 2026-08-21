import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const readinessMocks = vi.hoisted(() => ({ getReleaseReadinessDashboard: vi.fn() }));
vi.mock("./releaseReadiness", () => readinessMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

const admin = { id: 1, openId: "admin-readiness", email: "admin@example.com", name: "مدير", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const student = { ...admin, id: 2, openId: "student-readiness", role: "student" as const };

describe("administration.releaseReadiness", () => {
  it("يعرض للمدير ملخصًا للقراءة فقط", async () => {
    const summary = { isReadOnly: true as const, batch1: { publicationAllowed: false } };
    readinessMocks.getReleaseReadinessDashboard.mockResolvedValue(summary);
    await expect(appRouter.createCaller(context(admin)).administration.releaseReadiness()).resolves.toEqual(summary);
    expect(readinessMocks.getReleaseReadinessDashboard).toHaveBeenCalledTimes(1);
  });

  it("يرفض الطالب وغير المصدق قبل استدعاء ملخص الجاهزية", async () => {
    await expect(appRouter.createCaller(context(student)).administration.releaseReadiness()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).administration.releaseReadiness()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
