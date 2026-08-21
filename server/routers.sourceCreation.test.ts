import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const sourceMocks = vi.hoisted(() => ({ createUnverifiedSourceRecord: vi.fn(), updateStandaloneUnverifiedSourceRecord: vi.fn(), archiveStandaloneUnverifiedSourceRecord: vi.fn() }));
vi.mock("./sourceRecords", () => sourceMocks);
const curriculumDraftMocks = vi.hoisted(() => ({ createDraftCurriculumUnit: vi.fn() }));
vi.mock("./curriculumDrafts", () => curriculumDraftMocks);

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

describe("studio.createDraftUnit", () => {
  it("يسمح للمحرر بإنشاء وحدة Draft غير مجانية ومقيدة بالنشر فقط", async () => {
    const unitInput = { subjectId: 301, titleAr: "الحركية الكيميائية", summaryAr: "مسودة" };
    curriculumDraftMocks.createDraftCurriculumUnit.mockResolvedValue({ id: 81001, subjectId: 301, workflowState: "draft", isFreeUnit: false, publicationBlocked: true });

    await expect(appRouter.createCaller(context(editor)).studio.createDraftUnit(unitInput)).resolves.toMatchObject({ workflowState: "draft", isFreeUnit: false, publicationBlocked: true });
    expect(curriculumDraftMocks.createDraftCurriculumUnit).toHaveBeenCalledWith(unitInput);
  });

  it("يرفض إنشاء الوحدة من المراجع وغير المصدق", async () => {
    const unitInput = { subjectId: 301, titleAr: "الحركية الكيميائية" };
    await expect(appRouter.createCaller(context(reviewer)).studio.createDraftUnit(unitInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.createDraftUnit(unitInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("studio.updateStandaloneSource", () => {
  it("يسمح للمحرر بتصحيح بيانات مصدر مستقل مع بقاء الحالة غير متحققة", async () => {
    const updateInput = { sourceId: 70002, sourceAuthority: "جهة محدثة", documentTitle: "سجل محدث", url: "https://example.edu/updated" };
    sourceMocks.updateStandaloneUnverifiedSourceRecord.mockResolvedValue({ sourceId: 70002, verificationStatus: "unverified", publicationBlocked: true, sourceStatusChanged: false });

    await expect(appRouter.createCaller(context(editor)).studio.updateStandaloneSource(updateInput)).resolves.toMatchObject({ verificationStatus: "unverified", publicationBlocked: true, sourceStatusChanged: false });
    expect(sourceMocks.updateStandaloneUnverifiedSourceRecord).toHaveBeenCalledWith(updateInput);
  });

  it("يرفض التعديل من المراجع وغير المصدق", async () => {
    const updateInput = { sourceId: 70002, sourceAuthority: "جهة محدثة", documentTitle: "سجل محدث", url: "https://example.edu/updated" };
    await expect(appRouter.createCaller(context(reviewer)).studio.updateStandaloneSource(updateInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.updateStandaloneSource(updateInput)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("studio.archiveStandaloneSource", () => {
  it("يسمح للمحرر بأرشفة سجل مستقل دون حذف أو ترقية", async () => {
    sourceMocks.archiveStandaloneUnverifiedSourceRecord.mockResolvedValue({ sourceId: 70002, archivedAt: new Date(), archivedByUserId: 12, verificationStatus: "unverified", publicationBlocked: true, deleted: false });

    await expect(appRouter.createCaller(context(editor)).studio.archiveStandaloneSource({ sourceId: 70002 })).resolves.toMatchObject({ verificationStatus: "unverified", publicationBlocked: true, deleted: false });
    expect(sourceMocks.archiveStandaloneUnverifiedSourceRecord).toHaveBeenCalledWith({ sourceId: 70002, archivedByUserId: 12 });
  });

  it("يرفض الأرشفة من المراجع وغير المصدق", async () => {
    await expect(appRouter.createCaller(context(reviewer)).studio.archiveStandaloneSource({ sourceId: 70002 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.archiveStandaloneSource({ sourceId: 70002 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
