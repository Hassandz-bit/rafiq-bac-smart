import { sources } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";

export type SourceVerificationStatus = "unverified" | "current_official" | "official_but_version_unconfirmed" | "historical_official";

export async function updateSourceVerification(input: { sourceId: number; reviewerUserId: number; verificationStatus: SourceVerificationStatus; verificationNotes: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const source = await db.select({ id: sources.id, isInternalPilot: sources.isInternalPilot }).from(sources).where(eq(sources.id, input.sourceId)).limit(1);
  if (!source[0]) return null;
  if (source[0].isInternalPilot && input.verificationStatus === "current_official") {
    throw new Error("لا يمكن ترقية مصدر Pilot الداخلي إلى مرجع رسمي حالي من هذا المسار.");
  }
  await db.update(sources).set({ verificationStatus: input.verificationStatus, verificationNotes: input.verificationNotes.trim().slice(0, 4000), verificationDate: new Date() }).where(eq(sources.id, input.sourceId));
  return { sourceId: input.sourceId, verificationStatus: input.verificationStatus, publicationBlocked: source[0].isInternalPilot || input.verificationStatus !== "current_official", reviewedByUserId: input.reviewerUserId } as const;
}
