import React, { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [openedManually, setOpenedManually] = useState(false);

  useEffect(() => {
    setIos(isIosDevice());
    setInstalled(isStandalone());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };
    const handleInstallRequest = () => {
      setDismissed(false);
      setOpenedManually(true);
      if (isIosDevice()) setShowIosGuide(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("rafiq:install-app", handleInstallRequest);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("rafiq:install-app", handleInstallRequest);
    };
  }, []);

  const handleInstall = async () => {
    if (ios) {
      setShowIosGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed || dismissed || (!ios && !deferredPrompt && !openedManually)) return null;

  return (
    <aside dir="rtl" aria-label="تثبيت تطبيق رفيق الباك" className="fixed inset-x-3 bottom-3 z-[80] mx-auto w-auto max-w-lg rounded-2xl border border-cyan-300/25 bg-slate-950/95 p-3 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-md sm:bottom-5 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Smartphone className="h-5 w-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">ثبّت رفيق الباك كتطبيق</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{ios ? "أضفه إلى الشاشة الرئيسية لفتحه كتطبيق مستقل." : deferredPrompt ? "افتحه سريعًا من شاشة جهازك أو من سطح المكتب." : "يظهر أمر التثبيت من شريط عنوان Chrome أو Edge عند اكتمال جاهزية المتصفح."}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" disabled={!ios && !deferredPrompt} onClick={() => void handleInstall()} className="h-9 rounded-xl bg-cyan-300 px-3 text-xs font-black text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
              {ios ? <Share2 className="ms-1 h-4 w-4" aria-hidden="true" /> : <Download className="ms-1 h-4 w-4" aria-hidden="true" />}
              {ios ? "طريقة التثبيت على iPhone" : "تثبيت التطبيق"}
            </Button>
            <button type="button" onClick={() => setDismissed(true)} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">ليس الآن</button>
          </div>
        </div>
        <button type="button" onClick={() => setDismissed(true)} aria-label="إخفاء تلميح التثبيت" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>

      {showIosGuide && (
        <div role="dialog" aria-modal="true" aria-label="خطوات تثبيت رفيق الباك على iPhone" className="mt-4 rounded-xl border border-cyan-300/20 bg-white/8 p-3 text-sm">
          <p className="font-black text-cyan-200">ثلاث خطوات في Safari</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 leading-6 text-slate-200">
            <li>اضغط زر المشاركة <Share2 className="mx-1 inline h-3.5 w-3.5" aria-hidden="true" /> في Safari.</li>
            <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
            <li>أكد الإضافة، ثم افتح «رفيق الباك» من شاشة iPhone.</li>
          </ol>
        </div>
      )}
    </aside>
  );
}
