import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronRight, CircleCheckBig, Handshake, Landmark, LockKeyhole, MapPin, School } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";

type PartnerType = "support_school" | "distribution_office";

const initialLocation = { latitude: "36.7538", longitude: "3.0588" };

function optional(value: string) {
  return value.trim() || undefined;
}

function LocationPicker({ latitude, longitude, onChange }: { latitude: string; longitude: string; onChange: (location: { latitude: string; longitude: string }) => void }) {
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [showMap, setShowMap] = useState(false);

  const placeMarker = (map: google.maps.Map, location: google.maps.LatLngLiteral) => {
    if (marker.current) marker.current.map = null;
    marker.current = new google.maps.marker.AdvancedMarkerElement({ map, position: location, title: "الموقع التشغيلي للشريك" });
  };

  return <div className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-slate-950">الموقع التشغيلي</p><p className="mt-1 text-xs leading-5 text-slate-600">يمكنك إدخال الإحداثيات يدويًا. الخريطة اختيارية لتسهيل تحديد الموقع ولا تمنع إرسال الطلب عند عدم توفرها.</p></div><Button type="button" variant="outline" onClick={() => setShowMap(value => !value)} className="h-9 rounded-xl border-slate-200 bg-white text-xs font-black text-slate-700">{showMap ? "إخفاء الخريطة" : "تحديد على الخريطة"}</Button></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="خط العرض" value={latitude} onChange={value => onChange({ latitude: value, longitude })} inputMode="decimal" placeholder="مثال: 36.7538" /><Field label="خط الطول" value={longitude} onChange={value => onChange({ latitude, longitude: value })} inputMode="decimal" placeholder="مثال: 3.0588" /></div>
    {showMap && <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"><MapView initialCenter={{ lat: Number(latitude) || 36.7538, lng: Number(longitude) || 3.0588 }} initialZoom={11} className="h-[320px]" onMapReady={map => {
      const current = { lat: Number(latitude) || 36.7538, lng: Number(longitude) || 3.0588 };
      placeMarker(map, current);
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        const next = event.latLng?.toJSON();
        if (!next) return;
        onChange({ latitude: next.lat.toFixed(7), longitude: next.lng.toFixed(7) });
        placeMarker(map, next);
      });
    }} /><p className="border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-600">انقر على الخريطة لتحديث الإحداثيات. يبقى العنوان النصي هو المرجع التشغيلي المراجع يدويًا.</p></div>}
  </div>;
}

function Field({ label, value, onChange, required, type = "text", inputMode, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; inputMode?: "text" | "email" | "tel" | "decimal" | "numeric"; placeholder?: string }) {
  return <label className="grid gap-2 text-sm font-black text-slate-700"><span>{label}{required && <span className="text-rose-600"> *</span>}</span><input required={required} type={type} inputMode={inputMode} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none ring-violet-300 transition focus:ring-2" /></label>;
}

