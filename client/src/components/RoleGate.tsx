import { startLogin } from "@/const";
import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { uxCopy } from "@/content/uxCopy";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

type Role = "admin" | "content_editor" | "academic_reviewer" | "student" | "partner";

export function RoleGate({ allowed, children, title = "هذه المساحة محمية" }: { allowed: Role[]; children: React.ReactNode; title?: string }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-sm font-bold text-slate-500">نجهّز رحلتك…</div>;
  }

  if (!user) {
    return (
      <section className="flex min-h-[65vh] w-screen max-w-[100vw] justify-center overflow-x-hidden px-5 text-center" dir="rtl">
        <div className="soft-panel box-border w-full min-w-0 max-w-xl self-center !bg-white p-8 text-slate-950 sm:p-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-950 text-white"><LockKeyhole className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">{uxCopy.system.signInDescription}</p>
          <Button onClick={() => startLogin()} className="mt-7 h-11 rounded-xl bg-blue-700 px-6 font-bold hover:bg-blue-800">{uxCopy.system.signInCta}</Button>
        </div>
      </section>
    );
  }

  if (!allowed.includes(user.role as Role)) {
    const accountRoute = user.role === "admin" ? "/admin" : user.role === "partner" ? "/partner" : user.role === "content_editor" ? "/editor" : user.role === "academic_reviewer" ? "/review" : "/app";
    return (
      <section className="flex min-h-[65vh] w-screen max-w-[100vw] justify-center overflow-x-hidden px-5 text-center" dir="rtl">
        <div className="soft-panel box-border w-full min-w-0 max-w-xl self-center !bg-white p-8 text-slate-950 sm:p-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700"><ShieldCheck className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black text-slate-950">هذه المساحة ليست متاحة لحسابك الآن.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600">تتطلب هذه المساحة دورًا مختلفًا. يمكنك العودة إلى رحلتك أو التواصل مع إدارة المنصة لتحديث الصلاحية.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3"><Button variant="outline" onClick={() => setLocation("/")} className="h-11 rounded-xl">العودة للرئيسية</Button><Button onClick={() => setLocation(accountRoute)} className="h-11 rounded-xl bg-blue-700 hover:bg-blue-800">فتح مساحتي المتاحة</Button></div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
