export function ScientificCanvas() {
  return (
    <div className="scientific-canvas learning-orbit relative min-h-[340px] overflow-hidden rounded-[2rem] border border-white/15 bg-[#071426] shadow-[0_34px_80px_rgba(0,0,0,.38)] sm:min-h-[440px]" aria-label="تصور بصري لمسار الفهم" aria-describedby="learning-path-annotation">
      <div className="learning-grid absolute inset-0" />
      <div className="learning-glow learning-glow-cyan" /><div className="learning-glow learning-glow-violet" /><div className="learning-orbit-ring learning-orbit-ring-a" /><div className="learning-orbit-ring learning-orbit-ring-b" />
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-[10px] font-black text-cyan-100 backdrop-blur"><span className="live-dot" />مسار تعلّم حي</div>
      <div className="absolute left-5 top-5 z-10 text-left"><p className="text-[10px] font-black tracking-[.15em] text-slate-400">LEARNING PATH</p><p className="mt-1 text-xs font-black text-white">من الفكرة إلى الإتقان</p></div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 680 480" fill="none" aria-hidden="true">
        <path className="learning-path-shadow" d="M82 364C150 338 158 180 262 196C365 211 333 360 444 317C540 280 511 132 608 118" strokeWidth="13" strokeLinecap="round" />
        <path className="learning-path-line" d="M82 364C150 338 158 180 262 196C365 211 333 360 444 317C540 280 511 132 608 118" stroke="url(#learningFlow)" strokeWidth="5" strokeLinecap="round" />
        <path className="learning-path-dash" d="M82 364C150 338 158 180 262 196C365 211 333 360 444 317C540 280 511 132 608 118" stroke="rgba(255,255,255,.42)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 18" />
        <defs><linearGradient id="learningFlow" x1="82" y1="364" x2="608" y2="118" gradientUnits="userSpaceOnUse"><stop stopColor="#ff8a75"/><stop offset=".42" stopColor="#38d9d0"/><stop offset=".72" stopColor="#9485ff"/><stop offset="1" stopColor="#83e6ad"/></linearGradient></defs>
      </svg>
      <CanvasNode className="left-[8%] top-[68%]" text="ارَ الفكرة" detail="السياق أولًا" tone="coral" step="01" />
      <CanvasNode className="left-[29%] top-[26%]" text="افهم الرابط" detail="صل المفاهيم" tone="blue" step="02" />
      <CanvasNode className="left-[50%] top-[58%]" text="جرّب بنفسك" detail="طبّق بوضوح" tone="violet" step="03" />
      <CanvasNode className="right-[8%] top-[15%]" text="ثبّت الفكرة" detail="راجع في وقتها" tone="mint" step="04" />
      <div className="learning-status absolute bottom-5 right-5 left-5 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 backdrop-blur"><div><p className="text-[10px] font-bold text-slate-400">خطوتك التالية</p><p className="mt-0.5 text-xs font-black text-white">ابدأ من الفكرة، لا من الحفظ.</p></div><span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-300 text-xs font-black text-slate-950">→</span></div>
      <p id="learning-path-annotation" className="sr-only">يمثل هذا الرسم مسار تعلم أصليًا: تبدأ بالصورة الكبيرة، ثم الفهم، فالتطبيق، وصولًا إلى الإتقان. الخط المتصل يوضح الانتقال التدريجي، والخط المتقطع يذكّر بأن المسار قد يتضمن مراجعة ومحاولات متعددة.</p>
    </div>
  );
}

function CanvasNode({ className, text, detail, tone, step }: { className: string; text: string; detail: string; tone: "coral" | "blue" | "violet" | "mint"; step: string }) {
  const tones = { coral: "bg-[#ff8069] text-white", blue: "bg-[#70d6ee] text-blue-950", violet: "bg-[#9aa7ff] text-blue-950", mint: "bg-[#7be0a5] text-emerald-950" };
  return <div className={`learning-node absolute ${className} node-float z-10 rounded-2xl px-3 py-2 shadow-xl ${tones[tone]}`} role="note" aria-label={`مرحلة التعلم: ${text}`}><span className="text-[9px] font-black opacity-65">{step}</span><p className="mt-0.5 text-xs font-black whitespace-nowrap">{text}</p><p className="mt-0.5 text-[9px] font-bold opacity-75 whitespace-nowrap">{detail}</p></div>;
}
