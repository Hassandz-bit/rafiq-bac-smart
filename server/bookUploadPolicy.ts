import type { AppRole } from "./authorization";

export const MAX_OFFICIAL_BOOK_BYTES = 25 * 1024 * 1024;

export function canUploadOfficialBook(role: AppRole) {
  return role === "admin" || role === "content_editor";
}

export function validateOfficialBookUpload(input: { filename: string; contentType: string; byteLength: number }) {
  if (!input.filename.toLowerCase().endsWith(".pdf")) return { ok: false as const, message: "يجب أن يكون الكتاب المرفوع بصيغة PDF." };
  if (input.contentType !== "application/pdf") return { ok: false as const, message: "نوع الملف غير مدعوم؛ يُقبل PDF فقط." };
  if (input.byteLength === 0) return { ok: false as const, message: "الملف المرفوع فارغ." };
  if (input.byteLength > MAX_OFFICIAL_BOOK_BYTES) return { ok: false as const, message: "حجم الملف يتجاوز 25 ميغابايت." };
  return { ok: true as const };
}

export function safeUploadFilename(filename: string) {
  const normalized = filename.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120);
  return normalized || "official-book.pdf";
}
