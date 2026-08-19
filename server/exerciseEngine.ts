export type ExerciseAnswer = string | number | boolean | string[];
export type ExerciseDefinition = { type: "mcq" | "multi_select" | "true_false" | "fill" | "matching" | "ordering" | "numeric" | "math_expression"; answer: ExerciseAnswer; tolerance?: number };

export function gradeExercise(definition: ExerciseDefinition, response: ExerciseAnswer) {
  if (definition.type === "numeric") {
    return Math.abs(Number(definition.answer) - Number(response)) <= (definition.tolerance ?? 0.0001);
  }
  if (Array.isArray(definition.answer) && Array.isArray(response)) {
    return [...definition.answer].sort().join("|") === [...response].sort().join("|");
  }
  return String(definition.answer).trim().toLowerCase() === String(response).trim().toLowerCase();
}

export function nextHintIndex(hintsUsed: number, totalHints: number) {
  return hintsUsed < totalHints ? hintsUsed : null;
}

export function canRevealSolution(hintsUsed: number, totalHints: number) {
  return hintsUsed >= totalHints;
}
