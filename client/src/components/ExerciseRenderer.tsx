import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PaperPenReveal({ steps }: { steps: string[] }) {
  const [visible, setVisible] = useState(0);
  return <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4" dir="rtl"><p className="font-black text-slate-900">خدمها بيدك.</p><p className="mt-1 text-xs leading-5 text-slate-500">حل على الورق، ثم اكشف خطوة واحدة في كل مرة.</p><div className="mt-4 space-y-2">{steps.slice(0, visible).map((step, index) => <p key={step} className="rounded-lg bg-white p-3 text-xs leading-6 text-slate-600"><b className="text-blue-700">{index + 1}.</b> {step}</p>)}</div><Button onClick={() => setVisible(value => Math.min(value + 1, steps.length))} disabled={visible >= steps.length} variant="outline" className="mt-4 h-9 rounded-lg border-blue-200 bg-white text-xs font-bold">{visible >= steps.length ? "اكتمل الكشف" : "اكشف الخطوة التالية"}</Button></div>;
}

export function HintStepper({ hints }: { hints: string[] }) {
  const [used, setUsed] = useState(0);
  return <div className="rounded-2xl bg-blue-950 p-4 text-white" dir="rtl"><p className="text-sm font-black">تلميح متدرج</p><div className="mt-3 space-y-2">{hints.slice(0, used).map((hint, index) => <p key={hint} className="rounded-lg bg-white/10 p-2.5 text-xs leading-5 text-blue-100">تلميح {index + 1}: {hint}</p>)}</div><Button onClick={() => setUsed(value => Math.min(value + 1, hints.length))} disabled={used >= hints.length} className="mt-4 h-9 rounded-lg bg-cyan-300 text-xs font-black text-blue-950 hover:bg-cyan-200">{used >= hints.length ? "الحل متاح الآن" : `أظهر التلميح ${used + 1}`}</Button></div>;
}
