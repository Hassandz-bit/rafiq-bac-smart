import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { exerciseHints, exercises, lessons, subjects, units } from "../drizzle/schema";
import { getDb } from "./db";
import { errorTypesForSubject } from "./errorClassification";
import { canRevealSolution, nextHintIndex } from "./exerciseEngine";

const batchExerciseIds = [60001, 60002, 60003, 60004, 60005, 60006, 60007, 60008, 60009];

describe("إرشاد تمارين Batch 1 الفعلي", () => {
  it("يربط كل تمرين بثلاثة تلميحات مقيدة وكشف ورقي بعد التلميح الثالث وتصنيف خطأ للمادة", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable for Batch 1 exercise guidance verification");
    const rows = await db
      .select({ exerciseId: exercises.id, subjectCode: subjects.code, solution: exercises.solution, hintId: exerciseHints.id, ordinal: exerciseHints.ordinal, body: exerciseHints.body })
      .from(exercises)
      .innerJoin(lessons, eq(exercises.lessonId, lessons.id))
      .innerJoin(units, eq(lessons.unitId, units.id))
      .innerJoin(subjects, eq(units.subjectId, subjects.id))
      .innerJoin(exerciseHints, eq(exerciseHints.exerciseId, exercises.id))
      .where(inArray(exercises.id, batchExerciseIds))
      .limit(30);

    expect(rows).toHaveLength(27);
    for (const exerciseId of batchExerciseIds) {
      const guidance = rows.filter(row => row.exerciseId === exerciseId);
      expect(guidance.map(row => row.ordinal).sort()).toEqual([1, 2, 3]);
      expect(guidance.every(row => {
        const body = row.body as { publicationBlocked?: boolean; sourceReviewRequired?: boolean; draftStatus?: string; textAr?: string };
        const solution = row.solution as { revealAfterHintCount?: number; revealMode?: string; publicationBlocked?: boolean; sourceReviewRequired?: boolean };
        return body.publicationBlocked && body.sourceReviewRequired && body.draftStatus === "original_unit_specific_hint" && Boolean(body.textAr) && solution.revealAfterHintCount === 3 && solution.revealMode === "paper_and_pen" && solution.publicationBlocked && solution.sourceReviewRequired;
      })).toBe(true);
      expect(nextHintIndex(0, 3)).toBe(0);
      expect(nextHintIndex(3, 3)).toBeNull();
      expect(canRevealSolution(2, 3)).toBe(false);
      expect(canRevealSolution(3, 3)).toBe(true);
      const subject = guidance[0]?.subjectCode as "math" | "physics" | "natural_sciences";
      expect(errorTypesForSubject(subject).length).toBeGreaterThan(0);
    }
  });
});
