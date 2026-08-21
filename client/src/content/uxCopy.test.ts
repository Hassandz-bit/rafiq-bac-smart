import { describe, expect, it } from "vitest";
import { subjectCopy, uxCopy } from "./uxCopy";

describe("قاموس UX العربي", () => {
  it("يوفر عنوانًا وCTA واضحين من دون وعود بالنتيجة", () => {
    expect(uxCopy.brand.tagline).toBe("افهم أكثر. تدرّب بذكاء. اقترب من هدفك.");
    expect(uxCopy.home.primaryCta).toBe("ابدأ رحلتك مجانًا");
    expect(uxCopy.hassem.primaryCta).toBe("ابدأ مرحلة الحسم");
    expect(JSON.stringify(uxCopy)).not.toMatch(/نضمن|20\/20|ستنجح بالتأكيد/);
  });

  it("يحافظ على شخصية لغوية مميزة لكل مادة", () => {
    expect(subjectCopy("math")).toContain("الأرقام");
    expect(subjectCopy("physics")).toContain("الظاهرة");
    expect(subjectCopy("natural_sciences")).toContain("التفاصيل");
  });
});
