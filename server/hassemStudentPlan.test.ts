import { describe, expect, it } from "vitest";
import { buildTransparentHassemPlan } from "./hassemStudentPlan";

describe("خطة الحسم الشفافة للطالب", () => {
  it("ترفع المادة ذات الإتقان المنخفض والأخطاء والمراجعات المستحقة وتشرح سببها", () => {
    const plan = buildTransparentHassemPlan([
      { subjectId: 1, subjectNameAr: "الرياضيات", masteryScores: [32, 40], repeatedErrors: 3, dueReviews: 2 },
      { subjectId: 2, subjectNameAr: "الفيزياء", masteryScores: [85], repeatedErrors: 0, dueReviews: 0 },
    ], 10);
    expect(plan[0]).toMatchObject({ unitTitleAr: "الرياضيات", state: "priority" });
    expect(plan[0]?.explanationAr).toContain("المراجعات المستحقة 2");
    expect(plan[0]?.nextActionAr).toContain("مراجعة خطأ متكرر");
  });

  it("يستعمل قيمة افتراضية واضحة عندما لا تتوافر سجلات إتقان للمادة", () => {
    const [plan] = buildTransparentHassemPlan([{ subjectId: 3, subjectNameAr: "علوم الطبيعة", masteryScores: [], repeatedErrors: 0, dueReviews: 0 }], 30);
    expect(plan).toMatchObject({ mastery: 50, diagnostic: 60, unitTitleAr: "علوم الطبيعة" });
  });
});
