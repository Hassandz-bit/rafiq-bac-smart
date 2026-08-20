export type HassemSignal = { unitId: number; unitTitleAr: string; mastery: number; diagnostic: number; repeatedErrors: number; prerequisiteImpact: number; bacRelevance: number };

export function scoreHassemPriority(signal: HassemSignal, availableDays: number) {
  const timePressure = availableDays <= 10 ? 12 : availableDays <= 20 ? 7 : 3;
  const score = (100 - signal.mastery) * 0.35 + (100 - signal.diagnostic) * 0.2 + signal.repeatedErrors * 8 + signal.prerequisiteImpact * 6 + signal.bacRelevance * 5 + timePressure;
  return { ...signal, priorityScore: Math.round(score), state: score >= 60 ? "priority" : score >= 35 ? "reinforce" : "mastered" } as const;
}

export function buildHassemPlan(signals: HassemSignal[], availableDays: number) {
  return signals.map(signal => scoreHassemPriority(signal, availableDays)).sort((a, b) => b.priorityScore - a.priorityScore);
}
