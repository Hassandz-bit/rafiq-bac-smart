import { Sparkles } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="brand-orbit grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg shadow-blue-900/20">
        <Sparkles className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="text-base font-black tracking-tight text-slate-950">رفيق الباك</p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.18em] text-blue-700">الذكي · 2027</p>
        </div>
      )}
    </div>
  );
}
