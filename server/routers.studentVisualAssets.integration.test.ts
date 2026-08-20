import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { contentAssets, learningItemAssets, learningItems } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { appRouter } from "./routers";

function context(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const authenticatedStudent = { id: 42, openId: "student-real-visual-feed", email: "student@example.com", name: "طالب تحقق", loginMethod: "manus", role: "student" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

describe("curriculum.studentVisualAssets على السجل الفعلي", () => {
  it("يمر عبر الإجراء المحمي ولا يعيد الأصول الأربعة المرتبطة بعناصر Batch 1 قيد المراجعة", async () => {
    const db = await getDb();
    if (!db) return;
    const internalAssets = await db
      .select({ id: contentAssets.id })
      .from(contentAssets)
      .innerJoin(learningItemAssets, eq(learningItemAssets.assetId, contentAssets.id))
      .innerJoin(learningItems, eq(learningItems.id, learningItemAssets.learningItemId))
      .where(and(eq(learningItems.workflowState, "in_review"), eq(contentAssets.id, contentAssets.id)))
      .orderBy(contentAssets.id)
      .limit(20);

    expect(internalAssets.map(asset => asset.id)).toEqual([1, 2, 3, 4]);
    const caller = appRouter.createCaller(context(authenticatedStudent));
    const result = await caller.curriculum.studentVisualAssets();
    expect(result.map(asset => asset.id)).not.toEqual(expect.arrayContaining([1, 2, 3, 4]));
  });
});
