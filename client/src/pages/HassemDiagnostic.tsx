import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Target } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

const questions = [
  { subject: "رياضيات", prompt: "في مسألة نهاية، ما أول قرار يمنع الخطأ في اختيار الأداة؟", options: ["التحقق من شرط التعويض", "حفظ النتيجة", "تغيير المتغير دائمًا"], answer: 0 },
  { subject: "فيزياء", prompt: "عند استغلال تحول كيميائي، ما الرابط الذي يجب تثبيته قبل الاستنتاج؟", options: ["المقدار ووحدته ودلالته", "شكل الجدول فقط", "ترتيب الألوان"], answer: 0 },
  { subject: "علوم", prompt: "في قراءة وثيقة حول البروتين، ما الذي يسبق الحكم على العلاقة بنية–وظيفة؟", options: ["تحديد الدليل في الوثيقة", "حفظ التعريف", "اختيار الاستنتاج أولًا"], answer: 0 },
];

export default function HassemDiagnostic() {
  const [, setLocation] = useLocation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const done = index >= questions.length;
  const score = useMemo(() => answers.reduce((total, answer, itemIndex) => total + (answer === questions[itemIndex]?.answer ? 1 : 0), 0), [answers]);
  const answer = (choice: number) => { setAnswers(current => [...current, choice]); setIndex(current => current + 1); };

  return <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f9ff] px-4 py-6 text-slate-900 sm:px-5 sm:py-8" dir="rtl"><div className="mx-auto w-full min-w-0 max-w-2xl"><Button variant="ghost" onClick={() => setLocation("/hassem")} className="mb-6 max-w-full font-bold text-slate-600 sm:mb-8">العودة إلى الحسم</Button><section className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-100/40 sm:p-10">{!done ? <><Badge className="max-w-full bg-indigo-50 text-indigo-800 hover:bg-indigo-50"><Target className="ml-1 h-3.5 w-3.5 shrink-0"/>تشخيص الحسم القصير · {index + 1}/{questions.length}</Badge><h1 className="mt-5 break-words text-3xl font-black text-blue-950">تأكد من ترتيب أولوياتك.</h1><p className="mt-3 break-words leading-7 text-slate-600">هذا تشخيص BAC قصير يأتي بعد المراجعات المستحقة. لا يفتح محتوى غير معتمد ولا يخزن نتيجة منفصلة خارج جلسة الحسم.</p><div className="mt-8 min-w-0 rounded-2xl bg-slate-50 p-4 sm:p-5"><p className="text-xs font-black text-indigo-700">{questions[index]?.subject}</p><h2 className="mt-2 break-words text-xl font-black leading-8">{questions[index]?.prompt}</h2><div className="mt-6 grid min-w-0 gap-3">{questions[index]?.options.map((option, choice) => <Button key={option} variant="outline" onClick={() => answer(choice)} className="h-auto min-w-0 justify-between whitespace-normal border-slate-200 bg-white p-4 text-right font-bold hover:border-indigo-300 hover:bg-indigo-50"><span className="min-w-0 break-words">{option}</span><ArrowLeft className="h-4 w-4 shrink-0"/></Button>)}</div></div></> : <><Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50"><CheckCircle2 className="ml-1 h-3.5 w-3.5"/>اكتمل تشخيص الحسم</Badge><h1 className="mt-5 break-words text-3xl font-black text-blue-950">تأكيد سريع لأولوية اليوم.</h1><p className="mt-4 break-words leading-8 text-slate-600">نتيجتك: {score}/{questions.length}. عد الآن إلى الحسم لتحديث ترتيبك الشفاف ومواصلة جلسات 10 أو 20 دقيقة.</p><Button onClick={() => setLocation("/hassem")} className="mt-7 h-12 w-full rounded-xl bg-blue-700 font-black hover:bg-blue-800">العودة إلى خطة الحسم</Button></>}</section></div></main>;
}
