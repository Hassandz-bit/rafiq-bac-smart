import React from "react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck } from "lucide-react";

export function PartnerAuditPanel() {
  const { data, isLoading } = trpc.administration.partnerAuditLog.useQuery({ limit: 50 });
  return <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ClipboardCheck className="h-5 w-5" /></div><div><p className="font-black text-slate-950">سجل تدقيق شبكة الشركاء</p><p className="mt-1 text-sm leading-6 text-slate-600">سجل قراءة فقط لانتقالات الطلبات والعمولات والصرف. لا يعرض وجهات مشفرة أو معلومات شخصية زائدة.</p></div></div><Badge variant="outline" className="border-slate-200 text-slate-600">Read-only</Badge></div>{isLoading ? <p className="mt-5 text-sm text-slate-500">جارٍ تحميل السجل…</p> : data?.length ? <div className="mt-5 grid gap-2">{data.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><div><p className="text-sm font-black text-slate-900">{item.action} · {item.partnerName || item.partnerInstitution || "شبكة الشركاء"}</p><p className="mt-1 text-xs text-slate-600">{item.entityType} #{item.entityId ?? "—"} · منفذ القرار #{item.actorUserId ?? "—"}{item.noteAr ? ` · ${item.noteAr}` : ""}</p></div><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("ar-DZ")}</time></div>)}</div> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">لا توجد انتقالات مدققة بعد. سيظهر السجل عند تنفيذ إجراء شراكة فعلي.</p>}</section>;
}
