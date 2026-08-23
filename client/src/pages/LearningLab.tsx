import { MathBlock } from "@/components/MathBlock";
import { MindMapCanvas } from "@/components/MindMapCanvas";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { uxCopy } from "@/content/uxCopy";
import { AlertTriangle, ArrowRight, BrainCircuit, ChevronLeft, Expand, FileCheck2, Layers3, Sigma } from "lucide-react";
import React, { useState } from "react";
import { useLocation } from "wouter";

const slideTypes = ["مفهوم", "تعريف", "صيغة", "خطوة بخطوة", "مثال", "مقارنة", "خطأ شائع", "نصيحة BAC", "نقطة تحقق", "خلاصة"];
const slideNotes: Record<string, string> = {
  "مفهوم": "ابدأ بالفكرة العامة قبل الانتقال إلى الرموز أو الحساب.",
  "تعريف": "ثبّت المعنى المقصود أولًا، ثم اربطه بمثال بسيط.",
  "صيغة": "اقرأ كل رمز ومعناه قبل استخدام الصيغة في الحل.",
  "خطوة بخطوة": "رتّب المعطيات ثم نفّذ خطوة واحدة واضحة في كل مرة.",
  "مثال": "تدرّب على تطبيق قصير يوضح طريقة التفكير لا مجرد النتيجة.",
  "مقارنة": "قارن بين الحالتين لتعرف متى تستخدم كل فكرة.",
  "خطأ شائع": "توقف عند النقطة التي يكثر فيها الالتباس قبل متابعة الحل.",
  "نصيحة BAC": "اكتب الخطوات بوضوح وتحقق من معنى النتيجة قبل اعتمادها.",
  "نقطة تحقق": "اسأل نفسك: هل أعرف لماذا اخترت هذه الخطوة؟",
  "خلاصة": "ارجع إلى الفكرة الأساسية ثم حدّد ما ستراجعه لاحقًا.",
};

export default function LearningLab() {
  return <RoleGate allowed={["student", "admin"]} title="مسار التعلّم محمي"><LearningLabContent /></RoleGate>;
}

function LearningLabContent() {
  const [, setLocation] = useLocation();
  const [activeSlide, setActiveSlide] = useState("صيغة");
  const activeIndex = slideTypes.indexOf(activeSlide);
  const selectSlide = (index: number) => setActiveSlide(slideTypes[index]);

  return <div className="learning-workspace min-h-screen p-5 sm:p-8" dir="rtl"><div className="mx-auto max-w-6xl">
    <button onClick={() => setLocation("/app")} className="learning-back flex items-center gap-2 text-sm font-bold"><ArrowRight className="h-4 w-4" />العودة إلى رحلتك</button>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="student-eyebrow">تعلم مترابط</p><h1 className="learning-title mt-2">{uxCopy.learning.mapTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-7 student-muted">{uxCopy.learning.mapDescription} تظهر المادة عندما يكون مسارها ومصدرها واضحين.</p></div><Badge className="learning-source-badge px-3 py-2">مساحة تعلّم توضيحية</Badge></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><MindMapCanvas /><section className="learning-surface p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-black">{uxCopy.learning.slidesTitle}</p><p className="mt-1 text-xs student-muted">اختر نوع الشرح لتشاهد طريقة استخدامه.</p></div><Layers3 className="h-5 w-5 text-[var(--student-primary)]" /></div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="أنواع شرح الدرس">{slideTypes.map((type, index) => <button key={type} type="button" role="tab" aria-selected={activeSlide === type} aria-controls="learning-slide-preview" tabIndex={activeSlide === type ? 0 : -1} onClick={() => selectSlide(index)} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); selectSlide((index + (event.key === "ArrowLeft" ? 1 : -1) + slideTypes.length) % slideTypes.length); } }} className={`learning-slide-tag cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--student-primary)] focus-visible:ring-offset-2 ${activeSlide === type ? "learning-slide-tag-active" : ""}`}>{type}</button>)}</div>
      <div id="learning-slide-preview" role="tabpanel" className="learning-equation-card mt-7 rounded-2xl border border-sky-300/35 bg-[#102447] p-6 shadow-[0_18px_40px_rgba(15,32,74,0.32)]"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-cyan-50">{activeSlide}</p><p className="mt-1 text-xs leading-6 text-sky-100">{slideNotes[activeSlide]}</p></div><Sigma className="h-5 w-5 shrink-0 text-cyan-200" /></div><div className="mt-6 rounded-xl border border-white/25 bg-white px-4 py-4 text-lg text-slate-950 shadow-inner"><MathBlock expression={"\\frac{a+b}{2} = \\bar{x}"} block /></div><p className="mt-5 text-xs leading-6 text-sky-100">تظهر المعادلة في اتجاه مستقل وواضح، لتبقى الكسور والرموز مقروءة داخل الواجهة العربية.</p></div>
    </section></div>
    <section className="mt-6 grid gap-4 md:grid-cols-3"><EngineCard icon={BrainCircuit} title="ارَ الصورة كاملة" text="كبّر الخريطة واسحبها وانتقل بين المفاهيم بوضوح." /><EngineCard icon={Expand} title="اتبع الفكرة" text="مفهوم وصيغة وطريقة ومثال وتنبيه وخطأ شائع." /><EngineCard icon={FileCheck2} title="خطوات مركزة" text="نموذج واضح للدرس ومراجعة للمحتوى قبل النشر." /></section>
    <section className="learning-governance mt-6 rounded-[1.5rem] p-5"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">هذه الأدوات تساعد على الفهم، لكنها لا تحل محل المصدر المعتمد.</p><p className="mt-1 text-sm leading-6">تتوسع وحدات المواد تدريجيًا عند اكتمال التحقق من المصدر والمراجعة الأكاديمية.</p></div></div></section>
  </div></div>;
}

function EngineCard({ icon: Icon, title, text }: { icon: typeof BrainCircuit; title: string; text: string }) {
  return <div className="learning-surface p-5"><Icon className="h-5 w-5 text-[var(--student-primary)]" /><p className="mt-4 font-black">{title}</p><p className="mt-1 text-xs leading-5 student-muted">{text}</p></div>;
}
