import { ArrowLeft, Atom, CheckCircle2, Compass, FlaskConical, Leaf, Sparkles, Target } from "lucide-react";

export function LaunchStory({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <section data-reveal className="launch-story mx-auto max-w-[1280px] px-5 pb-20 sm:px-8">
    <div className="launch-story-shell rounded-[2rem] p-6 sm:p-9">
      <div className="grid gap-9 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <p className="student-eyebrow"><Sparkles className="h-4 w-4" />هذه البداية… وليست النهاية</p>
          <h2 className="launch-story-title mt-4">بدأنا من العلوم التجريبية.<br /><em>لأن كل مشروع كبير يبدأ بخطوة متقنة.</em></h2>
          <p className="launch-story-copy mt-5">نركز اليوم على ثلاث مواد أساسية لنقدّم تجربة تعلّم واضحة، عملية، ومبنية بعناية. ومن هنا، نواصل بناء الطريق معكم شعبةً بعد شعبة ومادةً بعد مادة.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onNavigate("/app")} className="student-button launch-story-cta">ابدأ معنا من البداية <ArrowLeft className="mr-2 h-4 w-4" /></button>
            <p className="launch-story-cta-note">أنت من أوائل من يخوضون هذه الرحلة معنا.</p>
          </div>
        </div>
        <div className="launch-now-panel">
          <p className="launch-path-label">الآن <span>01</span></p>
          <div className="launch-now-core"><Atom className="h-6 w-6" /><div><b>العلوم التجريبية</b><small>ثلاث مواد أساسية، ومسار واحد متكامل.</small></div></div>
          <div className="launch-subject-list"><span><Target />الرياضيات</span><span><FlaskConical />العلوم الفيزيائية</span><span><Leaf />علوم الطبيعة والحياة</span></div>
          <div className="launch-path-line"><i /><span>نطوّرها معكم</span><i /></div>
          <div className="launch-future-card"><Compass className="h-5 w-5" /><div><b>والخطوة التالية؟</b><small>شعب أخرى، مواد أخرى، وتجربة أكبر.</small></div><em>في الطريق</em></div>
        </div>
      </div>
      <div className="launch-story-footer mt-8"><span><CheckCircle2 />نبدأ صغيرين… لنكبر بشكل صحيح.</span><p>نبني كل جزء بعناية، ثم نوسّع الأثر على أساس تجربة طلاب حقيقية.</p></div>
    </div>
  </section>;
}
