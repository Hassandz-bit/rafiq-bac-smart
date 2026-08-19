import { describe, expect, it } from "vitest";
import { canAccessPath } from "./routeAccess";

describe("مصفوفة وصول الواجهة", () => {
  it("تفصل مسار الطالب عن مسارات فريق المحتوى", () => {
    expect(canAccessPath("student", "/app")).toBe(true);
    expect(canAccessPath("student", "/studio")).toBe(false);
    expect(canAccessPath("content_editor", "/app")).toBe(false);
  });

  it("تحصر الإدارة في المدير وتسمح للمراجع بمسار المراجعة", () => {
    expect(canAccessPath("admin", "/admin")).toBe(true);
    expect(canAccessPath("academic_reviewer", "/review")).toBe(true);
    expect(canAccessPath("content_editor", "/review")).toBe(false);
  });
});
