import type { TrpcContext } from "./_core/context";
import { describe, expect, it, vi } from "vitest";

const draftMocks = vi.hoisted(() => ({ createSourceLinkedDraftComponent: vi.fn() }));
vi.mock("./draftComponents", () => draftMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const base = { id: 7, openId: "draft-user", email: "editor@example.com", name: "محرر", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const editor = { ...base, role: "content_editor" as const };
const admin = { ...base, id: 1, role: "admin" as const };
const reviewer = { ...base, id: 8, role: "academic_reviewer" as const };
const input = { parentLearningItemId: 90001, titleAr: "ملاحظة توجيهية أصلية", componentKey: "guided_note", draftTextAr: "هذه مسودة عربية أصلية مرتبطة بالمصدر وتحتاج مراجعة." };

describe("studio.createDraftComponent", () => {
  it("يسمح للمحرر بإنشاء Draft مرتبط بمصدر الأب دون أي حقل نشر", async () => {
    const result = { id: 99001, workflowState: "draft" as const, publicationBlocked: true as const, inheritedSourceId: 30001 };
    draftMocks.createSourceLinkedDraftComponent.mockResolvedValue(result);
    await expect(appRouter.createCaller(context(editor)).studio.createDraftComponent(input)).resolves.toEqual(result);
    expect(draftMocks.createSourceLinkedDraftComponent).toHaveBeenCalledWith({ ...input, authorUserId: editor.id });
    expect(Object.keys(input)).not.toContain("publishedAt");
  });

  it("يسمح للمدير ويرفض المراجع وغير المصدق", async () => {
    draftMocks.createSourceLinkedDraftComponent.mockResolvedValue({ id: 99002, workflowState: "draft", publicationBlocked: true, inheritedSourceId: 30001 });
    await expect(appRouter.createCaller(context(admin)).studio.createDraftComponent(input)).resolves.toMatchObject({ workflowState: "draft", publicationBlocked: true });
    await expect(appRouter.createCaller(context(reviewer)).studio.createDraftComponent(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.createDraftComponent(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
