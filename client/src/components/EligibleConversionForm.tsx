import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export function EligibleConversionForm() {
  const utils = trpc.useUtils();
  const [referralId, setReferralId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [grossAmountDzd, setGrossAmountDzd] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const save = trpc.administration.recordEligiblePartnerConversion.useMutation({ onSuccess: () => { setNotesAr(""); void utils.administration.partnerFinanceQueue.invalidate(); } });
  const valid = /^\d+$/.test(referralId) && /^\d+$/.test(assignmentId) && /^\d+$/.test(grossAmountDzd) && notesAr.trim().length >= 10;
  return <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/55 p-4"><p className="font-black text-indigo-950">تسجيل تحويل مؤهل يدويًا</p><p className="mt-1 text-xs leading-5 text-indigo-900">لا يغيّر هذا النموذج تعيين الوصول، ولا ينشئ طلب دفع. يتحقق الخادم من تطابق الطالب بين الإحالة المقفلة وتعيين الوصول النشط.</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><input value={referralId} onChange={event => setReferralId(event.target.value)} placeholder="معرف الإحالة" inputMode="numeric" className="h-9 rounded-lg border border-indigo-200 bg-white px-2 text-xs" /><input value={assignmentId} onChange={event => setAssignmentId(event.target.value)} placeholder="معرف تعيين الوصول" inputMode="numeric" className="h-9 rounded-lg border border-indigo-200 bg-white px-2 text-xs" /><input value={grossAmountDzd} onChange={event => setGrossAmountDzd(event.target.value)} placeholder="القيمة الإجمالية دج" inputMode="numeric" className="h-9 rounded-lg border border-indigo-200 bg-white px-2 text-xs" /></div><textarea value={notesAr} onChange={event => setNotesAr(event.target.value)} placeholder="ملاحظة تحقق موثقة (10 أحرف على الأقل)" className="mt-2 min-h-16 w-full rounded-lg border border-indigo-200 bg-white p-2 text-xs" /><div className="mt-2 flex flex-wrap items-center gap-2"><Button size="sm" disabled={!valid || save.isPending} onClick={() => save.mutate({ referralId: Number(referralId), studentPlanAssignmentId: Number(assignmentId), grossAmountDzd: Number(grossAmountDzd), notesAr: notesAr.trim() })}>{save.isPending ? "جارٍ التسجيل…" : "تسجيل السجل المؤهل"}</Button>{save.data && <p className="text-xs font-bold text-emerald-700">سُجلت عمولة معلقة #{save.data.commissionId} بقيمة {save.data.commissionAmountDzd.toLocaleString("ar-DZ")} دج؛ لم يبدأ أي تحويل.</p>}{save.error && <p role="alert" className="text-xs font-bold text-rose-700">تعذر التسجيل: {save.error.message}</p>}</div></div>;
}
