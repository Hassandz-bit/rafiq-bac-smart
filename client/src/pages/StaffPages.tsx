import React, { useMemo, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ClipboardPenLine, FilePenLine, ShieldCheck, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

type GrantPlanCode = "season_one_subject" | "season_two_subjects" | "season_three_subjects" | "hasm_one_subject" | "hasm_two_subjects" | "hasm_three_subjects";
type GrantSubject = "math" | "physics" | "natural_sciences";

const assignablePlans: Array<{ code: GrantPlanCode; label: string; count: number }> = [
  { code: "season_one_subject", label: "الموسم — مادة واحدة", count: 1 },
  { code: "season_two_subjects", label: "الموسم — مادتان", count: 2 },
  { code: "season_three_subjects", label: "الموسم — المواد الثلاث", count: 3 },
  { code: "hasm_one_subject", label: "الحسم — مادة واحدة", count: 1 },
  { code: "hasm_two_subjects", label: "الحسم — مادتان", count: 2 },
  { code: "hasm_three_subjects", label: "الحسم — المواد الثلاث", count: 3 },
];

const subjectChoices: Array<{ value: GrantSubject; label: string }> = [
  { value: "math", label: "الرياضيات" },
  { value: "physics", label: "الفيزياء" },
  { value: "natural_sciences", label: "علوم الطبيعة" },
];

export function EditorPage() { return <StaffWorkspace allowed={["admin", "content_editor"]} eyebrow="مساحة المحرر" title="حرّر المحتوى، ولا تتجاوز المراجعة." description="ينشئ المحرر العناصر في Draft ويرسلها للمراجعة، لكنه لا يملك مسار النشر النهائي." icon={FilePenLine} action="إنشاء مسودة" />; }
export function ReviewerPage() { return <StaffWorkspace allowed={["admin", "academic_reviewer"]} eyebrow="المراجعة الأكاديمية" title="اعتماد بشري قبل أي نشر." description="تتحقق المراجعة من المصدر الحالي، مطابقة المنهج، وصلاحية المحتوى قبل القرار الأكاديمي." icon={ClipboardPenLine} action="فتح طابور المراجعة" />; }
export function AdminPage() { return <RoleGate allowed={["admin"]} title="إدارة المنصة محمية"><AdminContent /></RoleGate>; }

function AdminContent() {
  const [, setLocation] = useLocation();
  const { data: plans, isLoading } = trpc.administration.planCatalog.useQuery();
  const [studentId, setStudentId] = useState("");
  const [planCode, setPlanCode] = useState<GrantPlanCode>("season_one_subject");
  const [subjects, setSubjects] = useState<GrantSubject[]>(["math"]);
  const selectedPlan = useMemo(() => assignablePlans.find(plan => plan.code === planCode)!, [planCode]);
  const assignment = trpc.administration.grantPlanAccess.useMutation({
    onSuccess: () => undefined,
  });
  const isReady = /^\d+$/.test(studentId) && Number(studentId) > 0 && subjects.length === selectedPlan.count;
  const toggleSubject = (subject: GrantSubject) => setSubjects(current => current.includes(subject) ? current.filter(item => item !== subject) : [...current, subject]);
  const changePlan = (value: GrantPlanCode) => {
    const next = assignablePlans.find(plan => plan.code === value)!;
    setPlanCode(value);
    setSubjects(current => current.slice(0, next.count));
  };

  return <div className="min-h-screen bg-[#f6f8ff]" dir="rtl">
    <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white px-5 sm:px-8"><BrandMark /><Button variant="outline" onClick={() => setLocation("/studio")} className="rounded-xl font-bold">العودة إلى الاستوديو</Button></header>
    <main className="mx-auto max-w-5xl p-5 sm:p-8">
      <section className="soft-panel p-7 sm:p-10"><p className="section-kicker">إدارة المنصة</p><h1 className="mt-2 text-3xl font-black text-slate-950">الاشتراكات جاهزة كهيكل وصول.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">تعرض هذه الصفحة الحزم والأسعار الأولية القابلة للتعديل من مصدر البيانات، مع الاستحقاقات وحالة التفعيل. لا توجد بوابة دفع أو تحصيل في هذه المرحلة.</p><Badge className="mt-5 border-0 bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-50">Payment-ready · الدفع غير مفعّل</Badge></section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">{isLoading ? <div className="soft-panel p-5 text-sm text-slate-500">جارٍ تحميل الخطط…</div> : plans?.map(plan => <div key={plan.id} className="soft-panel p-5"><p className="text-xs font-bold text-slate-500">{plan.code}</p><h2 className="mt-3 font-black text-slate-950">{plan.nameAr}</h2><p className="mt-2 text-xl font-black text-blue-800">{Number(plan.priceDzd).toLocaleString("ar-DZ")} دج</p><p className="mt-2 text-xs text-slate-500">{plan.entitlements.length} صلاحيات مادة · {plan.isActive ? "مفعّلة" : "موقوفة"}</p><div className="mt-4 flex flex-wrap gap-2">{plan.entitlements.map(item => <Badge key={item} variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">{item}</Badge>)}</div></div>)}</section>
      <section className="mt-6 rounded-[1.5rem] border border-blue-100 bg-white p-5 sm:p-6"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><UsersRound className="h-5 w-5" /></div><div><p className="font-black text-slate-950">تعيين خطة وصول داخلي</p><p className="mt-1 text-sm leading-6 text-slate-600">إجراء تشغيلي محمي للمدير: يحفظ تعيين الخطة، ويمنح الحسم تلقائيًا لمواد باقة الموسم نفسها. لا يجمع معلومات دفع ولا يؤكد عملية تحصيل.</p></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">رقم الطالب الداخلي<input aria-label="رقم الطالب الداخلي" inputMode="numeric" value={studentId} onChange={event => setStudentId(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none ring-blue-300 focus:ring-2" placeholder="مثال: 42" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">الخطة<select aria-label="خطة الوصول" value={planCode} onChange={event => changePlan(event.target.value as GrantPlanCode)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 outline-none ring-blue-300 focus:ring-2">{assignablePlans.map(plan => <option key={plan.code} value={plan.code}>{plan.label}</option>)}</select></label></div>
        <fieldset className="mt-5"><legend className="text-sm font-bold text-slate-700">اختر {selectedPlan.count} مادة/مواد بالضبط</legend><div className="mt-3 flex flex-wrap gap-2">{subjectChoices.map(subject => <button type="button" key={subject.value} aria-pressed={subjects.includes(subject.value)} onClick={() => toggleSubject(subject.value)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${subjects.includes(subject.value) ? "border-blue-600 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{subject.label}</button>)}</div></fieldset>
        <div className="mt-6 flex flex-wrap items-center gap-3"><Button disabled={!isReady || assignment.isPending} onClick={() => assignment.mutate({ userId: Number(studentId), planCode, subjects })} className="h-11 rounded-xl bg-blue-700 px-5 font-black hover:bg-blue-800">{assignment.isPending ? "جارٍ حفظ التعيين…" : "حفظ التعيين ومنح الاستحقاقات"}</Button>{!isReady && <p className="text-xs font-bold text-amber-700">أدخل رقم طالب صحيحًا وطابق عدد المواد مع الخطة.</p>}</div>
        {assignment.data && <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-black">تم الحفظ التشغيلي بنجاح.</p><p className="mt-1">الطبقة: {assignment.data.productTier} · الاستحقاقات: {assignment.data.entitlements.join("، ")}</p></div>}
        {assignment.error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-800">تعذر حفظ التعيين: {assignment.error.message}</p>}
      </section>
      <section className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600"/><p className="text-sm leading-6 text-emerald-900">تقرر طبقة الوصول بين «وحدة مجانية» و«مادة مشمولة بالاستحقاق» قبل إعادة أي محتوى منشور. يظهر كل تعيين محفوظ وسجل استحقاقاته للمراجعة الإدارية، بينما يبقى الدفع غير مفعّل بالكامل.</p></div></section>
    </main>
  </div>;
}

function StaffWorkspace({ allowed, eyebrow, title, description, icon: Icon, action }: { allowed: Array<"admin" | "content_editor" | "academic_reviewer">; eyebrow: string; title: string; description: string; icon: typeof FilePenLine; action: string }) {
  const [, setLocation] = useLocation();
  return <RoleGate allowed={allowed} title="مساحة عمل محمية"><div className="min-h-screen bg-[#f6f8ff]" dir="rtl"><header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white px-5 sm:px-8"><BrandMark /><Button variant="outline" onClick={() => setLocation("/studio")} className="rounded-xl font-bold">العودة إلى الاستوديو</Button></header><main className="mx-auto max-w-5xl p-5 sm:p-8"><div className="soft-panel relative overflow-hidden p-7 sm:p-10"><div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-blue-100/80 blur-3xl"/><div className="relative"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-950 text-white"><Icon className="h-6 w-6"/></div><p className="section-kicker mt-7">{eyebrow}</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{description}</p><div className="mt-8 flex flex-wrap gap-3"><Button className="h-11 rounded-xl bg-blue-700 font-bold hover:bg-blue-800">{action}</Button><Badge className="border-0 bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-50">لا يوجد نشر تلقائي بالذكاء الاصطناعي</Badge></div></div></div><section className="mt-6 grid gap-4 md:grid-cols-3"><Stub label="مسودات نشطة" value="0"/><Stub label="بانتظار قرار" value="0"/><Stub label="مصدر حالي معتمد" value="0"/></section><section className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-6"><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600"/><p className="text-sm leading-6 text-emerald-900">جميع الأدوات متصلة بسير عمل محتوى مُرقّم المراحل. سيُتاح الإدخال الفعلي بعد رفع المصدر الرسمي الحالي والتحقق البشري منه.</p></div></section></main></div></RoleGate>;
}

function Stub({ label, value }: { label: string; value: string }) { return <div className="soft-panel p-5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p></div>; }
