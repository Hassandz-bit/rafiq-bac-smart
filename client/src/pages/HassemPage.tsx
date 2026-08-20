import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHassemDiagnosticHref, getHassemNextAction, isHassemDiagnosticLocked } from "@/lib/hassemSequence";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, LockKeyhole, MoonStar, Play, Target, TimerReset } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

const priorities = [
  { unit: "النهايات والاستمرارية", subject: "رياضيات", state: "أولوية", color: "bg-rose-50 text-rose-700 border-rose-100", reason: "الأخطاء الشرطية وحل التمارين تحتاج تثبيتًا." },
  { unit: "تطور كميات المتفاعلات والنواتج", subject: "فيزياء", state: "يحتاج تثبيت", color: "bg-amber-50 text-amber-700 border-amber-100", reason: "راجع العلاقة بين القياس والاستنتاج والوحدة." },
  { unit: "تركيب البروتين", subject: "علوم", state: "متقن", color: "bg-emerald-50 text-emerald-700 border-emerald-100", reason: "يكفي استرجاع سريع ثم سؤال BAC-style." },
];

export default function HassemPage() {
  const [days, setDays] = useState(20);
  const [reviewStarted, setReviewStarted] = useState(false);
  const [, setLocation] = useLocation();
  const { data: progress, isLoading } = trpc.progress.summary.useQuery();
  const dueReviews = progress?.reviews ?? [];
  const nextAction = getHassemNextAction(dueReviews.length);
  const reviewFirst = nextAction === "due_reviews";
  const diagnosticLocked = isHassemDiagnosticLocked(dueReviews.length);
  const diagnosticHref = getHassemDiagnosticHref(dueReviews.length);
  const reviewSummary = useMemo(() => dueReviews.slice(0, 2).map(item => item.reason).join(" · "), [dueReviews]);

  return <main className="min-h-screen bg-[#f7f9ff] px-5 py-8 text-slate-900" dir="rtl"><div className="mx-auto max-w-6xl">
    <section className="rounded-[2rem] bg-gradient-to-bl from-blue-950 via-blue-900 to-indigo-800 p-7 text-white shadow-2xl sm:p-10">
      <Badge className="border border-white/15 bg-white/10 text-white hover:bg-white/10">باقة الحسم · مراجعة نهائية للبكالوريا</Badge>
      <h1 className="mt-5 text-3xl font-black sm:text-5xl">باقي القليل… الآن نراجع بذكاء.</h1>
      <p className="mt-4 max-w-2xl leading-8 text-blue-100">ما نعاودوش العام كامل… نرتب المهم ونثبت النقاط. تبدأ خطتك دائمًا بالمراجعات المستحقة، ثم ينتقل التشخيص القصير للباكالوريا إلى خطوتك التالية.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button onClick={() => setReviewStarted(true)} className="h-11 rounded-xl bg-white px-5 font-black text-blue-900 hover:bg-blue-50"><CheckCircle2 className="ml-2 h-4 w-4"/>ابدأ المراجعات المستحقة</Button>
        <Button variant="outline" disabled={diagnosticLocked} onClick={() => diagnosticHref && setLocation(diagnosticHref)} className="h-11 rounded-xl border-white/20 bg-white/5 px-5 font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"><Play className="ml-2 h-4 w-4"/>{diagnosticLocked ? "التشخيص بعد المراجعات" : "ابدأ تشخيص الحسم"}</Button>
        <Button variant="outline" className="h-11 rounded-xl border-white/20 bg-white/5 px-5 font-bold text-white hover:bg-white/10">BAC Sprint</Button>
      </div>
    </section>

    <section className="mt-6 rounded-[1.7rem] border border-blue-100 bg-blue-50/80 p-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black text-blue-800">تسلسل اليوم المعتمد</p><h2 className="mt-1 text-xl font-black">{isLoading ? "نحضّر مسارك…" : reviewFirst ? `ابدأ بـ ${dueReviews.length} مراجعات مستحقة` : "لا توجد مراجعات مستحقة — التشخيص جاهز"}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{reviewFirst ? `سبب الأولوية: ${reviewSummary || "تثبيت التعلم قبل القياس الجديد"}. بعد الإتمام يفتح تشخيص BAC القصير تلقائيًا.` : "يمكنك الآن إجراء التشخيص القصير لتحديث أولويات الحسم بصورة شفافة."}</p></div>{reviewFirst ? <Badge className="border border-blue-200 bg-white text-blue-800"><LockKeyhole className="ml-1 h-3.5 w-3.5"/>التشخيص مؤجل</Badge> : <Badge className="border border-emerald-200 bg-white text-emerald-700"><CheckCircle2 className="ml-1 h-3.5 w-3.5"/>التشخيص متاح</Badge>}</div>
      {reviewStarted && reviewFirst && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-800">تم تثبيت خطوة المراجعة كأولوية اليوم. أكمل عناصر الطابور، ثم عد إلى التشخيص القصير.</p>}
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[2rem] border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-blue-700">أولوياتك الشفافة</p><h2 className="mt-1 text-2xl font-black">وش تراجع أولًا؟</h2></div><Target className="h-8 w-8 text-blue-700"/></div><p className="mt-3 text-sm leading-6 text-slate-600">بعد طابور المراجعة، ترتّب النقاط من الإتقان، التشخيص، تكرار الخطأ، أثر المتطلبات السابقة، صلة BAC، والأيام المتاحة. لا توجد توصية صندوق أسود.</p><div className="mt-6 space-y-3">{priorities.map(item => <div key={item.unit} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{item.unit}</p><p className="mt-1 text-xs font-bold text-slate-500">{item.subject} · {item.reason}</p></div><Badge className={`border ${item.color}`}>{item.state}</Badge></div></div>)}</div></div><aside className="rounded-[2rem] border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><Clock3 className="h-6 w-6 text-blue-700"/><h2 className="text-xl font-black">خطة حسب وقتك</h2></div><p className="mt-3 text-sm text-slate-600">الأيام المتبقية: <b>{days}</b></p><div className="mt-4 flex flex-wrap gap-2">{[30,20,15,10].map(value => <Button key={value} size="sm" variant={days===value?"default":"outline"} onClick={() => setDays(value)} className="rounded-lg">{value} يومًا</Button>)}</div><div className="mt-6 space-y-3"><Session icon={TimerReset} title="راجعها في 10 دقائق" text="للنقاط شبه المتقنة."/><Session icon={Clock3} title="ثبتها في 20 دقيقة" text="خريطة، بطاقات، تمارين، أخطاء."/><Session icon={MoonStar} title="ليلة هادئة قبل الباك" text="بطاقات ذاكرة، أخطاء شخصية، وقائمة تحقق فقط."/></div></aside></section>
  </div></main>;
}

function Session({icon:Icon,title,text}:{icon:typeof Clock3;title:string;text:string}) { return <div className="flex gap-3 rounded-2xl bg-slate-50 p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700"><Icon className="h-4 w-4"/></div><div><p className="font-black text-sm">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div></div>; }
