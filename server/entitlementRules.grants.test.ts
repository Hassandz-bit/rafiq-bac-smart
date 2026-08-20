import { describe, expect, it } from "vitest";
import { resolvePlanEntitlementGrant } from "./entitlementRules";

describe("منح الموسم والحسم", () => {
  it("يمنح الحسم تلقائيًا لنفس مواد باقة الموسم فقط", () => {
    expect(resolvePlanEntitlementGrant({ planCode: "season_two_subjects", subjects: ["math", "physics"] })).toEqual({
      subjects: ["math", "physics"],
      entitlements: ["subject:math:access", "subject:physics:access", "hasm:math", "hasm:physics"],
    });
  });

  it("يحترم عدد مواد الخطة ولا يسمح بتكرار الاختيارات لتجاوز القاعدة", () => {
    expect(() => resolvePlanEntitlementGrant({ planCode: "season_two_subjects", subjects: ["math", "math"] })).toThrow("تتطلب اختيار 2 مادة/مواد بالضبط");
    expect(() => resolvePlanEntitlementGrant({ planCode: "hasm_three_subjects", subjects: ["math", "physics"] })).toThrow("تتطلب اختيار 3 مادة/مواد بالضبط");
  });

  it("يشتق استحقاقات الموسم والحسم الصحيحة عند كل حد من حدود 1/2/3 مواد", () => {
    expect(resolvePlanEntitlementGrant({ planCode: "season_one_subject", subjects: ["math"] }).entitlements).toEqual(["subject:math:access", "hasm:math"]);
    expect(resolvePlanEntitlementGrant({ planCode: "season_two_subjects", subjects: ["math", "physics"] }).entitlements).toHaveLength(4);
    expect(resolvePlanEntitlementGrant({ planCode: "season_three_subjects", subjects: ["math", "physics", "natural_sciences"] }).entitlements).toEqual([
      "subject:math:access", "subject:physics:access", "subject:science:access", "hasm:math", "hasm:physics", "hasm:natural_sciences",
    ]);
  });

  it("يبقي الحسم المباشر محصورًا في المواد المختارة", () => {
    expect(resolvePlanEntitlementGrant({ planCode: "hasm_one_subject", subjects: ["natural_sciences"] }).entitlements).toEqual(["hasm:natural_sciences"]);
  });
});
