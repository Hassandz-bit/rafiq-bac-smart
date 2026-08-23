import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import webpush from "web-push";
import { pushSubscriptions, pushVapidSettings } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

type BrowserSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

const DEFAULT_VAPID_SUBJECT = "mailto:technical@rafiq-bac.example";

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("لا يمكن تهيئة الإشعارات قبل تفعيل سر الخادم.");
  return createHash("sha256").update(`${ENV.cookieSecret}:push-notifications-v1`).digest();
}

function encryptValue(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { ciphertext: Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64"), iv: iv.toString("base64") };
}

function decryptValue<T>(ciphertext: string, ivValue: string): T {
  const payload = Buffer.from(ciphertext, "base64");
  const iv = Buffer.from(ivValue, "base64");
  const authTag = payload.subarray(payload.length - 16);
  const encrypted = payload.subarray(0, payload.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  const value = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  return JSON.parse(value) as T;
}

function endpointHash(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

function validateSubscription(value: BrowserSubscription) {
  const endpoint = value.endpoint?.trim();
  if (!endpoint || endpoint.length > 2000) throw new Error("بيانات اشتراك الإشعارات غير مكتملة.");
  try { new URL(endpoint); } catch { throw new Error("عنوان اشتراك الإشعارات غير صالح."); }
  if (!value.keys?.p256dh || !value.keys?.auth || value.keys.p256dh.length > 512 || value.keys.auth.length > 256) {
    throw new Error("مفاتيح اشتراك الإشعارات غير صالحة.");
  }
  return { endpoint, expirationTime: value.expirationTime ?? null, keys: { p256dh: value.keys.p256dh, auth: value.keys.auth } } satisfies BrowserSubscription;
}

async function getOrCreateVapidSettings(createdByUserId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات الإشعارات.");
  const existing = await db.select().from(pushVapidSettings).limit(1);
  if (existing[0]) return existing[0];

  const keys = webpush.generateVAPIDKeys();
  const secured = encryptValue(keys.privateKey);
  try {
    await db.insert(pushVapidSettings).values({
      publicKey: keys.publicKey,
      privateKeyCiphertext: secured.ciphertext,
      privateKeyIv: secured.iv,
      subject: DEFAULT_VAPID_SUBJECT,
      createdByUserId,
    });
  } catch {
    // The first two authenticated requests may race; fetch the singleton below.
  }
  const saved = await db.select().from(pushVapidSettings).limit(1);
  if (!saved[0]) throw new Error("تعذر إنشاء مفاتيح الإشعارات.");
  return saved[0];
}

export async function getPushPublicConfiguration(userId: number) {
  const settings = await getOrCreateVapidSettings(userId);
  return { publicKey: settings.publicKey, subject: settings.subject, contactNeedsUpdate: settings.subject === DEFAULT_VAPID_SUBJECT };
}

/** Creates the singleton key pair during server startup; failures do not stop the learning platform. */
export async function ensurePushVapidKeys() {
  await getOrCreateVapidSettings(null);
}

export async function getPushSubscriptionStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات الإشعارات.");
  const subscriptions = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).limit(25);
  return { subscribed: subscriptions.length > 0, deviceCount: subscriptions.length };
}

export async function savePushSubscription(userId: number, input: BrowserSubscription) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات الإشعارات.");
  const subscription = validateSubscription(input);
  await getOrCreateVapidSettings(userId);
  const hash = endpointHash(subscription.endpoint);
  const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpointHash, hash)).limit(1);
  if (existing[0] && existing[0].userId !== userId) throw new Error("هذا الجهاز مرتبط بحساب آخر؛ ألغِ الاشتراك منه أولًا.");
  const secured = encryptValue(subscription);
  if (existing[0]) {
    await db.update(pushSubscriptions).set({ subscriptionCiphertext: secured.ciphertext, subscriptionIv: secured.iv, lastUsedAt: new Date() }).where(eq(pushSubscriptions.id, existing[0].id));
  } else {
    await db.insert(pushSubscriptions).values({ userId, endpointHash: hash, subscriptionCiphertext: secured.ciphertext, subscriptionIv: secured.iv, lastUsedAt: new Date() });
  }
  return { subscribed: true } as const;
}

export async function removePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات الإشعارات.");
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpointHash, endpointHash(endpoint))));
  return { subscribed: false } as const;
}

export async function sendPushAnnouncement(input: { actorUserId: number; title: string; body: string; url?: string }) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الاتصال بقاعدة بيانات الإشعارات.");
  const settings = await getOrCreateVapidSettings(input.actorUserId);
  const privateKey = decryptValue<string>(settings.privateKeyCiphertext, settings.privateKeyIv);
  webpush.setVapidDetails(settings.subject, settings.publicKey, privateKey);
  const subscriptions = await db.select().from(pushSubscriptions).limit(5000);
  const payload = JSON.stringify({ title: input.title, body: input.body, url: input.url ?? "/", tag: `announcement-${Date.now()}` });
  let sent = 0;
  let removed = 0;
  for (const item of subscriptions) {
    try {
      const subscription = decryptValue<BrowserSubscription>(item.subscriptionCiphertext, item.subscriptionIv);
      await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 12 });
      sent += 1;
      await db.update(pushSubscriptions).set({ lastUsedAt: new Date() }).where(eq(pushSubscriptions.id, item.id));
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, item.id));
        removed += 1;
      }
    }
  }
  return { sent, removed, attempted: subscriptions.length };
}
