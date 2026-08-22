import { BrandMark } from "@/components/BrandMark";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import QRCode from "qrcode";
import { Building2, Copy, ExternalLink, Link2, QrCode, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function PartnerDashboardContent() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.partners.me.useQuery();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const primaryCode = data?.referralCodes.find(code => code.isActive) ?? data?.referralCodes[0];
  const referralUrl = useMemo(() => primaryCode ? `${window.location.origin}${primaryCode.referralPath}` : "", [primaryCode]);

  useEffect(() => {
    let active = true;
    if (!referralUrl) { setQrDataUrl(null); return; }
    QRCode.toDataURL(referralUrl, { width: 280, margin: 1, errorCorrectionLevel: "M", color: { dark: "#17152b", light: "#ffffff" } }).then(value => { if (active) setQrDataUrl(value); }).catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [referralUrl]);

  const copyReferralUrl = async () => {
    if (!referralUrl) return;
    try { await navigator.clipboard.writeText(referralUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  if (isLoading) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#080a16] p-5 text-slate-200"><p className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-black">جارٍ تجهيز مساحة الشريك…</p></main>;
  if (error || !data) return <main dir="rtl" className="grid min-h-screen place-items-center bg-[#080a16] p-5 text-slate-200"><div className="max-w-lg rounded-3xl border border-amber-300/20 bg-amber-300/[0.08] p-7 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-amber-200" /><h1 className="mt-4 text-xl font-black">الحساب لم يرتبط بسجل شريك فعّال بعد.</h1><p className="mt-3 text-sm leading-7 text-slate-300">يستكمل مدير المنصة ربط الحساب بعد مراجعة الشراكة. لا تحاول هذه الصفحة إنشاء أي وصول أو استحقاق ذاتيًا.</p><Button onClick={() => setLocation("/")} className="mt-6 rounded-xl bg-white text-slate-950 hover:bg-slate-100">العودة للرئيسية</Button></div></main>;

  return <main dir="rtl" className="min-h-screen bg-[#080a16] text-white"><header className="border-b border-white/10 bg-[#0d1020]/90 backdrop-blur"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"><BrandMark /><Button variant="outline" onClick={() => setLocation("/")} className="rounded-xl border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white">العودة للرئيسية</Button></div></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12"><section className="overflow-hidden rounded-[2rem] border border-violet-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(139,92,246,0.22),transparent_35%),#11152a] p-6 sm:p-9"><div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><Badge className="border-0 bg-violet-300/15 text-violet-100 hover:bg-violet-300/15">مساحة الشريك</Badge><h1 className="mt-4 text-3xl font-black sm:text-4xl">{data.profile.tradeName || data.profile.institutionName}</h1><p className="mt-3 text-sm leading-7 text-slate-300">{data.profile.partnerType === "support_school" ? "مدرسة دعم" : "مكتب توزيع"} · {data.profile.wilaya}، {data.profile.commune}</p></div><div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-100"><p className="font-black">الإحالة {data.profile.referralActive ? "مفعّلة" : "غير مفعّلة"}</p><p className="mt-1 text-xs text-emerald-100/80">الكود: <span dir="ltr">{data.profile.partnerCode}</span></p></div></div></section><div className="mt-6 grid gap-4 md:grid-cols-3"><Metric icon={Link2} label="زيارات/التقاطات أولية" value={String(data.referralSummary.captured ?? 0)} /><Metric icon={UsersRound} label="إحالات مرتبطة بحساب" value={String(data.referralSummary.registered ?? 0)} /><Metric icon={Building2} label="تحويلات مؤهلة" value={String(data.referralSummary.eligible ?? 0)} /></div><section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 sm:p-7"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/15 text-violet-200"><Link2 className="h-5 w-5" /></div><div><p className="font-black">رابط الإحالة الأساسي</p><p className="mt-1 text-sm leading-6 text-slate-300">يُسجل الرابط أول إحالة صالحة فقط. لا يمنح الطالب اشتراكًا أو خصمًا أو عمولة تلقائية.</p></div></div>{primaryCode ? <><div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black text-violet-200">رمز الإحالة</p><p dir="ltr" className="mt-2 break-all font-mono text-base font-black tracking-wide text-white">{primaryCode.code}</p><p dir="ltr" className="mt-4 break-all text-xs leading-6 text-slate-300">{referralUrl}</p></div><div className="mt-4 flex flex-wrap gap-3"><Button onClick={copyReferralUrl} className="h-11 rounded-xl bg-violet-500 px-5 font-black hover:bg-violet-400"><Copy className="ml-2 h-4 w-4" />{copied ? "تم النسخ" : "نسخ الرابط"}</Button><Button variant="outline" onClick={() => window.open(referralUrl, "_blank", "noopener,noreferrer")} className="h-11 rounded-xl border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"><ExternalLink className="ml-2 h-4 w-4" />فتح الرابط</Button></div></> : <p className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] p-4 text-sm text-amber-100">لا يوجد رمز إحالة نشط بعد. راجع الإدارة لإتمام التهيئة.</p>}</div><aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 text-center sm:p-7"><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white"><QrCode className="h-5 w-5" /></div><h2 className="mt-4 font-black">QR للرابط نفسه</h2><p className="mt-2 text-sm leading-6 text-slate-300">يُنشأ محليًا داخل المتصفح من رابط الإحالة الظاهر، ويمكن مسحه أو تنزيله من المتصفح.</p>{qrDataUrl ? <img src={qrDataUrl} alt="رمز QR لرابط إحالة الشريك" className="mx-auto mt-5 w-56 rounded-2xl bg-white p-3" /> : <div className="mx-auto mt-5 grid h-56 w-56 place-items-center rounded-2xl border border-dashed border-white/15 text-sm text-slate-400">QR غير متاح الآن</div>}</aside></section><section className="mt-6 rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.06] p-5 sm:p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><p className="font-black text-amber-100">الماليات محكومة وموقوفة هنا</p><p className="mt-2 text-sm leading-7 text-amber-50/85">{data.finance.messageAr} تظهر الأعداد أعلاه كإحصاءات إحالة فقط، ولا تمثل مبيعات أو إيرادات أو مستحقات.</p></div></div></section></div></main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Link2; label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5"><Icon className="h-5 w-5 text-violet-200" /><p className="mt-5 text-xs font-bold text-slate-300">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>; }

export default function PartnerDashboard() { return <RoleGate allowed={["partner"]} title="مساحة الشريك محمية"><PartnerDashboardContent /></RoleGate>; }
