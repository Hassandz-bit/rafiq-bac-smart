import { and, desc, eq, isNull, lte } from "drizzle-orm";
import { errorNotebookEntries, masteryRecords, reviewQueueItems, studentAttempts } from "../drizzle/schema";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

type SmartAssessment = { strengths: string[]; attentionPoint: string; feedback: string; nextReview: string; confidence: "low" | "medium" | "high" };

function fallback(input: { attempts: number; correct: number; hints: number; reveals: number; errors: string[]; dueReviews: number; masteryStates: string[] }): SmartAssessment {
  const accuracy = input.attempts ? Math.round((input.correct / input.attempts) * 100) : 0;
  return { strengths: accuracy >= 70 ? ["ثبات جيد في المحاولات الأخيرة"] : ["بدأت ببناء سجل تعلم يمكن تحسينه"], attentionPoint: input.errors[0] ?? (input.dueReviews ? "مراجعات مستحقة تحتاج إتمامًا" : input.masteryStates.includes("understand") ? "مفهوم يحتاج انتقالًا من الفهم إلى التدريب" : input.hints >= 2 ? "الاعتماد على التلميحات" : "تثبيت طريقة الحل"), feedback: `دقة محاولاتك الحالية ${accuracy}% بناءً على ${input.attempts} محاولة مسجلة. ركّز على فهم سبب الخطأ قبل تكرار السؤال.`, nextReview: input.dueReviews ? "ابدأ بأقدم عنصر في طابور المراجعة المستحق." : input.reveals >= 2 ? "راجع سؤالًا كُشفت له خطوات الحل، ثم أعده دون كشف." : "أعد محاولة واحدة من قائمة المراجعة دون تلميحات.", confidence: input.attempts >= 5 ? "medium" : "low" };
}

export async function generateSmartAssessment(userId: number): Promise<SmartAssessment> {
  const db = await getDb();
  if (!db) return fallback({ attempts: 0, correct: 0, hints: 0, reveals: 0, errors: [], dueReviews: 0, masteryStates: [] });
  const [attempts, errors, reviews, mastery] = await Promise.all([
    db.select({ isCorrect: studentAttempts.isCorrect, hintsUsed: studentAttempts.hintsUsed, revealedSteps: studentAttempts.revealedSteps, errorType: studentAttempts.errorType }).from(studentAttempts).where(eq(studentAttempts.userId, userId)).orderBy(desc(studentAttempts.submittedAt)).limit(20),
    db.select({ errorType: errorNotebookEntries.errorType, occurrences: errorNotebookEntries.occurrences }).from(errorNotebookEntries).where(eq(errorNotebookEntries.userId, userId)).orderBy(desc(errorNotebookEntries.occurrences)).limit(3),
    db.select({ id: reviewQueueItems.id }).from(reviewQueueItems).where(and(eq(reviewQueueItems.userId, userId), isNull(reviewQueueItems.completedAt), lte(reviewQueueItems.dueAt, new Date()))).limit(20),
    db.select({ status: masteryRecords.status }).from(masteryRecords).where(eq(masteryRecords.userId, userId)).limit(20),
  ]);
  const signals = { attempts: attempts.length, correct: attempts.filter(item => item.isCorrect).length, hints: attempts.reduce((sum, item) => sum + item.hintsUsed, 0), reveals: attempts.reduce((sum, item) => sum + item.revealedSteps, 0), errors: errors.map(item => item.errorType), dueReviews: reviews.length, masteryStates: mastery.map(item => item.status) };
  const safeFallback = fallback(signals);
  try {
    const response = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: "أنت محلل تعلم عربي. حلل بيانات الأداء فقط. لا تخترع حقائق علمية ولا تشخّص الطالب. أعط ملاحظات عملية مشجعة وقصيرة." }, { role: "user", content: JSON.stringify({ signals, fallback: safeFallback }) }], response_format: { type: "json_schema", json_schema: { name: "smart_assessment", strict: true, schema: { type: "object", properties: { strengths: { type: "array", items: { type: "string" } }, attentionPoint: { type: "string" }, feedback: { type: "string" }, nextReview: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] } }, required: ["strengths", "attentionPoint", "feedback", "nextReview", "confidence"], additionalProperties: false } } } });
    const content = response.choices[0]?.message?.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(safeFallback)) as SmartAssessment;
  } catch { return safeFallback; }
}
