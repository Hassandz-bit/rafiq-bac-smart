import { describe, expect, it } from "vitest";
import { filterStudentAccessibleItems, filterStudentVisibleItems } from "./curriculum";

describe("استرجاع الطالب للمحتوى الأكاديمي", () => {
  it("لا يعيد التجربة الداخلية حتى عند وجود حالة نشر في السجل", () => {
    const visible = filterStudentVisibleItems([
      { id: 1, workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, sourceGate: "verified" },
      { id: 2, workflowState: "published", sourceStatus: "current_official", isInternalPilot: true, sourceGate: "verified" },
      { id: 3, workflowState: "published", sourceStatus: "historical_official", isInternalPilot: false, sourceGate: "waiting_for_current_official_book" },
    ]);

    expect(visible.map(item => item.id)).toEqual([1]);
  });

  it("يسمح للوحدة المجانية أو المادة المشمولة فقط بعد اجتياز بوابة المصدر", () => {
    const base = { workflowState: "published", sourceStatus: "current_official", isInternalPilot: false, sourceGate: "verified" } as const;
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
});
