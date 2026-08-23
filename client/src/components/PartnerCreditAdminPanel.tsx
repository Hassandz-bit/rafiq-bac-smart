import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { MinusCircle, PlusCircle, ShieldCheck, WalletCards } from "lucide-react";

function newIdempotencyKey() {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().replaceAll("-", "") : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `b-credit-${suffix}`;
}

export function PartnerCreditAdminPanel() {
  const [partnerId, setPartnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"credit" | "debit">("credit");
  const [reasonAr, setReasonAr] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const mutation = trpc.administration.recordPartnerCreditEntry.useMutation({
    onSuccess: () => {
      setAmount("");
      setReasonAr("");
      setIdempotencyKey(newIdempotencyKey());
    },
  });
  const numericPartnerId = Number(partnerId);
  const numericAmount = Number(amount);
  const valid = Number.isInteger(numericPartnerId) && numericPartnerId > 0 && Number.isInteger(numericAmount) && numericAmount > 0 && reasonAr.trim().length >= 5 && /^[A-Za-z0-9:_-]{12,120}$/.test(idempotencyKey);

  return <section className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4" aria-labelledby="partner-credit-admin-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><WalletCards className="h-5 w-5" /></div><div><h3 id="partner-credit-admin-title" className="font-black text-slate-950">دفتر رصيد B التشغيلي</h3><p className="mt-1 text-xs leading-5 text-slate-600">عملية إدارية موثقة فقط. لا تبيع رصيدًا ولا تحصّل أموالًا ولا تمنح وصولًا أو اشتراكًا.</p></div></div><Badge className="border-0 bg-violet-100 text-violet-900 hover:bg-violet-100">لا شراء</Badge></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><input inputMode="numeric" value={partnerId} onChange={event => setPartnerId(event.target.value)} placeholder="معرّف الشريك" className="h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm" /><select value={entryType} onChange={event => setEntryType(event.target.value as "credit" | "debit")} className="h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm"><option value="credit">إضافة رصيد</option><option value="debit">خصم رصيد</option></select><input inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} placeholder="عدد الوحدات" className="h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm" /><input value={reasonAr} onChange={event => setReasonAr(event.target.value)} placeholder="سبب تشغيلي موثق" className="h-10 rounded-xl border border-violet-200 bg-white px-3 text-sm" /><Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate({ partnerId: numericPartnerId, entryType, amount: numericAmount, reasonAr: reasonAr.trim(), idempotencyKey })} className="h-10 rounded-xl bg-violet-600 font-black hover:bg-violet-500">{entryType === "credit" ? <PlusCircle className="ml-2 h-4 w-4" /> : <MinusCircle className="ml-2 h-4 w-4" />}{mutation.isPending ? "جارٍ التسجيل…" : entryType === "credit" ? "إضافة موثقة" : "خصم موثق"}</Button></div>
    <p className="mt-2 text-[11px] text-slate-500">مفتاح منع التكرار: <span dir="ltr" className="font-mono">{idempotencyKey}</span></p>
    {mutation.error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">تعذر التسجيل: {mutation.error.message}</p>}
    {mutation.data && <p className="mt-3 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><ShieldCheck className="h-4 w-4 shrink-0" />سُجل القيد #{mutation.data.entryId}، والرصيد المتاح الآن {mutation.data.availableCredits}. لم يبدأ دفع ولم يتغير أي استحقاق.</p>}
  </section>;
}
