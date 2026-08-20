export function bacFocusPolicy() {
  return { hintsAllowed: false, solutionsAllowed: false, autosave: true, analysisAfterSubmit: true } as const;
}

export function rescuePlanLevel(input: { remainingDays: number; masteryAverage: number; incompleteLessons: number }) {
  if (input.remainingDays <= 30 && (input.masteryAverage < 45 || input.incompleteLessons >= 8)) return "rescue" as const;
  if (input.masteryAverage < 70 || input.incompleteLessons > 0) return "consolidate" as const;
  return "refine" as const;
}

export function analyzeBacResult(input: { score: number; elapsedSeconds: number; masteryAverage: number; incompleteLessons: number; remainingDays: number }) {
  const rescueLevel = rescuePlanLevel(input);
  const levelCopy = rescueLevel === "rescue"
    ? { labelAr: "خطة إنقاذ", summaryAr: "ركّز على تثبيت الأساسيات وإغلاق أكثر فجوة تؤثر في النتيجة.", actionsAr: ["أكمل مراجعة مستحقة واحدة الآن.", "نفّذ جلسة حسم قصيرة لمادة الأولوية.", "أعد محاكاة قصيرة بعد تثبيت الخطأ المتكرر."] }
    : rescueLevel === "consolidate"
      ? { labelAr: "خطة تثبيت", summaryAr: "الأساس موجود؛ ثبّت الأخطاء المتكررة ونظّم المراجعات قبل محاكاة جديدة.", actionsAr: ["راجع دفتر الأخطاء بحسب التكرار.", "نفّذ جلسة حسم مدتها 20 دقيقة.", "أنجز محاكاة قصيرة لمادة الأولوية."] }
      : { labelAr: "خطة تحسين", summaryAr: "المؤشرات مستقرة؛ حسّن السرعة والدقة دون تحميل الخطة بموضوعات جديدة.", actionsAr: ["راجع بطاقة ذاكرة نهائية واحدة.", "راقب الوقت في محاكاة قصيرة.", "راجع خطأ واحدًا عالي التكرار فقط إن وُجد."] };
  return {
    rescueLevel,
    ...levelCopy,
    score: Math.max(0, Math.min(100, input.score)),
    elapsedSeconds: Math.max(0, input.elapsedSeconds),
    signals: [
      `العلامة المسجلة: ${Math.max(0, Math.min(100, input.score))}/100.`,
      `متوسط الإتقان المسجل: ${Math.round(input.masteryAverage)}%.`,
      `العناصر غير المكتملة أو الأخطاء المتكررة: ${input.incompleteLessons}.`,
      `الأيام المتبقية في الخطة: ${input.remainingDays}.`,
    ],
  } as const;
}
