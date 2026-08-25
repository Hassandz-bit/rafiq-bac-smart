import { Sparkles } from "lucide-react";
import { uxCopy } from "@/content/uxCopy";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none" aria-label={uxCopy.brand.name}>
      <div className="brand-orbit grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg shadow-blue-900/20">
        <Sparkles className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {!compact && (
        <div className="hidden leading-none sm:block">
          <p className="text-base font-black tracking-tight text-slate-950">{uxCopy.brand.name}</p>
          <p className="mt-1 text-[10px] font-bold tracking-[0.08em] text-blue-700">بكالوريا الجزائر · 2027</p>
        </div>
      )}
    </div>
  );
}
