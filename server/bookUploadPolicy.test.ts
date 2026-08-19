import { describe, expect, it } from "vitest";
import { canUploadOfficialBook, validateOfficialBookUpload } from "./bookUploadPolicy";

describe("بوابة رفع الكتاب الرسمي", () => {
  it("تقصر الرفع على المدير أو محرر المحتوى", () => {
    expect(canUploadOfficialBook("admin")).toBe(true);
    expect(canUploadOfficialBook("content_editor")).toBe(true);
    expect(canUploadOfficialBook("academic_reviewer")).toBe(false);
    expect(canUploadOfficialBook("student")).toBe(false);
  });

  it("تقبل PDF محدود الحجم فقط", () => {
    expect(validateOfficialBookUpload({ filename: "book.pdf", contentType: "application/pdf", byteLength: 1024 }).ok).toBe(true);
    expect(validateOfficialBookUpload({ filename: "book.docx", contentType: "application/pdf", byteLength: 1024 }).ok).toBe(false);
    expect(validateOfficialBookUpload({ filename: "book.pdf", contentType: "text/plain", byteLength: 1024 }).ok).toBe(false);
  });
});
