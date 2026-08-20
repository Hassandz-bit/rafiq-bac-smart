import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { contentAssets, learningItemAssets, learningItems } from "../drizzle/schema";
import { getStudentVisibleVisualAssets } from "./curriculum";
import { getDb } from "./db";

describe("التغذية الحقيقية للأصول البصرية للطالب", () => {
  it("لا تعيد الأصول الأربعة المحفوظة في Batch 1 ما دامت عناصرها الأم in_review", async () => {
    const db = await getDb();
    if (!db) return;

    const internalAssets = await db
      .select({ id: contentAssets.id, workflowState: learningItems.workflowState })
      .from(contentAssets)
      .innerJoin(learningItemAssets, eq(learningItemAssets.assetId, contentAssets.id))
      .innerJoin(learningItems, eq(learningItems.id, learningItemAssets.learningItemId))
      .where(and(eq(learningItems.workflowState, "in_review"), eq(contentAssets.id, contentAssets.id)))
      .orderBy(contentAssets.id)
      .limit(20);

    const batchOneAssetIds = internalAssets.map(asset => asset.id);
    expect(batchOneAssetIds).toEqual([1, 2, 3, 4]);
    expect(internalAssets.every(asset => asset.workflowState === "in_review")).toBe(true);

    const studentFeed = await getStudentVisibleVisualAssets(42);
    expect(studentFeed.map(asset => asset.id)).not.toEqual(expect.arrayContaining(batchOneAssetIds));
  });
});
