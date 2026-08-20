import { describe, expect, it } from "vitest";
import { filterStudentAccessibleItems, filterStudentVisibleItems, filterStudentVisibleVisualAssets } from "./curriculum";

describe("استرجاع الطالب للمحتوى الأكاديمي", () => {
  it("لا يعيد التجربة الداخلية حتى عند وجود حالة نشر في السجل", () => {
    const visible = filterStudentVisibleItems([
      { id: 1, workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "verified" },
      { id: 2, workflowState: "published", sourceStatus: "current_official", isInternalPilot: true, isUserApprovedWorkingReference: false, sourceGate: "verified" },
      { id: 3, workflowState: "published", sourceStatus: "historical_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "waiting_for_current_official_book" },
    ]);

    expect(visible.map(item => item.id)).toEqual([1]);
  });

  it("يسمح للوحدة المجانية أو المادة المشمولة فقط بعد اجتياز بوابة المصدر", () => {
    const base = { workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "verified" } as const;
    const accessible = filterStudentAccessibleItems(
      [
        { ...base, id: 1, subjectCode: "math", isFreeUnit: true },
        { ...base, id: 2, subjectCode: "physics", isFreeUnit: false },
        { ...base, id: 3, subjectCode: "natural_sciences", isFreeUnit: false },
      ],
      ["subject:physics:access"],
    );
    expect(accessible.map(item => item.id)).toEqual([1, 2]);
  });

  it("يسمح بمرجع عمل معتمد غير داخلي، لكنه لا يسمح لصفة مرجع العمل بتجاوز قفل التجربة الداخلية", () => {
    const visible = filterStudentVisibleItems([
      { id: 9, workflowState: "published", sourceStatus: "historical_official", isInternalPilot: false, isUserApprovedWorkingReference: true, sourceGate: "waiting_for_current_official_book" },
      { id: 10, workflowState: "published", sourceStatus: "historical_official", isInternalPilot: true, isUserApprovedWorkingReference: true, sourceGate: "waiting_for_current_official_book" },
    ]);
    expect(visible.map(item => item.id)).toEqual([9]);
  });

  it("لا يرسل أصلاً بصريًا ما لم يكن عنصر التعلم الأب منشورًا ويمر بوابة المصدر", () => {
    const assets = filterStudentVisibleVisualAssets([
      { id: 1, workflowState: "in_review", sourceStatus: "historical_official", isInternalPilot: true, isUserApprovedWorkingReference: true, sourceGate: "waiting_for_current_official_book" },
      { id: 2, workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, isUserApprovedWorkingReference: false, sourceGate: "verified" },
    ]);
    expect(assets.map(asset => asset.id)).toEqual([2]);
  });
});
