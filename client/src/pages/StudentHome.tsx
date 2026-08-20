import { BrandMark } from "@/components/BrandMark";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpenCheck, BrainCircuit, CalendarDays, ChevronLeft, CircleHelp, ClipboardCheck, Compass, FlaskConical, FunctionSquare, Leaf, Menu, MoreHorizontal, Sparkles, Target } from "lucide-react";
import { Link, useLocation } from "wouter";

const subjectStyles = {
  math: { icon: FunctionSquare, tone: "bg-blue-100 text-blue-700", band: "from-blue-700 to-indigo-900", label: "رياضيات" },
  physics: { icon: FlaskConical, tone: "bg-orange-100 text-orange-700", band: "from-orange-500 to-rose-700", label: "فيزياء" },
  natural_sciences: { icon: Leaf, tone: "bg-emerald-100 text-emerald-700", band: "from-emerald-500 to-teal-800", label: "علوم طبيعية" },
};

export default function StudentHome() {
  const overview = trpc.curriculum.overview.useQuery();
  const learningItems = trpc.curriculum.studentLearningItems.useQuery();
  const progress = trpc.progress.summary.useQuery();
  return <RoleGate allowed={["student"]} title="لوحتك التعليمية تنتظرك"><StudentWorkspace data={overview.data} learningItems={learningItems.data} progress={progress.data} /></RoleGate>;
}

