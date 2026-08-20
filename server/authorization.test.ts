import { describe, expect, it } from "vitest";
import { canEditContent, canPublishContent, canReviewContent, sourceAllowsAcademicPublishing } from "./authorization";

describe("مصفوفة الصلاحيات وبوابة المصدر", () => {
  it("تسمح للمحرر بالتحرير دون المراجعة", () => {
    expect(canEditContent("content_editor")).toBe(true);
    expect(canReviewContent("content_editor")).toBe(false);
  });

  it("لا تسمح بالنشر إلا عند اعتماد بشري ومصدر رسمي حالي", () => {
    expect(
      canPublishContent({
        role: "academic_reviewer",
        workflowState: "approved",
        sourceStatus: "current_official",
        reviewerApproved: true,
      }),
    ).toBe(true);
    expect(
      canPublishContent({
        role: "admin",
        workflowState: "approved",
        sourceStatus: "official_but_version_unconfirmed",
        reviewerApproved: true,
      }),
    ).toBe(false);
    expect(sourceAllowsAcademicPublishing("unverified")).toBe(false);
  });

  it("يحظر نشر المصدر التجريبي الداخلي حتى لو تغيّرت حالة المصدر لاحقًا", () => {
    expect(
      canPublishContent({
        role: "academic_reviewer",
        workflowState: "approved",
        sourceStatus: "current_official",
        isInternalPilot: true,
        reviewerApproved: true,
      }),
    ).toBe(false);
    expect(sourceAllowsAcademicPublishing("current_official", true)).toBe(false);
  });
});
