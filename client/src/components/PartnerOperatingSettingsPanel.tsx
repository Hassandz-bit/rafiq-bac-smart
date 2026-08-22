import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Settings2, ShieldCheck } from "lucide-react";

const payoutMethods = [
  { value: "ccp", label: "CCP" },
  { value: "baridimob", label: "BaridiMob" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "other", label: "أخرى" },
] as const;

export function PartnerOperatingSettingsPanel() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.administration.partnerOperatingSettings.useQuery();
  const [verificationDays, setVerificationDays] = useState("7");
  const [minimumPayoutDzd, setMinimumPayoutDzd] = useState("2000");
  const [methods, setMethods] = useState<string[]>(["ccp", "baridimob", "bank_transfer", "other"]);
  const save = trpc.administration.savePartnerOperatingSettings.useMutation({ onSuccess: () => void utils.administration.partnerOperatingSettings.invalidate() });

  useEffect(() => {
    if (!settings) return;
    setVerificationDays(String(settings.verificationDays));
    setMinimumPayoutDzd(String(settings.minimumPayoutDzd));
    setMethods(settings.payoutMethods);
  }, [settings]);

  const valid = Number.isInteger(Number(verificationDays)) && Number(verificationDays) >= 0 && Number(verificationDays) <= 365 && Number.isInteger(Number(minimumPayoutDzd)) && Number(minimumPayoutDzd) >= 0 && methods.length > 0;
  const toggleMethod = (method: string) => setMethods(current => current.includes(method) ? current.filter(item => item !== method) : [...current, method]);

  return <section className="mt-6 rounded-[1.5rem] border border-violet-100 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Settings2 className="h-5 w-5" /></div><div><p className="font-black text-slate-950">إعدادات تشغيل الشركاء</p><p className="mt-1 text-sm leading-6 text-slate-600">تضبط المراجعة وطلبات الصرف اليدوية فقط. لا تنشئ تحصيلًا ولا أمر تحويل.</p></div></div><Badge className="border-0 bg-violet-100 text-violet-800 hover:bg-violet-100">تحكم إداري</Badge></div>{isLoading ? <p className="mt-4 text-sm text-slate-500">جارٍ تحميل الإعدادات…</p> : <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]"><label className="grid gap-1 text-xs font-bold text-slate-700">فترة التحقق (يوم)<input value={verificationDays} onChange={event => setVerificationDays(event.target.value)} inputMode="numeric" className="h-10 rounded-lg border border-violet-200 bg-violet-50/30 px-3 text-sm text-slate-900" /></label><label className="grid gap-1 text-xs font-bold text-slate-700">الحد الأدنى للصرف (دج)<input value={minimumPayoutDzd} onChange={event => setMinimumPayoutDzd(event.target.value)} inputMode="numeric" className="h-10 rounded-lg border border-violet-200 bg-violet-50/30 px-3 text-sm text-slate-900" /></label><fieldset className="grid gap-1"><legend className="text-xs font-bold text-slate-700">طرق الصرف اليدوية</legend><div className="flex flex-wrap gap-2">{payoutMethods.map(method => <label key={method.value} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50/40 px-2.5 py-2 text-xs text-slate-700"><input type="checkbox" checked={methods.includes(method.value)} onChange={() => toggleMethod(method.value)} />{method.label}</label>)}</div></fieldset><div className="flex items-end"><Button disabled={!valid || save.isPending} onClick={() => save.mutate({ verificationDays: Number(verificationDays), minimumPayoutDzd: Number(minimumPayoutDzd), payoutMethods: methods as (typeof payoutMethods)[number]["value"][] })}>{save.isPending ? "حفظ…" : "حفظ الإعدادات"}</Button></div></div>}{save.error && <p role="alert" className="mt-3 text-sm font-bold text-rose-700">تعذر الحفظ: {save.error.message}</p>}<p className="mt-4 flex gap-2 rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-xs leading-5 text-violet-950"><ShieldCheck className="h-4 w-4 shrink-0" />تسجل كل عملية صرف يدوي بمرجع خارجي بعد المراجعة؛ لا يمكن لهذه الإعدادات تفعيل تحويل آلي.</p></section>;
}
