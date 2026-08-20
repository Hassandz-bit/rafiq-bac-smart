import { Button } from "@/components/ui/button";
import { useState } from "react";

export type ExerciseKind = "mcq" | "multi_select" | "true_false" | "fill" | "matching" | "ordering" | "numeric" | "math_expression" | "interactive_image";

export function PaperPenReveal({ steps, onStepRevealed }: { steps: string[]; onStepRevealed?: (count: number) => void }) {
  const [visible, setVisible] = useState(0);
  const reveal = () => setVisible(value => { const next = Math.min(value + 1, steps.length); onStepRevealed?.(next); return next; });
  return <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4" dir="rtl"><p className="font-black text-slate-900">خدمها بيدك.</p><p className="mt-1 text-xs leading-5 text-slate-500">حل على الورق، ثم اكشف خطوة واحدة في كل مرة.</p><div className="mt-4 space-y-2">{steps.slice(0, visible).map((step, index) => <p key={step} className="rounded-lg bg-white p-3 text-xs leading-6 text-slate-600"><b className="text-blue-700">{index + 1}.</b> {step}</p>)}</div><Button onClick={reveal} disabled={visible >= steps.length} variant="outline" className="mt-4 h-9 rounded-lg border-blue-200 bg-white text-xs font-bold">{visible >= steps.length ? "اكتمل الكشف" : "اكشف الخطوة التالية"}</Button></div>;
}

export function HintStepper({ hints, onHintUsed }: { hints: string[]; onHintUsed?: (count: number) => void }) {
  const [used, setUsed] = useState(0);
  const showHint = () => setUsed(value => { const next = Math.min(value + 1, hints.length); onHintUsed?.(next); return next; });
  return <div className="rounded-2xl bg-blue-950 p-4 text-white" dir="rtl"><p className="text-sm font-black">تلميح متدرج</p><div className="mt-3 space-y-2">{hints.slice(0, used).map((hint, index) => <p key={hint} className="rounded-lg bg-white/10 p-2.5 text-xs leading-5 text-blue-100">تلميح {index + 1}: {hint}</p>)}</div><Button onClick={showHint} disabled={used >= hints.length} className="mt-4 h-9 rounded-lg bg-cyan-300 text-xs font-black text-blue-950 hover:bg-cyan-200">{used >= hints.length ? "الحل متاح الآن" : `أظهر التلميح ${used + 1}`}</Button></div>;
}

export function ExerciseResponsePanel({ type, onResponse }: { type: ExerciseKind; onResponse?: (value: string | string[]) => void }) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState(["أ", "ب", "ج", "د"]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const choices = ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"];
  const toggle = (choice: string) => setSelected(current => { const next = current.includes(choice) ? current.filter(item => item !== choice) : [...current, choice]; onResponse?.(next); return next; });
  const textInput = <input value={value} onChange={event => { setValue(event.target.value); onResponse?.(event.target.value); }} className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" placeholder={type === "numeric" ? "أدخل القيمة الرقمية" : type === "math_expression" ? "اكتب التعبير الرياضي" : "اكتب إجابتك"} />;
  if (type === "mcq" || type === "true_false") return <div className="mt-4 grid gap-2">{(type === "true_false" ? ["صحيح", "خطأ"] : choices).map(choice => <button key={choice} onClick={() => { setSelected([choice]); onResponse?.(choice); }} className={`rounded-xl border px-4 py-3 text-right text-sm font-bold ${selected[0] === choice ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}>{choice}</button>)}</div>;
  if (type === "multi_select") return <div className="mt-4 grid gap-2 sm:grid-cols-2">{choices.map(choice => <button key={choice} onClick={() => toggle(choice)} className={`rounded-xl border px-4 py-3 text-right text-sm font-bold ${selected.includes(choice) ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}>{choice}</button>)}</div>;
  if (type === "ordering") return <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"><p className="text-xs text-slate-500">رتّب البطاقات. استخدم السهمين للحركة دون الحاجة للفأرة.</p><div className="mt-3 space-y-2">{order.map((item, index) => <div key={item} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700"><span>{index + 1}. البطاقة {item}</span><span className="flex gap-1"><button onClick={() => { if (index === 0) return; const next = [...order]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setOrder(next); onResponse?.(next); }} disabled={index === 0} className="rounded border px-2 py-0.5 disabled:opacity-30" aria-label={`تحريك البطاقة ${item} للأعلى`}>↑</button><button onClick={() => { if (index === order.length - 1) return; const next = [...order]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setOrder(next); onResponse?.(next); }} disabled={index === order.length - 1} className="rounded border px-2 py-0.5 disabled:opacity-30" aria-label={`تحريك البطاقة ${item} للأسفل`}>↓</button></span></div>)}</div></div>;
  if (type === "matching") return <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">{["المصطلح أ", "المصطلح ب", "المصطلح ج"].map((term, index) => <label key={term} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"><span>{term}</span><select value={matches[term] ?? ""} onChange={event => { const next = { ...matches, [term]: event.target.value }; setMatches(next); onResponse?.(Object.entries(next).map(([left, right]) => `${left}:${right}`)); }} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"><option value="">اختر المطابقة</option><option value={`البيان ${index + 1}`}>البيان {index + 1}</option><option value={`البيان ${((index + 1) % 3) + 1}`}>البيان {((index + 1) % 3) + 1}</option></select></label>)}</div>;
  if (type === "interactive_image") return <div className="mt-4 grid h-36 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">{Array.from({ length: 9 }, (_, index) => <button key={index} onClick={() => onResponse?.(`region-${index + 1}`)} className="rounded bg-blue-100/60 transition hover:bg-blue-300" aria-label={`اختيار المنطقة ${index + 1}`} />)}</div>;
  return textInput;
}
