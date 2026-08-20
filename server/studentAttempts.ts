import { and, eq } from "drizzle-orm";
import {
  errorNotebookEntries,
  exercises,
  lessons,
  reviewQueueItems,
  sources,
  studentAttempts,
  subjectSourceGates,
  subjects,
  units,
} from "../drizzle/schema";
import { errorTypesForSubject } from "./errorClassification";
import { ExerciseAnswer, ExerciseDefinition, gradeExercise } from "./exerciseEngine";
import { getDb } from "./db";

type StudentSafeExercise = {
  workflowState: string;
  sourceStatus: string;
  isInternalPilot: boolean;
  sourceGate: string;
};

export function isStudentSafeExercise(exercise: StudentSafeExercise) {
  return (
    exercise.workflowState === "published" &&
    exercise.sourceStatus === "current_official" &&
    !exercise.isInternalPilot &&
    exercise.sourceGate === "verified"
  );
}

type AttemptInput = {
  userId: number;
  exerciseId: number;
  answerPayload: ExerciseAnswer;
  hintsUsed: number;
  durationSeconds: number;
  errorType?: string;
};

export async function recordStudentAttempt(input: AttemptInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db
    .select({
      id: exercises.id,
      type: exercises.type,
      answerDefinition: exercises.answerDefinition,
      workflowState: exercises.workflowState,
      sourceStatus: sources.verificationStatus,
      isInternalPilot: sources.isInternalPilot,
      sourceGate: subjectSourceGates.status,
      subjectCode: subjects.code,
    })
    .from(exercises)
    .innerJoin(lessons, eq(exercises.lessonId, lessons.id))
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(subjects, eq(units.subjectId, subjects.id))
    .innerJoin(sources, eq(exercises.sourceId, sources.id))
    .innerJoin(subjectSourceGates, eq(subjectSourceGates.subjectId, subjects.id))
    .where(eq(exercises.id, input.exerciseId))
    .limit(1);

  const exercise = rows[0];
  if (!exercise || !isStudentSafeExercise(exercise)) return null;

  const definition = exercise.answerDefinition as { answer?: ExerciseAnswer; expected?: ExerciseAnswer; tolerance?: number };
  const expectedAnswer = definition.answer ?? definition.expected;
  if (expectedAnswer === undefined) throw new Error("Exercise answer definition is incomplete");

  const isCorrect = gradeExercise(
    {
      type: exercise.type as ExerciseDefinition["type"],
      answer: expectedAnswer,
      tolerance: definition.tolerance,
    },
    input.answerPayload,
  );

  await db.insert(studentAttempts).values({
    userId: input.userId,
    exerciseId: exercise.id,
    answerPayload: input.answerPayload,
    isCorrect,
    hintsUsed: Math.max(0, input.hintsUsed),
    durationSeconds: Math.max(0, input.durationSeconds),
    errorType: isCorrect ? null : input.errorType ?? errorTypesForSubject(exercise.subjectCode as "math" | "physics" | "natural_sciences")[0],
  });

  const shouldReview = !isCorrect || input.hintsUsed >= 2;
  if (!isCorrect) {
    const errorType = input.errorType ?? errorTypesForSubject(exercise.subjectCode as "math" | "physics" | "natural_sciences")[0];
    const existing = await db
      .select()
      .from(errorNotebookEntries)
      .where(and(eq(errorNotebookEntries.userId, input.userId), eq(errorNotebookEntries.exerciseId, exercise.id), eq(errorNotebookEntries.errorType, errorType)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(errorNotebookEntries)
        .set({ occurrences: existing[0].occurrences + 1, lastOccurredAt: new Date() })
        .where(eq(errorNotebookEntries.id, existing[0].id));
    } else {
      await db.insert(errorNotebookEntries).values({
        userId: input.userId,
        exerciseId: exercise.id,
        errorType,
        explanationAr: "سجل داخلي: مراجعة سبب الخطأ مع المدرس أو بعد ظهور تفسير معتمد.",
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
  }

  if (shouldReview) {
    await db.insert(reviewQueueItems).values({
      userId: input.userId,
      exerciseId: exercise.id,
      reason: !isCorrect ? "failed_question" : "heavy_hint_usage",
      dueAt: new Date(Date.now() + (isCorrect ? 48 : 24) * 60 * 60 * 1000),
    });
  }

  return { isCorrect, reviewQueued: shouldReview };
}
