export function ScientificCanvas() {
  return (
    <div className="scientific-canvas relative h-[330px] overflow-hidden rounded-[2rem] border border-white/20 bg-[#071d3f] shadow-2xl shadow-blue-950/30 sm:h-[390px]" aria-label="تصور بصري لمسار الفهم">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="absolute -left-16 top-10 h-56 w-56 rounded-full border border-cyan-300/25" />
      <div className="absolute -left-1 top-[33%] h-32 w-32 rounded-full border border-blue-300/20" />
      <div className="absolute -right-8 -top-9 h-52 w-52 rounded-full border border-emerald-300/25" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 400" fill="none" aria-hidden="true">
        <path d="M64 285C135 290 145 112 233 156C321 200 298 318 394 281C468 252 445 120 543 106" stroke="url(#flow)" strokeWidth="4" strokeLinecap="round" />
        <path d="M66 285C121 225 155 248 233 156C301 81 364 134 394 281C414 373 470 268 543 106" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" strokeDasharray="5 8" />
        <defs><linearGradient id="flow" x1="64" y1="285" x2="543" y2="106" gradientUnits="userSpaceOnUse"><stop stopColor="#FF8069"/><stop offset=".48" stopColor="#70D6EE"/><stop offset="1" stopColor="#7BE0A5"/></linearGradient></defs>
      </svg>
      <CanvasNode className="left-[7%] top-[64%]" text="الصورة الكبيرة" tone="coral" />
      <CanvasNode className="left-[28%] top-[28%]" text="الفهم" tone="blue" />
      <CanvasNode className="left-[48%] top-[59%]" text="التطبيق" tone="violet" />
      <CanvasNode className="right-[8%] top-[18%]" text="الإتقان" tone="mint" />
      <div className="absolute bottom-6 right-6 rounded-xl border border-white/10 bg-white/[.08] px-3 py-2 text-xs font-bold text-blue-100 backdrop-blur">من الفكرة إلى الطريقة</div>
    </div>
  );
}

function CanvasNode({ className, text, tone }: { className: string; text: string; tone: "coral" | "blue" | "violet" | "mint" }) {
  const tones = { coral: "bg-[#ff8069] text-white", blue: "bg-[#70d6ee] text-blue-950", violet: "bg-[#9aa7ff] text-blue-950", mint: "bg-[#7be0a5] text-emerald-950" };
  return <div className={`absolute ${className} node-float rounded-2xl px-3 py-2 text-xs font-black shadow-xl ${tones[tone]}`}>{text}</div>;
}
