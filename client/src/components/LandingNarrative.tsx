import { BrainCircuit, CheckCircle2, CircleHelp, Compass, ScanSearch, ShieldCheck, Sparkles, Target } from "lucide-react";
import React from "react";

export function LandingNarrative({ onNavigate }: { onNavigate: (path: string) => void }) {
  const painPoints = ["الدروس كثيرة", "المعلومات متفرقة", "الأخطاء تتكرر", "المراجعة بلا ترتيب"];
  const journey = [
    { icon: Compass, label: "افهم", text: "خريطة وشرح" },
    { icon: BrainCircuit, label: "طبّق", text: "مثال وتمرين" },
    { icon: ScanSearch, label: "اكتشف", text: "سبب الخطأ" },
    { icon: Target, label: "راجع", text: "في وقتها" },
    { icon: ShieldCheck, label: "أتقن", text: "تقدم واضح" },
  ];
  return <>
    <section className="landing-problem mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
      <div className="landing-kicker"><span>02</span><i />أين تبدأ؟</div>
      <div className="mt-5 grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-end"><div><h2 className="landing-section-display">تدرس كثيرًا…<br /><em>لكن هل تعرف ما تحتاجه الآن؟</em></h2><p className="mt-5 max-w-md text-sm leading-8 student-muted">هنا يأتي دور رفيقك: يحوّل ما تفعله إلى مسار أبسط للقرار التالي.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{painPoints.map((point, index) => <div key={point} className="problem-chip"><span>0{index + 1}</span><p>{point}</p></div>)}</div></div>
    </section>
    <section className="landing-journey mx-auto max-w-[1280px] px-5 pb-20 sm:px-8">
      <div className="landing-journey-panel rounded-[2rem] p-6 sm:p-9"><div className="max-w-xl"><p className="student-eyebrow"><Sparkles className="h-3.5 w-3.5" />كيف يعمل رفيقك؟</p><h2 className="landing-section-display mt-4">خطوات قليلة.<br /><em>طريق أوضح.</em></h2></div><div className="journey-track mt-9 grid gap-4 sm:grid-cols-5">{journey.map((step, index) => <div className="journey-step" key={step.label}><span className="journey-number">0{index + 1}</span><div className="journey-icon"><step.icon /></div><p>{step.label}</p><small>{step.text}</small></div>)}</div></div>
    </section>
    <section className="landing-parent mx-auto max-w-[1280px] px-5 pb-20 sm:px-8"><div className="grid gap-8 rounded-[2rem] border border-[var(--student-border)] bg-[var(--student-surface)] p-6 sm:p-9 lg:grid-cols-[1fr_.78fr] lg:items-center"><div><p className="student-eyebrow">لولي الأمر</p><h2 className="landing-section-display mt-4">ابنك لا يحتاج إلى<br /><em>مزيد من التشتت.</em></h2><p className="mt-5 max-w-xl text-sm leading-8 student-muted">يحتاج إلى طريق يعرف فيه ماذا يفهم، وماذا يتدرب، وماذا يراجع.</p></div><div className="parent-points grid gap-3 sm:grid-cols-2">{["تقدم قابل للفهم", "مراجعة منظمة", "تدريب موجه", "نقاط تحتاج دعمًا"].map(point => <div key={point}><CheckCircle2 />{point}</div>)}</div></div></section>
    <section id="plans" className="landing-plans mx-auto max-w-[1280px] px-5 pb-20 sm:px-8"><div className="text-center"><p className="student-eyebrow justify-center">اختر ما يناسب مرحلتك</p><h2 className="landing-section-display mt-4">طريقتك في التعلّم<br /><em>تبدأ بما تحتاجه الآن.</em></h2></div><div className="mt-9 grid gap-4 md:grid-cols-3"><PlanCard name="الباقة التجريبية" note="جرّب طريقتنا في التعلم." action="ابدأ التجربة" onClick={() => onNavigate("/diagnostic")} /><PlanCard name="باقة الموسم" note="ابنِ مستواك خطوة بخطوة." action="اكتشف مساحتك" onClick={() => onNavigate("/app")} featured /><PlanCard name="باقة الحسم" note="بقي القليل… فلنجعل منه الفرق." action="افتح مرحلة الحسم" onClick={() => onNavigate("/hassem")} /></div></section>
    <section className="landing-faq mx-auto max-w-[1280px] px-5 pb-20 sm:px-8"><div className="landing-faq-panel"><div><p className="student-eyebrow"><CircleHelp className="h-3.5 w-3.5" />أسئلة البداية</p><h2 className="mt-3 text-2xl font-black">هل تحتاج إلى أن تبدأ من كل شيء؟</h2><p className="mt-3 text-sm leading-7 student-muted">لا. ابدأ من تشخيص قصير، ثم اختر الخطوة التي تستحق وقتك.</p></div><button onClick={() => onNavigate("/diagnostic")} className="landing-arrow-cta" aria-label="ابدأ التشخيص المجاني">ابدأ من هنا <span>←</span></button></div></section>
  </>;
}

function PlanCard({ name, note, action, onClick, featured = false }: { name: string; note: string; action: string; onClick: () => void; featured?: boolean }) {
  return <button onClick={onClick} className={`landing-plan-card text-right ${featured ? "landing-plan-featured" : ""}`}><span>{featured ? "الأكثر شمولًا" : "مسار تعلّم"}</span><h3>{name}</h3><p>{note}</p><b>{action} <i>←</i></b></button>;
}
