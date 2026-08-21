import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const sourceMocks = vi.hoisted(() => ({ createUnverifiedSourceRecord: vi.fn() }));
vi.mock("./sourceRecords", () => sourceMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const editor = { id: 12, openId: "source-editor", email: "editor@example.com", name: "محرر", loginMethod: "manus", role: "content_editor" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const reviewer = { ...editor, id: 13, openId: "source-reviewer", role: "academic_reviewer" as const };
const input = { sourceAuthority: "جهة مرجعية", documentTitle: "كتاب مقترح", url: "https://example.edu/book", subjectId: 301 };

describe("studio.createSource", () => {
  it("يسمح للمحرر بإنشاء سجل غير متحقق ومقيد بالنشر فقط", async () => {
    sourceMocks.createUnverifiedSourceRecord.mockResolvedValue({ id: 70002, subjectId: 301, verificationStatus: "unverified", publicationBlocked: true, createdByUserId: 12, sourcePromoted: false });

    await expect(appRouter.createCaller(context(editor)).studio.createSource(input)).resolves.toMatchObject({ verificationStatus: "unverified", publicationBlocked: true, sourcePromoted: false });
    expect(sourceMocks.createUnverifiedSourceRecord).toHaveBeenCalledWith({ ...input, createdByUserId: 12 });
  });

  it("يرفض إنشاء المصدر من المراجع وغير المصدق", async () => {
    await expect(appRouter.createCaller(context(reviewer)).studio.createSource(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.createSource(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
