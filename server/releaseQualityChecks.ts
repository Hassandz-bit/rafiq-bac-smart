import { desc } from "drizzle-orm";
import { releaseQualityChecks } from "../drizzle/schema";
import { getDb } from "./db";

export const releaseQualityCheckKeys = ["academic_batch_qa", "real_account_qa", "operational_qa", "published_bac_session"] as const;
export type ReleaseQualityCheckKey = typeof releaseQualityCheckKeys[number];

export async function getReleaseQualityCheckSummary() {
  const db = await getDb();
  if (!db) return releaseQualityCheckKeys.map(checkKey => ({ checkKey, latestEvidence: null as null, recordedAt: null as Date | null, actorUserId: null as number | null }));
  const rows = await db.select({ checkKey: releaseQualityChecks.checkKey, evidenceNoteAr: releaseQualityChecks.evidenceNoteAr, recordedAt: releaseQualityChecks.recordedAt, actorUserId: releaseQualityChecks.actorUserId }).from(releaseQualityChecks).orderBy(desc(releaseQualityChecks.recordedAt)).limit(100);
  return releaseQualityCheckKeys.map(checkKey => {
    const latest = rows.find(row => row.checkKey === checkKey);
    return { checkKey, latestEvidence: latest?.evidenceNoteAr ?? null, recordedAt: latest?.recordedAt ?? null, actorUserId: latest?.actorUserId ?? null };
  });
}

/** Records an attestation note only; it never touches sources, learning items, workflow state, or publication. */
export async function recordReleaseQualityEvidence(input: { checkKey: ReleaseQualityCheckKey; evidenceNoteAr: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(releaseQualityChecks).values({ checkKey: input.checkKey, evidenceNoteAr: input.evidenceNoteAr, actorUserId: input.actorUserId });
  return { ...input, publicationChanged: false as const, contentApprovalChanged: false as const };
}
