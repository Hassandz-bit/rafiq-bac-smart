import { RoleGate } from "@/components/RoleGate";
import { ExerciseKind, ExerciseResponsePanel, HintStepper, PaperPenReveal } from "@/components/ExerciseRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { uxCopy } from "@/content/uxCopy";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, ArrowRight, BookMarked, ClipboardList, Gauge, TimerReset } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const exerciseTypes: Array<{ label: string; type: ExerciseKind }> = [
  { label: "اختيار متعدد", type: "mcq" }, { label: "اختيارات متعددة", type: "multi_select" }, { label: "صح أو خطأ", type: "true_false" }, { label: "ملء", type: "fill" }, { label: "مطابقة", type: "matching" }, { label: "ترتيب", type: "ordering" }, { label: "قيمة رقمية", type: "numeric" }, { label: "تعبير رياضي", type: "math_expression" }, { label: "صورة تفاعلية", type: "interactive_image" },
];

export default function AssessmentLab() {
  return <RoleGate allowed={["student", "admin"]} title="محرك التمارين محمي"><AssessmentContent /></RoleGate>;
}

function AssessmentContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isStudentPreview = user?.role === "student";
  const [activeType, setActiveType] = useState<ExerciseKind>("mcq");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [responseReady, setResponseReady] = useState(false);
  const [response, setResponse] = useState<string | string[]>("");
  const exercises = trpc.attempts.accessibleExercises.useQuery(undefined, { enabled: isStudentPreview });
  const submitAttempt = trpc.attempts.submit.useMutation({ onSuccess: (result: { isCorrect: boolean; reviewQueued: boolean }) => toast.success(result.isCorrect ? uxCopy.learning.correct : "قريب جدًا. سجّلنا هذه المحاولة لتعود إليها في الوقت المناسب."), onError: error => toast.error(error.message || uxCopy.system.unexpectedError) });
  const currentExercise = exercises.data?.[0];
  const supportedLiveTypes: ExerciseKind[] = ["mcq", "multi_select", "true_false", "fill", "matching", "ordering", "numeric", "math_expression", "interactive_image"];
  const liveType: ExerciseKind = currentExercise?.type === "short_answer" ? "fill" : supportedLiveTypes.includes(currentExercise?.type as ExerciseKind) ? currentExercise!.type as ExerciseKind : "fill";
  const promptText = typeof currentExercise?.prompt === "object" && currentExercise?.prompt && "textAr" in currentExercise.prompt ? String((currentExercise.prompt as { textAr: unknown }).textAr) : "تمرين معتمد قيد التحميل.";
  const guidanceHints = currentExercise?.hints?.length ? currentExercise.hints : ["ابدأ بتمييز المعطيات عن المطلوب.", "حدد الأداة أو العلاقة التي تناسب المطلوب.", "اكتب الخطوة الأولى بوضوح قبل إكمال الحل."];
  const revealSteps = currentExercise?.revealSteps?.length ? currentExercise.revealSteps : ["اقرأ المطلوب دون القفز إلى النتيجة.", "حدد ما تعرفه وما يلزم إثباته أو حسابه.", "اختر طريقة الحل ثم راجع الوحدة والاستنتاج."];
  const submitLiveAttempt = () => { if (!isStudentPreview || !currentExercise || !responseReady) return; submitAttempt.mutate({ exerciseId: currentExercise.id, answerPayload: response, hintsUsed, revealedSteps, durationSeconds: 0 }); };
  return <div className="assessment-workspace min-h-screen p-5 sm:p-8" dir="rtl"><main className="mx-auto max-w-6xl">
    <button aria-label="العودة إلى رحلة التعلّم" onClick={() => setLocation("/app")} className="learning-back flex items-center gap-2 text-sm font-bold"><ArrowRight className="h-4 w-4" />العودة إلى رحلتك</button>
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="student-eyebrow">تدريب وفهم</p><h1 className="learning-title mt-2">{uxCopy.learning.errorTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-7 student-muted">نربط محاولتك بنوع الخطأ والتلميحات والمراجعة التي تساعدك لاحقًا.</p></div><Badge className="learning-source-badge px-3 py-2">ينتظر محتوى معتمدًا</Badge></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]"><section className="soft-panel p-6"><div className="flex items-center justify-between"><div><p className="font-black">بنك أنواع التمارين</p><p className="mt-1 text-xs text-slate-500">سجل موحد لتصميم السؤال وإجابته وتحليله.</p></div><ClipboardList className="h-5 w-5 text-blue-700" /></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">{exerciseTypes.map(item => <button key={item.type} onClick={() => { setActiveType(item.type); setResponseReady(false); }} className={`rounded-xl border px-3 py-3 text-center text-xs font-bold transition ${activeType === item.type ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-100 bg-slate-50 text-slate-600"}`}>{item.label}</button>)}</div><div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><p className="text-sm font-black text-slate-900">معاينة مُدخل الإجابة</p><p className="mt-1 text-xs text-slate-500">يُرسل النوع والجواب إلى خدمة التصحيح فقط عندما يكون التمرين منشورًا ومصدره حاليًا ومعتمدًا.</p><ExerciseResponsePanel type={activeType} onResponse={() => setResponseReady(true)} /><p className={`mt-3 text-xs font-bold ${responseReady ? "text-emerald-700" : "text-slate-400"}`}>{responseReady ? "تم التقاط الإجابة؛ سيبدأ التصحيح عند توفر تمرين معتمد." : "اختر أو اكتب إجابة للمعاينة."}</p></div></section><div><HintStepper hints={guidanceHints} onHintUsed={setHintsUsed} />{!currentExercise && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800">هذه تلميحات معاينة فقط؛ تظهر تلميحات التمرين الفعلية بعد اجتياز بوابة المصدر والنشر.</p>}</div></div>
    <section className="mt-6"><PaperPenReveal steps={revealSteps} onStepRevealed={setRevealedSteps} /><p className="mt-3 text-xs font-bold text-slate-500">تلميحات مستخدمة: {hintsUsed} · خطوات مكشوفة: {revealedSteps}. تحفظ هذه القياسات مع المحاولة عند وجود تمرين معتمد.</p></section>
    <section className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-slate-900">تمرين من مرجع العمل المعتمد</p><p className="mt-1 text-xs text-slate-600">{currentExercise ? "يظهر مع وسم مصدره بوضوح؛ لا يمثل ادعاءً بطبعة رسمية حالية." : "لا توجد تمارين متاحة لحسابك ضمن الاستحقاقات الحالية."}</p></div>{currentExercise && <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">مرجع عمل معتمد</Badge>}</div>{currentExercise && <><p className="mt-5 text-sm leading-7 text-slate-700">{promptText}</p><ExerciseResponsePanel type={liveType} definition={currentExercise.answerDefinition && typeof currentExercise.answerDefinition === "object" ? currentExercise.answerDefinition as Record<string, unknown> : undefined} onResponse={value => { setResponse(value); setResponseReady(true); }} /><Button onClick={submitLiveAttempt} disabled={!responseReady} isLoading={submitAttempt.isPending} loadingText="جارٍ التصحيح…" className="mt-4 h-10 rounded-xl bg-emerald-700 font-bold hover:bg-emerald-800">أرسل الإجابة</Button></>}</section>
    <section className="mt-6 grid gap-5 md:grid-cols-3"><Mini icon={AlertCircle} title="اكتشف سبب الخطأ" text="نحدد الفكرة أو الطريقة أو الوحدة التي صنعت الفرق." /><Mini icon={BookMarked} title="دفتر ما يجب ألا يتكرر" text="نحتفظ بالخطأ وتفسيره لنعود إليه بوضوح." /><Mini icon={TimerReset} title="راجع في الوقت المناسب" text="تظهر لك الفكرة التي تحتاج تثبيتًا عندما يحين وقتها." /></section>
    <section className="mt-6 rounded-[1.5rem] border border-blue-100 bg-white p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">حالات الإتقان</p><div className="mt-4 flex flex-wrap gap-2">{["نبدأ", "نفهم", "نتدرب", "قريب من الإتقان", "متقن"].map((state, index) => <span key={state} className={`rounded-xl px-3 py-2 text-xs font-black ${index === 0 ? "bg-slate-100 text-slate-700" : index === 4 ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{state}</span>)}</div></div><div className="text-sm leading-6 text-slate-500"><Gauge className="mb-2 h-5 w-5 text-blue-700" />لا يحسب الإتقان بمجرد مشاهدة الشرائح؛ بل من الدقة والصعوبة والمحاولات والتلميحات والمراجعة.</div></div></section>
  </main></div>;
}

function Mini({ icon: Icon, title, text }: { icon: typeof AlertCircle; title: string; text: string }) {
  return <div className="soft-panel p-5"><Icon className="h-5 w-5 text-rose-600" /><p className="mt-4 font-black">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>;
}
