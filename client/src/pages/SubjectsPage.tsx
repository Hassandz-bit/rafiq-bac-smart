import { BrandMark } from "@/components/BrandMark";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, CircleAlert, FlaskConical, FunctionSquare, Leaf, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";

const iconMap = { math: FunctionSquare, physics: FlaskConical, natural_sciences: Leaf };
const colors = { math: "from-blue-600/20 to-indigo-600/5 text-blue-700", physics: "from-orange-500/20 to-rose-500/5 text-orange-700", natural_sciences: "from-emerald-500/20 to-teal-500/5 text-emerald-700" };

export default function SubjectsPage() {
  return <RoleGate allowed={["student"]} title="مساراتك التعليمية تنتظرك"><SubjectsContent /></RoleGate>;
}
function SubjectsContent() {
  const { data } = trpc.curriculum.overview.useQuery();
  const [, setLocation] = useLocation();
  const subjects = data?.subjects ?? [];
  return <div className="min-h-screen bg-[#f6f8ff]" dir="rtl"><header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"><BrandMark /><Button variant="outline" onClick={() => setLocation("/app")} className="rounded-xl border-slate-200 bg-white font-bold"><ArrowRight className="ml-2 h-4 w-4" />لوحة التعلم</Button></header><main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8"><div className="mt-5 max-w-2xl"><p className="section-kicker">المنهج {data?.curriculum?.academicYear ?? "2026–2027"}</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">ثلاث مواد. مسار واحد: افهم بطريقة.</h1><p className="mt-4 text-sm leading-7 text-slate-600">نجهز لكل مادة خريطة، شرائح، تدريبًا، وتحليل أخطاء. ويُفتح المحتوى فقط بعد اعتماد المصدر الرسمي الحالي.</p></div><section className="mt-8 grid gap-5 lg:grid-cols-3">{subjects.map(subject => { const Icon = iconMap[subject.code as keyof typeof iconMap] ?? BookOpen; const color = colors[subject.code as keyof typeof colors] ?? colors.math; return <article key={subject.id} className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100"><div className={`h-40 bg-gradient-to-bl ${color} p-6`}><div className="flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm"><Icon className="h-6 w-6" /></div><Badge className="border-0 bg-white/70 text-slate-700 hover:bg-white/70">2026–2027</Badge></div><h2 className="mt-5 text-xl font-black text-slate-900">{subject.nameAr}</h2></div><div className="p-6"><p className="min-h-12 text-sm leading-6 text-slate-600">{subject.taglineAr}</p><div className="mt-6 flex gap-2 rounded-2xl bg-amber-50 p-3 text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-xs font-bold leading-5">{subject.sourceGateNote ?? "المصدر الرسمي الحالي مطلوب قبل النشر."}</p></div><Button variant="outline" className="mt-6 h-11 w-full rounded-xl border-slate-200 bg-white font-bold" disabled>بانتظار اعتماد المصدر</Button></div></article>})}</section><section className="mt-8 flex flex-col gap-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 text-emerald-950 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600"/><div><p className="font-black">حارس المحتوى الأكاديمي يعمل.</p><p className="mt-1 text-sm leading-6 text-emerald-800">لا نملأ المنصة بملفات قديمة أو غير موثقة. بعد رفع الكتاب الرسمي الحالي، يبدأ فريق المحتوى بالمراجعة البشرية.</p></div></div><Link href="/studio" className="shrink-0 text-sm font-black text-emerald-700">فتح الاستوديو للمشرفين</Link></section></main></div>;
}
