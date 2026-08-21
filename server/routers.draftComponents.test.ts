import type { TrpcContext } from "./_core/context";
import { describe, expect, it, vi } from "vitest";

const draftMocks = vi.hoisted(() => ({ createSourceLinkedDraftComponent: vi.fn(), updateDraftComponent: vi.fn(), submitDraftComponentForReview: vi.fn(), discardDraftComponent: vi.fn() }));
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

describe("studio.updateDraftComponent", () => {
  const updateInput = { learningItemId: 99001, titleAr: "ملاحظة توجيهية محدثة", draftTextAr: "نص مسودة عربي محدث يظل مقيدًا بالمصدر والمراجعة." };

  it("يسمح للمحرر بتحديث نص وعنوان Draft فقط دون أي حقل مراجعة أو نشر", async () => {
    const result = { id: 99001, workflowState: "draft" as const, publicationBlocked: true as const, sourceId: 30001, lessonId: 701 };
    draftMocks.updateDraftComponent.mockResolvedValue(result);
    await expect(appRouter.createCaller(context(editor)).studio.updateDraftComponent(updateInput)).resolves.toEqual(result);
    expect(draftMocks.updateDraftComponent).toHaveBeenCalledWith(updateInput);
    expect(Object.keys(updateInput)).not.toContain("workflowState");
    expect(Object.keys(updateInput)).not.toContain("publishedAt");
  });

  it("يسمح للمدير ويرفض المراجع وغير المصدق", async () => {
    draftMocks.updateDraftComponent.mockResolvedValue({ id: 99001, workflowState: "draft", publicationBlocked: true, sourceId: 30001, lessonId: 701 });
    await expect(appRouter.createCaller(context(admin)).studio.updateDraftComponent(updateInput)).resolves.toMatchObject({ workflowState: "draft", publicationBlocked: true });
    await expect(appRouter.createCaller(context(reviewer)).studio.updateDraftComponent(updateInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.updateDraftComponent(updateInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("studio.submitDraftComponentForReview", () => {
  const reviewInput = { learningItemId: 99001 };

  it("يسمح للمحرر بإرسال Draft للمراجعة فقط مع بقاء النشر مقفلاً", async () => {
    const result = { id: 99001, workflowState: "in_review" as const, publicationBlocked: true as const, sourceId: 30001, lessonId: 701 };
    draftMocks.submitDraftComponentForReview.mockResolvedValue(result);
    await expect(appRouter.createCaller(context(editor)).studio.submitDraftComponentForReview(reviewInput)).resolves.toEqual(result);
    expect(draftMocks.submitDraftComponentForReview).toHaveBeenCalledWith(reviewInput);
    expect(Object.keys(reviewInput)).not.toContain("publishedAt");
  });

  it("يسمح للمدير ويرفض المراجع وغير المصدق", async () => {
    draftMocks.submitDraftComponentForReview.mockResolvedValue({ id: 99001, workflowState: "in_review", publicationBlocked: true, sourceId: 30001, lessonId: 701 });
    await expect(appRouter.createCaller(context(admin)).studio.submitDraftComponentForReview(reviewInput)).resolves.toMatchObject({ workflowState: "in_review", publicationBlocked: true });
    await expect(appRouter.createCaller(context(reviewer)).studio.submitDraftComponentForReview(reviewInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.submitDraftComponentForReview(reviewInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("studio.discardDraftComponent", () => {
  const discardInput = { learningItemId: 99001, noteAr: "أرشفة محرر قبل المراجعة." };

  it("يسمح للمحرر بأرشفة Draft كسجل تدقيق دون حذف أو نشر", async () => {
    const result = { id: 99001, workflowState: "archived" as const, publicationBlocked: true as const, sourceId: 30001, lessonId: 701 };
    draftMocks.discardDraftComponent.mockResolvedValue(result);
    await expect(appRouter.createCaller(context(editor)).studio.discardDraftComponent(discardInput)).resolves.toEqual(result);
    expect(draftMocks.discardDraftComponent).toHaveBeenCalledWith(discardInput);
    expect(Object.keys(discardInput)).not.toContain("publishedAt");
    expect(Object.keys(discardInput)).not.toContain("sourceId");
  });

  it("يسمح للمدير ويرفض المراجع وغير المصدق", async () => {
    draftMocks.discardDraftComponent.mockResolvedValue({ id: 99001, workflowState: "archived", publicationBlocked: true, sourceId: 30001, lessonId: 701 });
    await expect(appRouter.createCaller(context(admin)).studio.discardDraftComponent(discardInput)).resolves.toMatchObject({ workflowState: "archived", publicationBlocked: true });
    await expect(appRouter.createCaller(context(reviewer)).studio.discardDraftComponent(discardInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.discardDraftComponent(discardInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
