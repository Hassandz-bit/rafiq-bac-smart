import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { officialBookUploads } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { canUploadOfficialBook, safeUploadFilename, validateOfficialBookUpload } from "./bookUploadPolicy";
import { getDb } from "./db";
import { storagePut } from "./storage";

export async function uploadOfficialBook(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!canUploadOfficialBook(user.role)) return res.status(403).json({ error: "ليس لديك دور يسمح برفع كتاب رسمي." });

    const subjectId = Number(req.header("x-subject-id"));
    const originalFilename = req.header("x-file-name") ?? "";
    const contentType = req.header("content-type")?.split(";")[0] ?? "";
    const fileBuffer = req.body as Buffer;
    if (!Number.isInteger(subjectId) || subjectId <= 0) return res.status(400).json({ error: "المادة غير صالحة." });
    if (!Buffer.isBuffer(fileBuffer)) return res.status(400).json({ error: "تعذر قراءة محتوى الملف." });

    const validation = validateOfficialBookUpload({ filename: originalFilename, contentType, byteLength: fileBuffer.length });
    if (!validation.ok) return res.status(400).json({ error: validation.message });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "قاعدة البيانات غير متاحة حاليًا." });

    const safeName = safeUploadFilename(originalFilename);
    const fileKey = `official-books/${subjectId}/${user.id}/${Date.now()}-${nanoid(8)}-${safeName}`;
    const stored = await storagePut(fileKey, fileBuffer, "application/pdf");
    await db.insert(officialBookUploads).values({
      subjectId,
      fileKey: stored.key,
      fileUrl: stored.url,
      originalFilename,
      mimeType: "application/pdf",
      verificationChecklist: {
        cover: false,
        title: false,
        level: false,
        track: false,
        publisher: false,
        authorship: false,
        edition: false,
        bookCode: false,
        publicationYear: false,
        tableOfContents: false,
      },
      verificationStatus: "unverified",
      uploadedByUserId: user.id,
    });
    return res.status(201).json({ success: true, filename: originalFilename, status: "unverified" });
  } catch (error) {
    console.error("[OfficialBookUpload] Failed:", error);
    return res.status(500).json({ error: "تعذر حفظ الملف. لم تتغير حالة المصدر الأكاديمية." });
  }
}
