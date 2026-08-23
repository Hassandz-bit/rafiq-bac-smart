import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { subjectCopy, uxCopy } from "@/content/uxCopy";
import { trpc } from "@/lib/trpc";
import React from "react";
import { ArrowRight, BookOpen, ChevronLeft, CircleAlert, FlaskConical, FunctionSquare, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

type SubjectCode = "math" | "physics" | "natural_sciences";
const subjectStyles: Record<SubjectCode, { icon: typeof FunctionSquare; label: string; className: string; micro: string }> = {
  math: { icon: FunctionSquare, label: "الرياضيات", className: "subject-math", micro: "منطق · دقة · طريقة" },
  physics: { icon: FlaskConical, label: "العلوم الفيزيائية", className: "subject-physics", micro: "طاقة · تجربة · قانون" },
  natural_sciences: { icon: Leaf, label: "علوم الطبيعة والحياة", className: "subject-sciences", micro: "وثيقة · ترابط · استنتاج" },
};

export default function SubjectsPage() { return <RoleGate allowed={["student", "admin"]} title="مساراتك التعليمية تنتظرك"><SubjectsContent /></RoleGate>; }

function SubjectsContent() {
  const { data, isLoading } = trpc.curriculum.overview.useQuery();
  const [, setLocation] = useLocation();
  const subjects = data?.subjects ?? [];
  return <div className="student-shell min-h-screen pb-12" dir="rtl"><header className="mx-auto flex h-[5.5rem] max-w-[1320px] items-center justify-between px-4 sm:px-7"><button onClick={() => setLocation("/app")} className="student-back-button"><ArrowRight className="ml-2 h-4 w-4" />العودة إلى رحلتك</button><div className="flex items-center gap-2 text-xs font-black student-muted"><Sparkles className="h-4 w-4 text-[var(--student-primary)]" />مسارات التعلّم</div></header><main className="mx-auto max-w-[1320px] px-4 sm:px-7"><section className="student-subjects-intro relative overflow-hidden rounded-[2rem] p-6 sm:p-8"><div className="student-hero-orb student-hero-orb-one" /><div className="relative"><p className="student-eyebrow">المنهج {data?.curriculum?.academicYear ?? "2026–2027"}</p><h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">ابدأ من المادة التي تحتاجها الآن.</h1><p className="mt-4 max-w-2xl text-sm leading-7 student-muted">ستظهر لك الخريطة والتدريب وتحليل الخطأ عندما يكون المسار آمنًا ومصدره واضحًا.</p></div></section><section className="launch-subjects-note mt-5 flex flex-col gap-3 rounded-[1.4rem] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-[var(--student-ink)]">العلوم التجريبية هي البداية… والطموح أكبر.</p><p className="mt-1 max-w-3xl text-xs leading-6 student-muted">نبدأ بهذه المواد الثلاثة لنصنع مسارًا متقنًا، ونبني القادم معكم بهدوء وعناية.</p></div><span>نوسّعها معكم</span></section><section className="mt-7 grid gap-5 lg:grid-cols-3">{isLoading ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="student-surface h-80 animate-pulse rounded-[1.8rem]" />) : subjects.map(subject => <SubjectPathCard key={subject.id} subject={subject} />)}</section><section className="student-source-guard mt-7 flex flex-col gap-4 rounded-[1.6rem] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-400/12 text-emerald-400"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-black">وضوح المصدر جزء من طريقك.</p><p className="mt-1 max-w-2xl text-xs leading-6 student-muted">لا نفتح مسارًا اعتمادًا على مصدر غير موثّق. نعرض الحالة بوضوح حتى تعرف لماذا يبقى جزء منه مقفلاً.</p></div></div><button onClick={() => setLocation("/app")} className="text-xs font-black text-emerald-400">العودة إلى خطوة اليوم <ChevronLeft className="mr-1 inline h-3.5 w-3.5" /></button></section></main></div>;
}

function SubjectPathCard({ subject }: { subject: { code: string; nameAr: string; taglineAr: string | null; sourceGate: string; sourceGateNote: string | null } }) {
  const style = subjectStyles[subject.code as SubjectCode] ?? subjectStyles.math;
  const Icon = style.icon;
  const ready = subject.sourceGate === "verified";
  return <article className={`student-surface student-card-interactive ${style.className} overflow-hidden rounded-[1.8rem] p-5`}><div className="subject-card-grid" /><div className="relative"><div className="flex items-start justify-between"><div className="subject-icon grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-6 w-6" /></div><span className={`subject-state ${ready ? "subject-state-ready" : ""}`}>{ready ? "جاهز للتعلّم" : "قيد الإثراء"}</span></div><p className="mt-8 text-xs font-black text-[var(--subject)]">{style.micro}</p><h2 className="mt-2 text-xl font-black">{subject.nameAr}</h2><p className="mt-3 min-h-12 text-sm leading-6 student-muted">{subject.taglineAr ?? subjectCopy(subject.code, 0)}</p><div className="mt-6 rounded-2xl bg-[var(--subject-soft)] p-3"><div className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--subject)]" /><p className="text-xs leading-5 student-muted">{ready ? "يمكنك الآن متابعة الوحدات والتدريب في هذا المسار." : "نجهّز وحدات هذا المسار بعناية. ستظهر الدروس تدريجيًا بعد التحقق من المصدر."}</p></div></div><Button variant="ghost" disabled={!ready} className="mt-5 h-11 w-full rounded-xl border border-[var(--student-border)] bg-transparent font-black text-[var(--subject)] hover:bg-[var(--subject-soft)] hover:text-[var(--subject)]">{ready ? "ابدأ المسار" : "سيضاف قريبًا"}{ready ? <ChevronLeft className="mr-2 h-4 w-4" /> : <BookOpen className="mr-2 h-4 w-4" />}</Button></div></article>;
}
