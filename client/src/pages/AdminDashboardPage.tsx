import React from "react";
import { BrandMark } from "@/components/BrandMark";
import { RoleGate } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { BellRing, BookOpenCheck, Building2, ChevronLeft, ClipboardCheck, Landmark, LogOut, Settings2 } from "lucide-react";
import { useLocation } from "wouter";

type AdminDestination = {
  title: string;
  description: string;
  href: string;
  icon: typeof Landmark;
  tone: string;
};

const destinations: AdminDestination[] = [
  {
    title: "إدارة التشغيل والاشتراكات",
    description: "الحزم، تعيينات الوصول، سجل العمليات، الشراكات، رصيد B، وإعدادات التشغيل اليدوية.",
    href: "/admin/subscriptions",
    icon: Landmark,
    tone: "bg-blue-50 text-blue-800 border-blue-100",
  },
  {
    title: "استوديو المحتوى",
    description: "المصادر، المسودات، الكتب المرفوعة، وسجل المحتوى المقيد بالمراجعة والنشر.",
    href: "/studio",
    icon: BookOpenCheck,
    tone: "bg-violet-50 text-violet-800 border-violet-100",
  },
  {
    title: "المراجعة الأكاديمية",
    description: "متابعة طابور المراجعة وقرارات المراجعين دون إنشاء مسار نشر تلقائي.",
    href: "/review",
    icon: ClipboardCheck,
    tone: "bg-emerald-50 text-emerald-800 border-emerald-100",
  },
  {
    title: "شبكة الشركاء",
    description: "طلبات الشراكة والتقارير والإعدادات اليدوية موجودة ضمن إدارة التشغيل المحمية.",
    href: "/admin/subscriptions",
    icon: Building2,
    tone: "bg-amber-50 text-amber-900 border-amber-100",
  },
];

export function AdminDashboardPage() {
  return <RoleGate allowed={["admin"]} title="لوحة المدير محمية"><AdminDashboardContent /></RoleGate>;
}

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();

  return <div className="min-h-screen bg-[#f6f8ff] text-slate-950" dir="rtl">
    <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-5 py-3 sm:px-8">
      <BrandMark />
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" onClick={() => setLocation("/")} className="rounded-xl border-slate-300 bg-white font-bold text-slate-900 hover:bg-slate-100">الواجهة العامة</Button>
        <Button variant="outline" aria-label="تسجيل الخروج من حساب المدير" isLoading={loading} loadingText="جارٍ الخروج…" onClick={() => void logout()} className="rounded-xl border-rose-200 bg-rose-50 font-bold text-rose-800 hover:bg-rose-100 hover:text-rose-900"><LogOut className="ml-2 h-4 w-4" />تسجيل الخروج</Button>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_88%_15%,rgba(37,99,235,.12),transparent_38%),linear-gradient(135deg,#ffffff,#eef4ff)] p-7 shadow-sm sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black text-blue-700">لوحة المدير</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">إدارة المنصة من نقطة واحدة.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">اختر مساحة العمل المناسبة لإدارة المحتوى، المراجعة، التشغيل، الشراكات، والخطط. كل قسم محمي بصلاحية المدير، ولا تفتح هذه اللوحة أي نشر أكاديمي أو دفع أو تحويل تلقائي.</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/85 p-4 text-sm shadow-sm">
            <p className="font-black text-slate-950">الحساب الحالي</p>
            <p className="mt-1 text-slate-600">{user?.name || "مدير المنصة"}</p>
            <p className="mt-1 text-xs font-bold text-blue-700">دور المدير مفعّل</p>
          </div>
        </div>
      </section>

      <section aria-label="مداخل لوحة المدير" className="mt-7 grid gap-4 md:grid-cols-2">
        {destinations.map(destination => {
          const Icon = destination.icon;
          return <button type="button" key={destination.title} onClick={() => setLocation(destination.href)} className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <div className="flex items-start justify-between gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${destination.tone}`}><Icon className="h-5 w-5" /></div>
              <ChevronLeft className="mt-1 h-5 w-5 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-blue-700" />
            </div>
            <h2 className="mt-5 text-lg font-black text-slate-950">{destination.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{destination.description}</p>
          </button>;
        })}
      </section>

      <section aria-label="ملاحظات تشغيلية" className="admin-info-notes mt-7 grid gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2">
        <aside role="note" className="admin-info-note"><BellRing aria-hidden="true" className="admin-info-icon text-cyan-700" /><div><p className="admin-info-label">معلومة تشغيلية</p><h2 className="font-black text-slate-950">إشعارات المشتركين</h2><p className="mt-1 text-sm leading-6 text-slate-600">إرسال التحديثات يدويًا للمستخدمين الذين فعّلوا الإشعارات فقط، من قسم إدارة التشغيل.</p></div></aside>
        <aside role="note" className="admin-info-note"><Settings2 aria-hidden="true" className="admin-info-icon text-slate-700" /><div><p className="admin-info-label">معلومة تشغيلية</p><h2 className="font-black text-slate-950">مبدأ التشغيل</h2><p className="mt-1 text-sm leading-6 text-slate-600">كل إجراء حساس يظل يدويًا ومدققًا: لا تحصيل أو شراء رصيد B أو تحويل تلقائي من هذه اللوحة.</p></div></aside>
      </section>
    </main>
  </div>;
}