export default function PartnerApplication() {
  const [, setLocation] = useLocation();
  const [partnerType, setPartnerType] = useState<PartnerType>("support_school");
  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocationFields] = useState(initialLocation);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedStudentReach, setExpectedStudentReach] = useState("");
  const submit = trpc.partners.submitApplication.useMutation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit.mutate({
      partnerType,
      institutionName: institutionName.trim(),
      contactName: contactName.trim(),
      contactPosition: optional(contactPosition),
      phone: phone.trim(),
      whatsapp: optional(whatsapp),
      email: optional(email),
      wilaya: wilaya.trim(),
      commune: commune.trim(),
      address: address.trim(),
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      websiteUrl: optional(websiteUrl),
      facebookUrl: optional(facebookUrl),
      notes: optional(notes),
      expectedStudentReach: expectedStudentReach.trim() ? Number(expectedStudentReach) : undefined,
    });
  };

  if (submit.data) return <main dir="rtl" className="min-h-screen bg-[#080a16] px-5 py-8 text-white"><div className="mx-auto max-w-2xl rounded-[2rem] border border-emerald-300/20 bg-white/[0.05] p-7 shadow-2xl shadow-emerald-950/20 sm:p-12"><CircleCheckBig className="h-12 w-12 text-emerald-300" /><p className="mt-7 text-xs font-black tracking-[0.18em] text-emerald-200">وصل الطلب</p><h1 className="mt-3 text-3xl font-black">شكرًا، سُجّل طلب الشراكة.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">رقم المتابعة الداخلي: <strong className="text-white">#{submit.data.applicationId}</strong>. يراجع الفريق المعلومات تشغيليًا ثم يتواصل مع جهة الاتصال. لا يُنشئ هذا الطلب شراكة مفعّلة ولا التزامًا ماليًا أو تحصيلًا تلقائيًا.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => setLocation("/")} className="h-11 rounded-xl bg-white px-5 font-black text-slate-950 hover:bg-slate-100">العودة إلى المنصة</Button><Button variant="outline" onClick={() => window.location.reload()} className="h-11 rounded-xl border-white/20 text-white hover:bg-white/10">طلب جديد لجهة أخرى</Button></div></div></main>;

  return <main dir="rtl" className="min-h-screen bg-[#f6f7ff] text-slate-950"><header className="border-b border-slate-200/70 bg-white/90 backdrop-blur"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"><BrandMark /><Link href="/" className="inline-flex items-center gap-1 text-sm font-black text-slate-700 transition hover:text-violet-700"><ChevronRight className="h-4 w-4" />العودة للرئيسية</Link></div></header><div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-12"><aside className="lg:sticky lg:top-8 lg:h-fit"><Badge className="border-0 bg-violet-100 px-3 py-2 text-violet-800 hover:bg-violet-100">شبكة توزيع مدروسة</Badge><h1 className="mt-5 max-w-md text-4xl font-black leading-tight tracking-tight sm:text-5xl">قدّم طلب شراكة بوضوح.</h1><p className="mt-5 max-w-lg text-base leading-8 text-slate-600">نبحث عن مدارس دعم ومكاتب توزيع يمكنها مساعدة طلاب البكالوريا على معرفة المسار التعليمي المناسب. يبدأ التعاون بطلب مراجَع يدويًا، لا بصفقة تلقائية.</p><div className="mt-7 grid gap-3"><InfoCard icon={School} title="مدرسة دعم" text="جهة تربوية قريبة من الطلاب وتعمل ضمن محيط محلي واضح." /><InfoCard icon={Building2} title="مكتب توزيع" text="جهة توزيع أو تواصل منظمة تملك حضورًا محليًا موثقًا." /><InfoCard icon={LockKeyhole} title="خصوصية محكومة" text="لا يرى الطلب إلا فريق الإدارة المخوّل بمراجعته." /></div><div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-black">حدود واضحة من البداية</p><p className="mt-1">لا يوجد دفع، ولا تحصيل، ولا تحويل عمولة تلقائي عبر هذه الصفحة. أي تعاون أو مكافأة لاحقة يمر بمراجعة وتشغيل يدوي موثّق.</p></div></aside><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-42px_rgba(49,46,129,0.35)] sm:p-8"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-950 text-white"><Handshake className="h-5 w-5" /></div><div><p className="text-xs font-black tracking-[0.16em] text-violet-700">الخطوة الأولى</p><h2 className="mt-1 text-2xl font-black">بيانات الجهة والتواصل</h2><p className="mt-2 text-sm leading-6 text-slate-600">الحقول المعلمة مطلوبة حتى يتمكن الفريق من مراجعة الطلب والاتصال بكم.</p></div></div><form className="mt-7 grid gap-6" onSubmit={handleSubmit}><fieldset><legend className="text-sm font-black text-slate-800">نوع الشراكة</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><TypeOption active={partnerType === "support_school"} icon={School} title="مدرسة دعم" detail="أنشطة مرافقة وتواصل تربوي" onClick={() => setPartnerType("support_school")} /><TypeOption active={partnerType === "distribution_office"} icon={Landmark} title="مكتب توزيع" detail="تواصل وتوزيع منظم محليًا" onClick={() => setPartnerType("distribution_office")} /></div></fieldset><div className="grid gap-4 sm:grid-cols-2"><Field label="اسم المؤسسة أو الجهة" required value={institutionName} onChange={setInstitutionName} placeholder="مثال: مركز التميز" /><Field label="اسم مسؤول التواصل" required value={contactName} onChange={setContactName} placeholder="الاسم الكامل" /><Field label="الصفة داخل الجهة" value={contactPosition} onChange={setContactPosition} placeholder="مثال: مدير المركز" /><Field label="رقم الهاتف" required inputMode="tel" value={phone} onChange={setPhone} placeholder="05…" /><Field label="واتساب (اختياري)" inputMode="tel" value={whatsapp} onChange={setWhatsapp} placeholder="05…" /><Field label="البريد الإلكتروني (اختياري)" type="email" inputMode="email" value={email} onChange={setEmail} placeholder="name@example.com" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="الولاية" required value={wilaya} onChange={setWilaya} placeholder="مثال: الجزائر" /><Field label="البلدية" required value={commune} onChange={setCommune} placeholder="مثال: الجزائر الوسطى" /></div><label className="grid gap-2 text-sm font-black text-slate-700"><span>العنوان التشغيلي <span className="text-rose-600">*</span></span><textarea required value={address} onChange={event => setAddress(event.target.value)} placeholder="العنوان الذي يستطيع فريق الإدارة التحقق منه" className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-950 outline-none ring-violet-300 focus:ring-2" /></label><LocationPicker latitude={location.latitude} longitude={location.longitude} onChange={setLocationFields} /><details className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-black text-slate-800">معلومات إضافية اختيارية</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="الموقع الإلكتروني" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://…" /><Field label="صفحة فيسبوك" value={facebookUrl} onChange={setFacebookUrl} placeholder="https://…" /><Field label="تقدير عدد الطلاب الممكن الوصول إليهم" inputMode="numeric" value={expectedStudentReach} onChange={setExpectedStudentReach} placeholder="مثال: 120" /></div><label className="mt-4 grid gap-2 text-sm font-black text-slate-700"><span>ملاحظة للفريق</span><textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="أي تفاصيل تساعد على فهم طريقة عمل الجهة" className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-950 outline-none ring-violet-300 focus:ring-2" /></label></details><div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /><p className="text-sm leading-6 text-violet-950">بتقديمك الطلب، توافق على استخدام بيانات الجهة وبيانات التواصل لغرض مراجعة الشراكة والاتصال بها فقط. لا تنشر المنصة هذه البيانات في الصفحة العامة ولا تستخدمها لإنشاء تحصيل أو تحويل مالي.</p></div></div><Button disabled={submit.isPending} type="submit" className="h-12 rounded-xl bg-violet-950 text-base font-black hover:bg-violet-900">{submit.isPending ? "جارٍ تسجيل الطلب…" : "إرسال طلب الشراكة"}</Button>{submit.error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-800">تعذر تسجيل الطلب: {submit.error.message}</p>}</form></section></div></main>;
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof School; title: string; text: string }) { return <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800"><Icon className="h-4 w-4" /></div><div><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div></div>; }
function TypeOption({ active, icon: Icon, title, detail, onClick }: { active: boolean; icon: typeof School; title: string; detail: string; onClick: () => void }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-2xl border p-4 text-right transition focus:outline-none focus:ring-2 focus:ring-violet-400 ${active ? "border-violet-700 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:border-violet-300"}`}><div className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-violet-800 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4" /></div><div><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div></div></button>; }
