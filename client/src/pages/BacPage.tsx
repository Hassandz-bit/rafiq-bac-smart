import React, { useEffect, useState } from "react";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { uxCopy } from "@/content/uxCopy";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, Clock3, FileCheck2, LockKeyhole, ShieldCheck, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type BacAnalysis = {
  score: number;
  elapsedSeconds: number;
  rescueLevel: "rescue" | "consolidate" | "refine";
  labelAr: string;
  summaryAr: string;
  signals: readonly string[];
  actionsAr: readonly string[];
};

export default function BacPage() {
  return <RoleGate allowed={["student"]} title="وضع BAC محمي"><BacFocus /></RoleGate>;
}

function BacFocus() {
  const [, setLocation] = useLocation();
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [score, setScore] = useState(50);
  const [remainingDays, setRemainingDays] = useState(30);
  const [analysis, setAnalysis] = useState<BacAnalysis | null>(null);
  const curriculum = trpc.curriculum.overview.useQuery();
  const startSession = trpc.bac.start.useMutation({
    onSuccess: session => { setSessionId(session.id); setStarted(true); setSeconds(0); setAnalysis(null); toast.success("بدأت المحاكاة، وسيُحفظ تقدمك تلقائيًا."); },
    onError: () => toast.error("تعذر بدء المحاكاة. حاول مرة أخرى."),
  });
  const autosave = trpc.bac.autosave.useMutation();
  const submitSession = trpc.bac.submit.useMutation({
    onSuccess: result => { setStarted(false); setAnalysis(result); toast.success("انتهت المحاكاة. نقرأ الآن نتيجتك وتقدمك المسجل."); },
    onError: () => toast.error("تعذر إرسال المحاكاة. حاول مرة أخرى."),
  });

  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [started]);
  useEffect(() => {
    if (!started || !sessionId || seconds === 0 || seconds % 30 !== 0) return;
    autosave.mutate({ sessionId, elapsedSeconds: seconds });
  }, [autosave, seconds, sessionId, started]);

  const timer = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const begin = () => {
    if (started) { setStarted(false); return; }
    const subjectId = curriculum.data?.subjects[0]?.id;
    if (!subjectId) { toast.error("لا توجد مادة متاحة لبدء المحاكاة الآن."); return; }
    startSession.mutate({ subjectId });
  };
  const submit = () => {
    if (!sessionId) return;
    submitSession.mutate({ sessionId, elapsedSeconds: seconds, score, remainingDays });
  };

  return <div className="bac-shell min-h-screen" dir="rtl">
    <header className="bac-header flex h-18 items-center justify-between px-5 py-4 sm:px-8">
      <button aria-label="العودة إلى رحلة التعلّم" onClick={() => setLocation("/app")} className="bac-back flex items-center gap-2 text-sm font-bold"><ArrowRight className="h-4 w-4" />العودة إلى رحلتك</button>
      <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-300" /><span className="text-sm font-black">وضع المحاكاة</span></div>
      <Badge className="border-0 bg-white/10 text-blue-100 hover:bg-white/10">{sessionId ? "الحفظ التلقائي نشط" : "حفظ تلقائي مهيأ"}</Badge>
    </header>
    <main className="mx-auto grid max-w-6xl gap-7 px-5 py-10 lg:grid-cols-[1fr_.65fr] sm:px-8">
      <section className="bac-workspace rounded-[2rem] p-6 sm:p-9">
        <div className="flex items-start justify-between gap-4"><div><p className="section-kicker">وضع المحاكاة</p><h1 className="mt-2 text-3xl font-black text-blue-950">{uxCopy.bac.startTitle}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{uxCopy.bac.startDescription} تُحجب التلميحات والحل داخل الجلسة، ثم نقرأ نتيجتك بالاستناد إلى تقدمك المسجل.</p></div><Trophy className="h-8 w-8 shrink-0 text-amber-500" /></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3"><FocusFeature icon={Clock3} label="مؤقت مباشر" /><FocusFeature icon={LockKeyhole} label="دون تلميحات" /><FocusFeature icon={FileCheck2} label="قراءة بعد الإرسال" /></div>
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50/50 p-6"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" /><p className="text-sm leading-6 text-slate-600">لا تُعرض مواضيع أو تمارين غير معتمدة. يمكن تسجيل جلسة تركيز ونتيجتها، بينما يبقى محتوى المحاكاة المنشور مرتبطًا باعتماد المصدر الأكاديمي.</p></div></div>
        <div className="mt-8 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
          <label className="text-xs font-black text-slate-700">العلامة المسجلة في المحاكاة<input aria-label="العلامة المسجلة في المحاكاة" type="number" min="0" max="100" value={score} onChange={event => setScore(Math.max(0, Math.min(100, Number(event.target.value) || 0)))} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label>
          <label className="text-xs font-black text-slate-700">الأيام المتبقية<input aria-label="الأيام المتبقية" type="number" min="0" max="3650" value={remainingDays} onChange={event => setRemainingDays(Math.max(0, Math.min(3650, Number(event.target.value) || 0)))} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><Button onClick={begin} isLoading={startSession.isPending} loadingText="جارٍ بدء المحاكاة…" className="h-12 rounded-xl bg-blue-700 px-6 font-black hover:bg-blue-800">{started ? "أوقف الجلسة مؤقتًا" : uxCopy.bac.startCta}</Button><Button onClick={submit} disabled={!sessionId} isLoading={submitSession.isPending} loadingText="جارٍ قراءة النتيجة…" variant="outline" className="h-12 rounded-xl border-blue-200 px-6 font-black text-blue-800">اقرأ النتيجة</Button></div>
      </section>
      <aside className="bac-insights rounded-[2rem] p-6">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300 text-blue-950"><Timer className="h-5 w-5" /></div><div><p className="text-sm font-black">وقتك الآن</p><p className="text-xs text-blue-200">يُحفظ تقدمك كل 30 ثانية</p></div></div>
        <p className="mt-9 text-5xl font-black tracking-tight text-white" dir="ltr">{timer}</p>
        <div className="mt-8 border-t border-white/10 pt-6"><p className="text-xs font-black tracking-[.15em] text-cyan-200">بعد الإرسال</p><div className="mt-4 space-y-3">{analysis ? <><p className="text-lg font-black text-white">{analysis.labelAr}</p><p className="text-xs font-black text-cyan-200">{uxCopy.bac.resultTitle}</p><p className="text-sm leading-6 text-blue-100">{analysis.summaryAr}</p><div className="rounded-xl bg-white/5 p-3 text-sm text-blue-100">العلامة: {analysis.score}/100</div><ul className="space-y-2">{analysis.signals.map(signal => <li key={signal} className="text-xs leading-5 text-blue-100">• {signal}</li>)}</ul><div className="border-t border-white/10 pt-3"><p className="text-xs font-black text-cyan-200">خطوتك التالية</p><ul className="mt-2 space-y-2">{analysis.actionsAr.map(action => <li key={action} className="flex gap-2 text-xs leading-5 text-white"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{action}</li>)}</ul></div></> : ["علامتك والزمن", "إتقانك وأخطاؤك المسجلة", "مراجعتك التالية", "خطة مناسبة لخطوتك"].map(item => <div key={item} className="flex items-center gap-3 text-sm text-blue-100"><ShieldCheck className="h-4 w-4 text-emerald-300" />{item}</div>)}</div></div>
      </aside>
    </main>
  </div>;
}

function FocusFeature({ icon: Icon, label }: { icon: typeof Clock3; label: string }) {
  return <div className="bac-feature rounded-xl p-3"><Icon className="h-4 w-4 text-[var(--student-primary)]" /><p className="mt-2 text-xs font-black">{label}</p></div>;
}
