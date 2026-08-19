export function bacFocusPolicy() {
  return { hintsAllowed: false, solutionsAllowed: false, autosave: true, analysisAfterSubmit: true } as const;
}

export function rescuePlanLevel(input: { remainingDays: number; masteryAverage: number; incompleteLessons: number }) {
  if (input.remainingDays <= 30 && (input.masteryAverage < 45 || input.incompleteLessons >= 8)) return "rescue" as const;
  if (input.masteryAverage < 70 || input.incompleteLessons > 0) return "consolidate" as const;
  return "refine" as const;
}
