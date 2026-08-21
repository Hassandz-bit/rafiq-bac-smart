import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uxCopy } from "@/content/uxCopy";
import { ArrowLeft, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

const questions = [
  { subject: "رياضيات", prompt: "قبل حساب النهاية، ما أول شيء تتحقق منه؟", options: ["شرط التعويض", "لون المنحنى", "رقم التمرين"], answer: 0 },
  { subject: "فيزياء", prompt: "بعد قراءة ظاهرة تجريبية، ما الخطوة المنهجية التالية؟", options: ["اختيار كمية أو قياس دال", "حفظ القانون مباشرة", "تجاهل الوحدات"], answer: 0 },
  { subject: "علوم", prompt: "في استغلال وثيقة علمية، ما الذي يسبق الاستنتاج؟", options: ["تحديد الدليل", "نسخ النص", "تخمين النتيجة"], answer: 0 },
  { subject: "رياضيات", prompt: "في دراسة التغير، ما الذي يربطك بالقرار؟", options: ["إشارة المشتقة", "حجم الصفحة", "اسم الفصل"], answer: 0 },
  { subject: "فيزياء", prompt: "أي عنصر لا يُهمل عند تطبيق علاقة كمية؟", options: ["الوحدة", "العنوان فقط", "لون الرسم"], answer: 0 },
];

export default function FreeDiagnostic() {
  const [, setLocation] = useLocation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const done = index >= questions.length;
  const score = useMemo(() => answers.reduce((n, a, i) => n + (a === questions[i]?.answer ? 1 : 0), 0), [answers]);
  const answer = (choice: number) => { setAnswers(current => [...current, choice]); setIndex(current => current + 1); };
  return <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f9ff] px-5 py-8 text-slate-900" dir="rtl"><div className="mx-auto w-full max-w-2xl"><Button variant="ghost" onClick={() => setLocation("/")} className="mb-8 font-bold text-slate-600">العودة إلى البداية</Button><section className="w-full rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/40 sm:p-10">{!done ? <><Badge className="bg-blue-50 text-blue-800 hover:bg-blue-50"><Sparkles className="ml-1 h-3.5 w-3.5"/>تشخيص مجاني · {index + 1}/{questions.length}</Badge><h1 className="mt-5 text-3xl font-black text-blue-950">اكتشف أين يستحق تركيزك.</h1><p className="mt-3 leading-7 text-slate-600">اختبار قصير يساعدك على معرفة ما تتقنه وما يحتاج إلى مراجعة. لا نطلب تسجيلًا ولا نخزن بيانات شخصية هنا.</p><div className="mt-8 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-black text-blue-700">{questions[index]?.subject}</p><h2 className="mt-2 text-xl font-black leading-8">{questions[index]?.prompt}</h2><div className="mt-6 grid gap-3">{questions[index]?.options.map((option, choice) => <Button key={option} variant="outline" onClick={() => answer(choice)} className="h-auto w-full justify-between whitespace-normal border-slate-200 bg-white p-4 text-right font-bold hover:border-blue-300 hover:bg-blue-50">{option}<ArrowLeft className="h-4 w-4 shrink-0"/></Button>)}</div></div></> : <><Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50"><CheckCircle2 className="ml-1 h-3.5 w-3.5"/>تبقى نتيجتك في هذه الجلسة فقط</Badge><h1 className="mt-5 text-3xl font-black text-blue-950">هذه بداية جيدة.</h1><p className="mt-4 leading-8 text-slate-600">أجبت صحيحًا عن {score} من {questions.length}. يظهر لديك أساس جيد في التفكير المنهجي؛ ثبّت أفكار البداية قبل الانتقال إلى ما بعدها.</p><div className="mt-7 grid gap-3 rounded-2xl bg-blue-50 p-5 text-sm"><p><b>نقطة قوة:</b> تبدأ بالخطوة المناسبة قبل الحساب أو الاستنتاج.</p><p><b>خطوة تستحق المراجعة:</b> اربط الدليل أو القياس بالاستنتاج والوحدة.</p><p><b>الفكرة التي تقودك:</b> ظاهرة ← قياس ← تفسير، أو معطى ← شرط ← أداة.</p></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><Button onClick={() => setLocation("/app?offer=trial")} className="h-auto min-h-12 rounded-xl bg-blue-700 px-3 py-3 text-sm font-black hover:bg-blue-800">{uxCopy.pricing.trial.cta} <LockKeyhole className="mr-2 h-4 w-4"/></Button><Button variant="outline" onClick={() => setLocation("/app?offer=season")} className="h-auto min-h-12 rounded-xl border-blue-200 bg-white px-3 py-3 text-sm font-black text-blue-800">{uxCopy.pricing.season.cta}</Button><Button variant="outline" onClick={() => setLocation("/hassem?offer=hasm")} className="h-auto min-h-12 rounded-xl border-amber-200 bg-amber-50 px-3 py-3 text-sm font-black text-amber-900">{uxCopy.pricing.hassem.cta}</Button></div><p className="mt-4 text-center text-xs text-slate-500">لن نرسل إجاباتك أو نتيجتك قبل أن تختار إنشاء حساب.</p></>}</section></div></main>;
}
