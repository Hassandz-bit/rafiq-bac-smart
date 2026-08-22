import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, MapPinned, ShieldCheck } from "lucide-react";
import React from "react";

function CountChips({ title, rows }: { title: string; rows: Array<{ status: string; count: number; amountDzd?: number }> }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-black text-slate-800">{title}</p><div className="mt-3 flex flex-wrap gap-2">{rows.length ? rows.map(row => <Badge key={row.status} variant="outline" className="border-slate-200 bg-white text-slate-700">{row.status}: {row.count}{row.amountDzd !== undefined ? ` · ${row.amountDzd.toLocaleString("ar-DZ")} دج` : ""}</Badge>) : <span className="text-xs text-slate-500">لا توجد سجلات فعلية.</span>}</div></div>;
}

export function PartnerOperationsPanel() {
  const { data, isLoading } = trpc.administration.partnerOperationsReport.useQuery();
  const territory = React.useMemo(() => {
    if (!data) return [] as Array<{ wilaya: string; count: number }>;
    const counts = new Map<string, number>();
    data.mapPartners.forEach(partner => counts.set(partner.wilaya, (counts.get(partner.wilaya) ?? 0) + 1));
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, "ar")).map(([wilaya, count]) => ({ wilaya, count }));
  }, [data]);
  const onMapReady = (map: google.maps.Map) => {
    if (!data?.mapPartners.length || !window.google?.maps.marker) return;
    const bounds = new window.google.maps.LatLngBounds();
    data.mapPartners.forEach(partner => { const position = { lat: Number(partner.latitude), lng: Number(partner.longitude) }; new window.google.maps.marker.AdvancedMarkerElement({ map, position, title: `${partner.label || partner.institutionName} — ${partner.wilaya}` }); bounds.extend(position); });
    if (data.mapPartners.length > 1) map.fitBounds(bounds, 48);
  };
  const exportReport = () => {
    if (!data) return;
    const payload = { exportedAt: new Date().toISOString(), territories: territory, referrals: data.referrals, commissions: data.commissions, payouts: data.payouts, partnersWithVerifiedCoordinates: data.mapPartners.map(partner => ({ partnerId: partner.id, wilaya: partner.wilaya, commune: partner.commune })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "partner-operations-report.json"; anchor.click(); URL.revokeObjectURL(url);
  };
  return <section className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><MapPinned className="h-5 w-5" /></div><div><p className="font-black text-slate-950">خريطة وتقارير تشغيل الشركاء</p><p className="mt-1 text-sm leading-6 text-slate-600">تعتمد الأرقام على سجلات الشراكة الموجودة فقط؛ لا تعني إيرادًا ولا تحصيلاً ولا تحويلًا.</p></div></div><div className="flex items-center gap-2"><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">بيانات فعلية</Badge>{data ? <Button type="button" variant="outline" onClick={exportReport} className="h-9 border-emerald-200 text-emerald-800"><Download className="ml-2 h-4 w-4" />تصدير التقرير</Button> : null}</div></div>{isLoading ? <p className="mt-5 text-sm text-slate-500">جارٍ تحميل التقرير…</p> : data ? <><div className="mt-5 grid gap-3 md:grid-cols-3"><CountChips title="الإحالات" rows={data.referrals} /><CountChips title="سجل العمولات" rows={data.commissions} /><CountChips title="طلبات الصرف" rows={data.payouts} /></div><div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-800">التغطية الإقليمية للشركاء ذوي الموقع المثبت</p><div className="mt-3 flex flex-wrap gap-2">{territory.length ? territory.map(row => <Badge key={row.wilaya} variant="outline" className="border-slate-200 bg-white text-slate-700">{row.wilaya}: {row.count}</Badge>) : <span className="text-xs text-slate-500">لا توجد تغطية موقع مؤكدة بعد.</span>}</div></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">{data.mapPartners.length ? <MapView className="h-[360px]" initialCenter={{ lat: Number(data.mapPartners[0].latitude), lng: Number(data.mapPartners[0].longitude) }} initialZoom={7} onMapReady={onMapReady} /> : <div className="grid h-48 place-items-center bg-slate-50 p-5 text-center text-sm text-slate-500">لا توجد مواقع شركاء نشطة بإحداثيات مثبتة بعد؛ ستظهر الخريطة بعد مراجعة بيانات الموقع.</div>}</div><p className="mt-4 flex gap-2 text-xs leading-5 text-emerald-900"><ShieldCheck className="h-4 w-4 shrink-0" />المواقع معروضة للمدير فقط، ولا يعرض التصدير أي وجهة صرف أو بيانات مالية حساسة أو ملفات طلاب.</p></> : <p className="mt-5 text-sm text-rose-700">تعذر تحميل تقرير العمليات.</p>}</section>;
}
