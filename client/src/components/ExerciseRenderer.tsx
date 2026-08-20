import { Button } from "@/components/ui/button";
import React, { useState } from "react";

export type ExerciseKind = "mcq" | "multi_select" | "true_false" | "fill" | "matching" | "ordering" | "numeric" | "math_expression" | "interactive_image";
export type ExerciseDefinition = Record<string, unknown>;

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

export function ExerciseResponsePanel({ type, definition, onResponse }: { type: ExerciseKind; definition?: ExerciseDefinition; onResponse?: (value: string | string[]) => void }) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const choices = labelsFromDefinition(definition, ["choices", "options"], ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"]);
  const [order, setOrder] = useState(() => labelsFromDefinition(definition, ["order", "items", "sequence"], ["أ", "ب", "ج", "د"]));
  const [matches, setMatches] = useState<Record<string, string>>({});
  const matchingPairs = readPairs(definition);
  const matchingTerms = matchingPairs.length ? matchingPairs.map(pair => pair.left) : ["المصطلح أ", "المصطلح ب", "المصطلح ج"];
  const matchingTargets = matchingPairs.length ? matchingPairs.map(pair => pair.right) : ["البيان 1", "البيان 2", "البيان 3"];
  const regions = labelsFromDefinition(definition, ["regions", "hotspots"], Array.from({ length: 9 }, (_, index) => `المنطقة ${index + 1}`));
  const trueFalseChoices = labelsFromDefinition(definition, ["choices", "options", "values"], ["صحيح", "خطأ"]);
  const toggle = (choice: string) => setSelected(current => { const next = current.includes(choice) ? current.filter(item => item !== choice) : [...current, choice]; onResponse?.(next); return next; });
  const textInput = <input value={value} onChange={event => { setValue(event.target.value); onResponse?.(event.target.value); }} className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" placeholder={inputPrompt(definition, type)} />;
  if (type === "mcq" || type === "true_false") return <div className="mt-4 grid gap-2">{(type === "true_false" ? trueFalseChoices : choices).map(choice => <button key={choice} onClick={() => { setSelected([choice]); onResponse?.(choice); }} className={`rounded-xl border px-4 py-3 text-right text-sm font-bold ${selected[0] === choice ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}>{choice}</button>)}</div>;
  if (type === "multi_select") return <div className="mt-4 grid gap-2 sm:grid-cols-2">{choices.map(choice => <button key={choice} onClick={() => toggle(choice)} className={`rounded-xl border px-4 py-3 text-right text-sm font-bold ${selected.includes(choice) ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}>{choice}</button>)}</div>;
  if (type === "ordering") return <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"><p className="text-xs text-slate-500">رتّب البطاقات. استخدم السهمين للحركة دون الحاجة للفأرة.</p><div className="mt-3 space-y-2">{order.map((item, index) => <div key={item} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700"><span>{index + 1}. البطاقة {item}</span><span className="flex gap-1"><button onClick={() => { if (index === 0) return; const next = [...order]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setOrder(next); onResponse?.(next); }} disabled={index === 0} className="rounded border px-2 py-0.5 disabled:opacity-30" aria-label={`تحريك البطاقة ${item} للأعلى`}>↑</button><button onClick={() => { if (index === order.length - 1) return; const next = [...order]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; setOrder(next); onResponse?.(next); }} disabled={index === order.length - 1} className="rounded border px-2 py-0.5 disabled:opacity-30" aria-label={`تحريك البطاقة ${item} للأسفل`}>↓</button></span></div>)}</div></div>;
  if (type === "matching") return <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">{matchingTerms.map(term => <label key={term} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"><span>{term}</span><select value={matches[term] ?? ""} onChange={event => { const next = { ...matches, [term]: event.target.value }; setMatches(next); onResponse?.(Object.entries(next).map(([left, right]) => `${left}:${right}`)); }} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"><option value="">اختر المطابقة</option>{matchingTargets.map(target => <option key={target} value={target}>{target}</option>)}</select></label>)}</div>;
  if (type === "interactive_image") return <div className="mt-4 grid h-36 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">{regions.map((region, index) => <button key={region} onClick={() => onResponse?.(region)} className="rounded bg-blue-100/60 text-[10px] font-bold text-blue-800 transition hover:bg-blue-300" aria-label={`اختيار ${region}`}>{index + 1}</button>)}</div>;
  return textInput;
}

function labelsFromDefinition(definition: ExerciseDefinition | undefined, keys: string[], fallback: string[]) {
  const source = keys.map(key => definition?.[key]).find(Array.isArray);
  if (!Array.isArray(source) || !source.length) return fallback;
  const labels = source.map(entry => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      return [record.labelAr, record.textAr, record.value, record.id].find(value => typeof value === "string") as string | undefined;
    }
    return undefined;
  }).filter((label): label is string => Boolean(label));
  return labels.length ? labels : fallback;
}

function readPairs(definition: ExerciseDefinition | undefined) {
  const pairs = definition?.pairs;
  if (!Array.isArray(pairs)) return [] as Array<{ left: string; right: string }>;
  return pairs.map(entry => {
    if (!entry || typeof entry !== "object") return null;
    const record = entry as Record<string, unknown>;
    const left = [record.leftAr, record.left, record.termAr, record.term].find(value => typeof value === "string");
    const right = [record.rightAr, record.right, record.matchAr, record.match].find(value => typeof value === "string");
    return left && right ? { left, right } : null;
  }).filter((pair): pair is { left: string; right: string } => Boolean(pair));
}

function inputPrompt(definition: ExerciseDefinition | undefined, type: ExerciseKind) {
  const custom = definition && [definition.placeholderAr, definition.formatAr, definition.answerLabelAr].find(value => typeof value === "string");
  if (typeof custom === "string") return custom;
  if (type === "numeric") return "أدخل القيمة الرقمية";
  if (type === "math_expression") return "اكتب التعبير الرياضي";
  return "اكتب إجابتك";
}
