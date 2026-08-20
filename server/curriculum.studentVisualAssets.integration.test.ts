import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { contentAssets, learningItemAssets, learningItems, sources } from "../drizzle/schema";
import { getStudentVisibleVisualAssets } from "./curriculum";
import { getDb } from "./db";

describe("التغذية الحقيقية للأصول البصرية للطالب", () => {
  it("لا تعيد الأصول الأربعة المحفوظة في Batch 1 ما دامت عناصرها الأم in_review", async () => {
    const db = await getDb();
    if (!db) return;

    const internalAssets = await db
      .select({ id: contentAssets.id, fileKey: contentAssets.fileKey, annotationData: contentAssets.annotationData, workflowState: learningItems.workflowState, sourceAuthority: sources.sourceAuthority, verificationStatus: sources.verificationStatus })
      .from(contentAssets)
      .innerJoin(learningItemAssets, eq(learningItemAssets.assetId, contentAssets.id))
      .innerJoin(learningItems, eq(learningItems.id, learningItemAssets.learningItemId))
      .innerJoin(sources, eq(sources.id, learningItems.sourceId))
      .where(and(eq(learningItems.workflowState, "in_review"), eq(contentAssets.id, contentAssets.id)))
      .orderBy(contentAssets.id)
      .limit(20);

    const batchOneAssetIds = internalAssets.map(asset => asset.id);
    expect(batchOneAssetIds).toEqual([1, 2, 3, 4]);
    expect(internalAssets.every(asset => asset.workflowState === "in_review")).toBe(true);
    expect(internalAssets.every(asset => asset.fileKey.startsWith("batch1_"))).toBe(true);
    expect(internalAssets.every(asset => asset.sourceAuthority.includes("نسخة عمل مرجعية قدمها المستخدم") && asset.verificationStatus === "historical_official")).toBe(true);
    expect(internalAssets.every(asset => {
      const metadata = asset.annotationData as { original?: boolean; reviewStatus?: string; version?: string } | null;
      return metadata?.original === true && metadata.reviewStatus === "in_review" && Boolean(metadata.version);
    })).toBe(true);

    const studentFeed = await getStudentVisibleVisualAssets(42);
    expect(studentFeed.map(asset => asset.id)).not.toEqual(expect.arrayContaining(batchOneAssetIds));
  });
});
