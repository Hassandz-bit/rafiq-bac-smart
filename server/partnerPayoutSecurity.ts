import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

export type PayoutMethod = "ccp" | "baridimob" | "bank_transfer" | "other";

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("لا يمكن حفظ وجهة الصرف بأمان قبل تهيئة سر الخادم.");
  return createHash("sha256").update(`${ENV.cookieSecret}:partner-payout-v1`).digest();
}

export function encryptPayoutDestination(payoutMethod: PayoutMethod, destination: string) {
  const normalized = destination.trim().replace(/\s+/g, " ");
  if (normalized.length < 6) throw new Error("بيانات وجهة الصرف غير كافية.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ payoutMethod, destination: normalized }), "utf8"), cipher.final()]);
  const payload = Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64");
  const tail = normalized.slice(-4);
  return { ciphertext: payload, iv: iv.toString("base64"), masked: `•••• ${tail}` };
}
