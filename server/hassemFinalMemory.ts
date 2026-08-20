import { and, eq } from "drizzle-orm";
import { hassemFinalMemoryItems } from "../drizzle/schema";
import { getDb } from "./db";

const finalMemoryDefaults = [
  { memoryKey: "personal_cards", titleAr: "بطاقاتك الشخصية", promptAr: "استرجع ثلاث أفكار كتبتها أنت من مراجعتك؛ لا تضف درسًا جديدًا." },
  { memoryKey: "error_signal", titleAr: "إشارة الخطأ", promptAr: "اختر خطأين متكررين من دفترك واكتب كلمة تنبيه مختصرة لكل واحد." },
  { memoryKey: "time_check", titleAr: "إدارة الوقت", promptAr: "جهّز ساعة وقلمًا وورقة مسودة، ثم ابدأ محاكاة قصيرة عند الجاهزية." },
] as const;

export async function getHassemFinalMemory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  let items = await db.select().from(hassemFinalMemoryItems).where(eq(hassemFinalMemoryItems.userId, userId)).orderBy(hassemFinalMemoryItems.id).limit(10);
  if (!items.length) {
    await db.insert(hassemFinalMemoryItems).values(finalMemoryDefaults.map(item => ({ userId, ...item })));
    items = await db.select().from(hassemFinalMemoryItems).where(eq(hassemFinalMemoryItems.userId, userId)).orderBy(hassemFinalMemoryItems.id).limit(10);
  }
  return items;
}

export async function toggleHassemFinalMemory(input: { userId: number; itemId: number }) {
  const db = await getDb();
  if (!db) return null;
  const item = await db.select().from(hassemFinalMemoryItems).where(and(eq(hassemFinalMemoryItems.id, input.itemId), eq(hassemFinalMemoryItems.userId, input.userId))).limit(1);
  if (!item[0]) return null;
  const completedAt = item[0].completedAt ? null : new Date();
  await db.update(hassemFinalMemoryItems).set({ completedAt }).where(eq(hassemFinalMemoryItems.id, item[0].id));
  return { id: item[0].id, completed: Boolean(completedAt) } as const;
}
