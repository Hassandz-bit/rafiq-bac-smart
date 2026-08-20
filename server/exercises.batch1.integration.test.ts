import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { exercises } from "../drizzle/schema";
import { getDb } from "./db";
import { type ExerciseDefinition, gradeExercise } from "./exerciseEngine";

const requiredTypes = ["mcq", "multi_select", "true_false", "fill", "matching", "ordering", "numeric", "math_expression", "interactive_image"] as const;

describe("تعريفات تمارين Batch 1 الفعلية", () => {
  it("تحتوي الأنواع التسعة على إجابات قابلة للتصحيح وتبقى in_review", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable for Batch 1 exercise verification");
    const rows = await db
      .select({ id: exercises.id, type: exercises.type, sourceId: exercises.sourceId, workflowState: exercises.workflowState, answerDefinition: exercises.answerDefinition, solution: exercises.solution })
      .from(exercises)
      .where(and(eq(exercises.workflowState, "in_review"), inArray(exercises.type, [...requiredTypes])))
      .limit(20);

    expect(rows.map(row => row.type).sort()).toEqual([...requiredTypes].sort());
    expect(rows.every(row => row.sourceId === 30001 || row.sourceId === 30003 || row.sourceId === 30005)).toBe(true);
    expect(rows.every(row => (row.solution as { publicationBlocked?: boolean } | null)?.publicationBlocked === true)).toBe(true);
    expect(rows.every(row => {
      const definition = row.answerDefinition as { answer?: unknown; tolerance?: number };
      return definition.answer !== undefined && gradeExercise({ type: row.type as ExerciseDefinition["type"], answer: definition.answer as ExerciseDefinition["answer"], tolerance: definition.tolerance }, definition.answer as ExerciseDefinition["answer"]);
    })).toBe(true);
  });
});
