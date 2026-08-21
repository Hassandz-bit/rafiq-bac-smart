import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const intakeMocks = vi.hoisted(() => ({ getOfficialBookIntake: vi.fn(), reviewOfficialBookUpload: vi.fn() }));
vi.mock("./officialBookIntake", () => intakeMocks);

import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const reviewer = { id: 11, openId: "intake-reviewer", email: "reviewer@example.com", name: "مراجع", loginMethod: "manus", role: "academic_reviewer" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const editor = { ...reviewer, id: 12, openId: "intake-editor", role: "content_editor" as const };
const student = { ...reviewer, id: 13, openId: "intake-student", role: "student" as const };
const checklist = { cover: true, title: true, level: true, track: true, publisher: true, authorship: true, edition: true, bookCode: true, publicationYear: true, tableOfContents: true };

describe("studio.officialBookIntake", () => {
  it("يعرض طابور الملف لفريق المحتوى ولا ينفذ مراجعة أو نشرًا", async () => {
    const files = [{ id: 70001, originalFilename: "math.pdf", verificationStatus: "unverified" }];
    intakeMocks.getOfficialBookIntake.mockResolvedValue(files);

    await expect(appRouter.createCaller(context(editor)).studio.officialBookIntake({ limit: 20 })).resolves.toEqual(files);
    expect(intakeMocks.getOfficialBookIntake).toHaveBeenCalledWith(20);
    expect(intakeMocks.reviewOfficialBookUpload).not.toHaveBeenCalled();
    await expect(appRouter.createCaller(context(student)).studio.officialBookIntake({ limit: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("studio.reviewOfficialBookUpload", () => {
  it("يسمح للمراجع بحفظ قائمة فحص ملف مع بقاء المصدر والنشر مقفلين", async () => {
    const result = { id: 70001, verificationStatus: "current_official" as const, verificationChecklist: checklist, reviewedByUserId: 11, reviewedAt: new Date(), publicationBlocked: true as const, sourceChanged: false as const };
    intakeMocks.reviewOfficialBookUpload.mockResolvedValue(result);

    await expect(appRouter.createCaller(context(reviewer)).studio.reviewOfficialBookUpload({ uploadId: 70001, verificationStatus: "current_official", verificationChecklist: checklist })).resolves.toMatchObject({ publicationBlocked: true, sourceChanged: false });
    expect(intakeMocks.reviewOfficialBookUpload).toHaveBeenCalledWith({ uploadId: 70001, verificationStatus: "current_official", verificationChecklist: checklist, reviewerUserId: 11 });
    await expect(appRouter.createCaller(context(editor)).studio.reviewOfficialBookUpload({ uploadId: 70001, verificationStatus: "unverified", verificationChecklist: checklist })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(null)).studio.reviewOfficialBookUpload({ uploadId: 70001, verificationStatus: "unverified", verificationChecklist: checklist })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