function StudentWorkspace({ data, learningItems, progress }: { data?: { curriculum: { code: string; title: string; academicYear: string; track: string } | null; subjects: Array<{ id: number; code: string; nameAr: string; taglineAr: string | null; sourceGate: string; sourceGateNote: string | null }> }; learningItems?: Array<{ id: number; subjectCode: string; titleAr: string; type: string; provenance: "official_current" | "user_approved_working_reference" }>; progress?: { errors: Array<{ id: number; errorType: string; occurrences: number }>; reviews: Array<{ id: number; reason: string }>; mastery: Array<{ conceptNameAr: string; status: string; score: string }> } }) {
  const [, setLocation] = useLocation();
  const smartAssessment = trpc.progress.smartAssessment.useQuery(undefined, { enabled: false });
  const subjects = data?.subjects?.length ? data.subjects : [
    { id: 1, code: "math", nameAr: "الرياضيات", taglineAr: "اختيار الطريق الصحيح قبل كثرة الحسابات.", sourceGate: "waiting_for_current_official_book", sourceGateNote: null },
    { id: 2, code: "physics", nameAr: "العلوم الفيزيائية", taglineAr: "قبل القانون… افهم واش راه يصرا.", sourceGate: "waiting_for_current_official_book", sourceGateNote: null },
    { id: 3, code: "natural_sciences", nameAr: "علوم الطبيعة والحياة", taglineAr: "الوثيقة تعطيك الأدلة… وأنت تبني الاستنتاج.", sourceGate: "waiting_for_current_official_book", sourceGateNote: null },
  ];
  const waitingCount = subjects.filter(subject => subject.sourceGate !== "verified").length;

  return (
    <div className="min-h-screen bg-[#f6f8ff] text-slate-900" dir="rtl">
      <aside className="hidden fixed inset-y-0 right-0 z-30 w-72 border-l border-slate-200/70 bg-white px-5 py-7 lg:flex lg:flex-col">
        <BrandMark />
        <div className="mt-12 space-y-2">
          <NavItem icon={Compass} label="المنصة" active onClick={() => setLocation("/app")} />
          <NavItem icon={BookOpenCheck} label="مسار المواد" onClick={() => setLocation("/subjects")} />
          <NavItem icon={CalendarDays} label="مراجعة اليوم" />
          <NavItem icon={ClipboardCheck} label="دفتر أخطائي" />
          <NavItem icon={Target} label="وضع BAC" />
        </div>
        <div className="mt-auto rounded-[1.5rem] bg-blue-950 p-5 text-white">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <p className="mt-3 text-sm font-black">شوفها. افهمها. جرّبها.</p>
          <p className="mt-1 text-xs leading-5 text-blue-200">تظهر جلساتك ومراجعاتك هنا بعد نشر أول وحدة معتمدة.</p>
        </div>
      </aside>

      <main className="lg:mr-72">
        <header className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-12">
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-600 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-left sm:block"><p className="text-sm font-black">مرحبًا بك في نقطة البداية</p><p className="mt-1 text-xs text-slate-500">{data?.curriculum?.academicYear ?? "2026–2027"} · علوم تجريبية</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-950 text-xs font-black text-white">ب</div>
          </div>
        </header>

        <div className="px-5 pb-28 sm:px-8 lg:px-12">
          <section className="relative overflow-hidden rounded-[2rem] bg-blue-950 px-6 py-7 text-white shadow-xl shadow-blue-950/15 sm:px-9 sm:py-8">
            <div className="absolute left-0 top-0 h-full w-2/5 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div><Badge className="border-0 bg-white/10 px-3 py-1 text-blue-100 hover:bg-white/10">جلسة اليوم</Badge><h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">البداية الصحيحة تحتاج مسارًا واضحًا.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-200">تظهر لك الآن بطاقات مبنية على مراجع العمل التي اعتمدها صاحب المنصة، مع وسم واضح لمصدرها.</p></div>
              <Button onClick={() => setLocation("/subjects")} className="h-11 shrink-0 rounded-xl bg-cyan-300 px-5 font-bold text-blue-950 hover:bg-cyan-200">استكشف المواد <ArrowLeft className="mr-2 h-4 w-4" /></Button>
            </div>
          </section>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
            <section className="soft-panel p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="section-kicker">نقطة اليوم</p><h2 className="mt-1 text-xl font-black">أكمل من حيث توقفت</h2></div><MoreHorizontal className="h-5 w-5 text-slate-400" /></div>
              <div className="mt-6 space-y-3">{learningItems?.length ? learningItems.slice(0, 3).map(item => <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><BookOpenCheck className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-bold">{item.titleAr}</p><p className="mt-1 text-xs leading-5 text-slate-500">{subjectStyles[item.subjectCode as keyof typeof subjectStyles]?.label ?? "مادة"} · {item.type}</p></div><Badge className="border-0 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-50">مرجع عمل معتمد</Badge></div>) : <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><CircleHelp className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-bold">بانتظار أول بطاقة متاحة</p><p className="mt-1 text-xs leading-5 text-slate-500">ستظهر البطاقات هنا عند تهيئتها لمسار الطالب.</p></div>
                <span className="hidden rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-500 sm:block">قريبًا</span>
              </div>}</div>
            </section>
            <section className="rounded-[1.5rem] bg-gradient-to-br from-[#ffeadb] to-[#fff6ed] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-orange-700"><BrainCircuit className="h-5 w-5" /><span className="text-sm font-black">مراجعة اليوم</span></div>
              <p className="mt-3 text-lg font-black text-slate-900">خلّينا نثبتها قبل ما تنساها.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">ستتولد القائمة من الأخطاء المتكررة، المفاهيم الضعيفة، والتدريبات المكتملة.</p>
              <div className="mt-5 border-t border-orange-200/70 pt-4 text-xs font-bold text-orange-800"><div className="flex items-center justify-between"><span>{progress?.reviews?.length ? "عناصر مراجعة مستحقة" : "لا توجد عناصر مستحقة الآن"}</span><span>{progress?.reviews?.length ?? 0}</span></div>{progress?.reviews?.map(review => <p key={review.id} className="mt-2 text-orange-700">{review.reason === "solution_reveal" ? "راجِع سؤالًا كُشفت له خطوات الحل" : review.reason === "heavy_hint_usage" ? "راجِع سؤالًا استُخدمت فيه تلميحات كثيرة" : "راجِع سؤالًا أخطأت فيه"}</p>)}</div>
            </section>
          </div>

          <section className="mt-5 rounded-[1.5rem] border border-rose-100 bg-gradient-to-l from-rose-50 to-white p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700"><Target className="h-5 w-5" /></div><div><p className="font-black text-slate-950">نقطة تحتاج اهتمامًا</p><p className="mt-1 text-sm leading-6 text-slate-600">{waitingCount} مواد لا تزال بانتظار مصدر رسمي حالي؛ لهذا بقيت مساراتها التعليمية مقفلة لحماية جودة التعلم.</p></div></div>
            <Button variant="outline" onClick={() => setLocation("/subjects")} className="mt-4 h-10 rounded-xl border-rose-200 bg-white font-bold text-rose-700 sm:mt-0">راجع الحالة</Button>
          </section>

          <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="section-kicker">مساراتك</p><h2 className="mt-1 text-xl font-black">المواد الثلاث</h2></div><Link href="/subjects" className="text-sm font-bold text-blue-700">عرض الكل</Link></div>
            <div className="grid gap-4 md:grid-cols-3">{subjects.map(subject => <SubjectCard key={subject.code} subject={subject} />)}</div>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="soft-panel p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><ClipboardCheck className="h-5 w-5" /></div><div><p className="font-black">دفتر أخطائي</p><p className="text-xs text-slate-500">كل خطأ يصبح فرصة تصحيح.</p></div></div><div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">{progress?.errors?.length ? progress.errors.map(error => <p key={error.id}>{error.errorType} · تكرر {error.occurrences} مرات</p>) : "لا توجد أخطاء مسجلة بعد."}</div></div>
            <div className="soft-panel p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Target className="h-5 w-5" /></div><div><p className="font-black">تقدمك</p><p className="text-xs text-slate-500">الإتقان يُقاس بالفهم والتطبيق.</p></div></div><div className="mt-6"><div className="flex justify-between text-xs font-bold text-slate-500"><span>{progress?.mastery?.length ? "سجل إتقان المفاهيم" : "ستظهر نسبة الإتقان هنا"}</span><span>{progress?.mastery?.length ?? "—"}</span></div><Progress value={Math.min(100, (progress?.mastery?.length ?? 0) * 20)} className="mt-3 h-2.5 bg-slate-100" />{progress?.mastery?.length ? <div className="mt-3 space-y-1.5">{progress.mastery.map(item => <p key={item.conceptNameAr} className="flex justify-between text-xs text-slate-600"><span>{item.conceptNameAr}</span><span>{item.status} · {item.score}%</span></p>)}</div> : null}</div></div>
          </section>
          <section className="mt-5 rounded-[1.5rem] border border-cyan-100 bg-gradient-to-l from-cyan-50 to-white p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black text-slate-950">تقييم ذكي لأدائك</p><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">يحلل المحاولات والتلميحات والخطوات المكشوفة وسجل الأخطاء فقط، ثم يقدم ملاحظة عملية. لا ينشئ حقائق جديدة عن الدرس.</p></div><Button onClick={() => smartAssessment.refetch()} disabled={smartAssessment.isFetching} className="h-10 rounded-xl bg-cyan-700 font-bold hover:bg-cyan-800">{smartAssessment.isFetching ? "جارٍ التحليل…" : "حلّل أدائي"}</Button></div>{smartAssessment.data && <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-white p-4 text-sm text-slate-700"><b className="text-cyan-800">نقطة قوة:</b><p className="mt-1">{smartAssessment.data.strengths[0]}</p></div><div className="rounded-xl bg-white p-4 text-sm text-slate-700"><b className="text-rose-700">انتبه إلى:</b><p className="mt-1">{smartAssessment.data.attentionPoint}</p></div><div className="rounded-xl bg-white p-4 text-sm text-slate-700"><b className="text-emerald-700">الخطوة التالية:</b><p className="mt-1">{smartAssessment.data.nextReview}</p></div></div>}{smartAssessment.data && <p className="mt-4 text-sm leading-6 text-slate-600">{smartAssessment.data.feedback}</p>}</section>
        </div>
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-2xl border border-white/70 bg-white/90 px-2 shadow-xl shadow-slate-900/10 backdrop-blur lg:hidden"><MobileNav icon={Compass} label="المنصة" active /><MobileNav icon={BookOpenCheck} label="المواد" /><MobileNav icon={CalendarDays} label="المراجعة" /><MobileNav icon={Target} label="BAC" /></nav>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: typeof Compass; label: string; active?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-right text-sm font-bold transition ${active ? "bg-blue-50 text-blue-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4.5 w-4.5" /><span>{label}</span></button>; }
function MobileNav({ icon: Icon, label, active }: { icon: typeof Compass; label: string; active?: boolean }) { return <button className={`grid place-items-center gap-1 text-[10px] font-bold ${active ? "text-blue-700" : "text-slate-400"}`}><Icon className="h-4 w-4" /><span>{label}</span></button>; }
function SubjectCard({ subject }: { subject: { code: string; nameAr: string; taglineAr: string | null; sourceGate: string } }) { const style = subjectStyles[subject.code as keyof typeof subjectStyles] ?? subjectStyles.math; const Icon = style.icon; return <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-100"><div className={`h-1.5 bg-gradient-to-l ${style.band}`} /><div className="p-5"><div className="flex items-start justify-between"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${style.tone}`}><Icon className="h-5 w-5" /></div><Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700">بانتظار المصدر</Badge></div><h3 className="mt-5 font-black text-slate-900">{subject.nameAr}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{subject.taglineAr}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400"><span>المسار مقفل بأمان</span><ChevronLeft className="h-4 w-4" /></div></div></div>; }
