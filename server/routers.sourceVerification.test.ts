import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ updateSourceVerification: vi.fn() }));
vi.mock("./sourceVerification", () => ({ updateSourceVerification: mocks.updateSourceVerification }));
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext { return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const reviewer = { id: 11, openId: "reviewer", email: "reviewer@example.com", name: "مراجع", loginMethod: "manus", role: "academic_reviewer" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const editor = { ...reviewer, id: 12, role: "content_editor" as const };

describe("studio.updateSourceVerification", () => {
  it("يقبل دليل المراجع فقط ولا يعيد أي مسار نشر", async () => {
    mocks.updateSourceVerification.mockResolvedValue({ sourceId: 30001, verificationStatus: "official_but_version_unconfirmed", publicationBlocked: true, reviewedByUserId: 11 });
    await expect(appRouter.createCaller(context(reviewer)).studio.updateSourceVerification({ sourceId: 30001, verificationStatus: "official_but_version_unconfirmed", verificationNotes: "تحتاج النسخة إلى تحقق من السنة الدراسية." })).resolves.toMatchObject({ publicationBlocked: true });
    expect(mocks.updateSourceVerification).toHaveBeenCalledWith(expect.objectContaining({ reviewerUserId: 11 }));
    await expect(appRouter.createCaller(context(editor)).studio.updateSourceVerification({ sourceId: 30001, verificationStatus: "unverified", verificationNotes: "لا يحق للمحرر اعتماد المصدر." })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
