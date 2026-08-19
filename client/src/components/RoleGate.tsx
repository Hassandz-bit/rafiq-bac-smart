import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

type Role = "admin" | "content_editor" | "academic_reviewer" | "student";

export function RoleGate({ allowed, children, title = "هذه المساحة محمية" }: { allowed: Role[]; children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-sm font-bold text-slate-500">يتم تجهيز مساحتك…</div>;
  }

  if (!user) {
    return (
      <section className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-5 text-center" dir="rtl">
        <div className="soft-panel w-full p-8 sm:p-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-950 text-white"><LockKeyhole className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">سجّل الدخول للوصول إلى بياناتك ومساراتك المخصصة ضمن صلاحيات حسابك.</p>
          <Button onClick={() => startLogin()} className="mt-7 h-11 rounded-xl bg-blue-700 px-6 font-bold hover:bg-blue-800">تسجيل الدخول</Button>
        </div>
      </section>
    );
  }

  if (!allowed.includes(user.role as Role)) {
    return (
      <section className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-5 text-center" dir="rtl">
        <div className="soft-panel w-full p-8 sm:p-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><ShieldCheck className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black text-slate-950">لا تملك صلاحية الدخول</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">تتطلب هذه المساحة دورًا مختلفًا. يمكنك الرجوع إلى لوحة التعلم أو التواصل مع إدارة المنصة لتحديث الصلاحية.</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
