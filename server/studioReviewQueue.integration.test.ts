import { describe, expect, it } from "vitest";
import { getStudioReviewQueue } from "./curriculum";

describe("طابور مراجعة Content Studio الحقيقي", () => {
  it("يعيد حزم Batch 1 الست في in_review مع سياق المادة والمصدر فقط", async () => {
    const queue = await getStudioReviewQueue();
    expect(queue.map(item => item.id)).toEqual([90001, 90002, 90003, 90004, 90005, 90006]);
    expect(queue.every(item => item.workflowState === "in_review" && item.type === "batch_review_package" && item.publicationBlocked && item.sourceReviewRequired && item.reviewComponentState === "outline_only")).toBe(true);
    expect(queue.every(item => Boolean(item.subjectNameAr) && Boolean(item.unitTitleAr) && item.sourceAuthority?.includes("نسخة عمل مرجعية قدمها المستخدم"))).toBe(true);
    expect(queue.every(item => item.reviewComponents.length === 12 && item.reviewComponents.every(component => component.workflowState === "in_review" && component.publicationBlocked && component.sourceReviewRequired && component.componentState === "outline_only" && component.contentStatus === "original_draft_text" && Boolean(component.draftContentAr) && component.sourceId === item.sourceId))).toBe(true);
  });
});
