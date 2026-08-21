import { useAuth } from "@/_core/hooks/useAuth";
import { BrandMark } from "@/components/BrandMark";
import { ReviewOnlyVisualModels } from "@/components/ReviewOnlyVisualModels";
import { RoleGate } from "@/components/RoleGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookUp, CheckCircle2, ClipboardList, FileUp, GitPullRequest, LibraryBig, ShieldAlert, UploadCloud } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const reviewComponentLabels: Record<string, string> = { objectives: "أهداف التعلم", prerequisites: "المتطلبات", diagnostic: "التشخيص", mind_map: "خريطة مفاهيم", original_slides: "شرائح أصلية", practice: "تدريب", quiz: "اختبار قصير", bac_style_practice: "تدريب BAC", error_patterns: "أنماط الخطأ", summary: "ملخص", quick_review: "مراجعة سريعة", source_links: "روابط المصدر" };

export default function StudioPage() {
  return <RoleGate allowed={["admin", "content_editor", "academic_reviewer"]} title="Content Studio محمي"><StudioContent /></RoleGate>;
}

function StudioContent() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: sources, isLoading } = trpc.studio.sourceRegistry.useQuery();
  const { data: draftUnits } = trpc.studio.draftCurriculumUnits.useQuery();
  const { data: officialBookIntake, isLoading: officialBookIntakeLoading } = trpc.studio.officialBookIntake.useQuery({ limit: 50 });
  const { data: reviewQueue, isLoading: reviewQueueLoading } = trpc.studio.reviewQueue.useQuery();
  const { data: drafts, isLoading: draftsLoading } = trpc.studio.draftComponents.useQuery({ limit: 50 });
  const utils = trpc.useUtils();
  const curriculum = trpc.curriculum.overview.useQuery();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const canUpload = user?.role === "admin" || user?.role === "content_editor";
  const canReview = user?.role === "admin" || user?.role === "academic_reviewer";
  const reviewMutation = trpc.studio.reviewLearningItem.useMutation({
    onSuccess: async result => {
      await utils.studio.reviewQueue.invalidate();
      toast.success(result.decision === "approved" ? "سُجل الاعتماد الأكاديمي؛ النشر ما زال مقفلاً." : "سُجلت ملاحظة المراجعة وأعيدت المسودة.");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل قرار المراجعة."),
  });
  const sourceVerificationMutation = trpc.studio.updateSourceVerification.useMutation({
    onSuccess: async result => {
      await utils.studio.sourceRegistry.invalidate();
      toast.success(result.publicationBlocked ? "حُفظت ملاحظة التحقق؛ قفل النشر ما زال فعالًا." : "حُفظت حالة المصدر الحالية؛ يظل النشر خاضعًا لكل بوابات المحتوى.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ تحقق المصدر."),
  });
  const sourceCreateMutation = trpc.studio.createSource.useMutation({
    onSuccess: async result => {
      await utils.studio.sourceRegistry.invalidate();
      toast.success(`أُنشئ سجل المصدر #${result.id} كغير متحقق ومقيد بالنشر؛ لا يُعد مرجعًا رسميًا حاليًا.`);
    },
    onError: error => toast.error(error.message || "تعذر إنشاء سجل المصدر."),
  });
  const draftUnitCreateMutation = trpc.studio.createDraftUnit.useMutation({
    onSuccess: result => toast.success(`أُنشئت الوحدة #${result.id} كمسودة داخلية؛ ليست مجانية ولا يمكن نشرها من هذا المسار.`),
    onError: error => toast.error(error.message || "تعذر إنشاء وحدة المنهج المسودة."),
  });
  const draftLessonCreateMutation = trpc.studio.createDraftLesson.useMutation({
    onSuccess: result => toast.success(`أُنشئ الدرس #${result.id} كمسودة بنيوية فقط؛ لم يُنشأ محتوى تعليمي أو مسار نشر.`),
    onError: error => toast.error(error.message || "تعذر إنشاء درس المنهج المسودة."),
  });
  const standaloneSourceUpdateMutation = trpc.studio.updateStandaloneSource.useMutation({
    onSuccess: async result => {
      await utils.studio.sourceRegistry.invalidate();
      toast.success(`حُدثت بيانات المصدر #${result.sourceId} فقط؛ حالته بقيت غير متحققة وقفل النشر فعال.`);
    },
    onError: error => toast.error(error.message || "تعذر تعديل بيانات المصدر المقيدة."),
  });
  const standaloneSourceArchiveMutation = trpc.studio.archiveStandaloneSource.useMutation({
    onSuccess: async result => {
      await utils.studio.sourceRegistry.invalidate();
      toast.success(`أُرشف سجل المصدر #${result.sourceId} دون حذف؛ لا يزال محفوظًا للتدقيق ولم تتغير حالة النشر.`);
    },
    onError: error => toast.error(error.message || "تعذر أرشفة سجل المصدر المقيد."),
  });
  const officialBookReviewMutation = trpc.studio.reviewOfficialBookUpload.useMutation({
    onSuccess: async result => {
      await utils.studio.officialBookIntake.invalidate();
      toast.success(result.sourceChanged ? "حُفظ الفحص." : "حُفظ فحص الكتاب المرفوع؛ لم يُنشأ أو يُعدّل أي سجل مصدر، والنشر ما زال محظورًا.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ فحص الكتاب المرفوع."),
  });
  const draftMutation = trpc.studio.createDraftComponent.useMutation({
    onSuccess: async result => {
      await utils.studio.reviewQueue.invalidate();
      await utils.studio.draftComponents.invalidate();
      toast.success(`أُنشئت المسودة #${result.id} في حالة Draft؛ النشر غير متاح.`);
    },
    onError: error => toast.error(error.message || "تعذر إنشاء المسودة المرتبطة بالمصدر."),
  });
  const draftUpdateMutation = trpc.studio.updateDraftComponent.useMutation({
    onSuccess: async result => {
      await utils.studio.draftComponents.invalidate();
      toast.success(`حُدثت المسودة #${result.id} مع بقاء المصدر والحالة وقفل النشر كما هي.`);
    },
    onError: error => toast.error(error.message || "تعذر تحديث المسودة."),
  });
  const draftReviewSubmissionMutation = trpc.studio.submitDraftComponentForReview.useMutation({
    onSuccess: async result => {
      await utils.studio.draftComponents.invalidate();
      await utils.studio.reviewQueue.invalidate();
      toast.success(`أُرسلت المسودة #${result.id} للمراجعة؛ النشر ما زال مقفلاً.`);
    },
    onError: error => toast.error(error.message || "تعذر إرسال المسودة للمراجعة."),
  });
  const draftDiscardMutation = trpc.studio.discardDraftComponent.useMutation({
    onSuccess: async result => {
      await utils.studio.draftComponents.invalidate();
      toast.success(`أُرشفت المسودة #${result.id} كسجل تدقيق؛ لم تُحذف ولم تُنشر.`);
    },
    onError: error => toast.error(error.message || "تعذر إلغاء المسودة."),
  });

  const uploadBook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedSubject) {
      toast.error("اختر المادة قبل رفع الكتاب.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/studio/upload-book", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": file.type || "application/pdf",
          "x-subject-id": String(selectedSubject),
          "x-file-name": file.name,
        },
        body: file,
      });
      const payload = await response.json() as { success?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "تعذر رفع الملف.");
      toast.success("تم رفع الكتاب. حالته الآن: يحتاج تحققًا بشريًا.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الكتاب.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff]" dir="rtl">
      <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white px-5 sm:px-8">
        <BrandMark />
        <Button variant="outline" onClick={() => setLocation("/")} className="rounded-xl font-bold"><ArrowRight className="ml-2 h-4 w-4" />الرئيسية</Button>
      </header>
      <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-l border-slate-200/70 bg-white p-5 lg:block">
          <p className="mb-4 text-xs font-black tracking-[.15em] text-slate-400">CONTENT STUDIO</p>
          <StudioNav icon={LibraryBig} label="نظرة عامة" active />
          <StudioNav icon={BookUp} label="المنهج" />
          <StudioNav icon={ClipboardList} label="المراجعات" />
          <StudioNav icon={FileUp} label="سجل المصادر" />
        </aside>
        <main className="p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">حوكمة المحتوى</p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">كل فكرة تحتاج مسار اعتماد.</h1>
                <p className="mt-2 text-sm text-slate-600">Draft → In Review → Approved → Published. لا يوجد نشر تلقائي بالذكاء الاصطناعي.</p>
              </div>
              <div>
                <Button onClick={() => fileInput.current?.click()} disabled={!canUpload || isUploading} className="h-11 rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
                  <UploadCloud className="ml-2 h-4 w-4" />{isUploading ? "جارٍ الرفع…" : "رفع كتاب رسمي حالي"}
                </Button>
                <input ref={fileInput} onChange={uploadBook} type="file" accept="application/pdf" className="hidden" />
              </div>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <Metric icon={ShieldAlert} label="بوابة المصدر" value="3" sub="مواد بانتظار الكتاب الحالي" tone="amber" />
              <Metric icon={GitPullRequest} label="في المراجعة" value={reviewQueueLoading ? "…" : String(reviewQueue?.length ?? 0)} sub={reviewQueue?.length ? "مواد داخلية بانتظار القرار الأكاديمي" : "لا توجد مواد جاهزة للمراجعة"} tone="blue" />
              <Metric icon={CheckCircle2} label="منشور" value="0" sub="الحارس يمنع النشر بلا مصدر" tone="emerald" />
            </section>

            <section className="soft-panel mt-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div><h2 className="font-black">سجل المصادر الرسمي</h2><p className="mt-1 text-xs text-slate-500">يمكن اعتماد المصادر الحالية فقط للنشر الأكاديمي.</p></div>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{isLoading ? "جارٍ التحميل" : `${sources?.length ?? 0} سجلات`}</Badge>
              </div>
              <div className="divide-y divide-slate-100">
                {sources?.map(source => <div key={source.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-bold text-slate-900">{source.documentTitle}</p><p className="mt-1 text-xs text-slate-500">{source.sourceAuthority} · {source.subjectNameAr ?? "غير مرتبط بمادة"}</p></div>
                  <div className="flex items-center gap-3"><Badge className={`border-0 hover:bg-inherit ${source.isUserApprovedWorkingReference ? "bg-emerald-50 text-emerald-700" : source.isInternalPilot ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}>{source.isUserApprovedWorkingReference ? "مرجع عمل معتمد من المستخدم" : source.isInternalPilot ? "Pilot داخلي — غير قابل للنشر" : "النسخة غير مؤكدة"}</Badge><a href={source.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">فتح المصدر</a></div>
                </div>)}
                {!isLoading && !sources?.length && <div className="p-10 text-center text-sm text-slate-500">لا توجد مصادر مسجلة بعد.</div>}
              </div>
            </section>

            {canUpload && <SourceCreateEditor subjects={curriculum.data?.subjects ?? []} saving={sourceCreateMutation.isPending} onCreate={input => sourceCreateMutation.mutate(input)} />}
            {canUpload && <DraftUnitCreateEditor subjects={curriculum.data?.subjects ?? []} saving={draftUnitCreateMutation.isPending} onCreate={input => draftUnitCreateMutation.mutate(input)} />}
            {canUpload && <DraftLessonCreateEditor units={draftUnits ?? []} saving={draftLessonCreateMutation.isPending} onCreate={input => draftLessonCreateMutation.mutate(input)} />}
            {canUpload && <StandaloneSourceUpdateEditor sources={(sources ?? []).filter(source => source.metadataEditable)} saving={standaloneSourceUpdateMutation.isPending} archiving={standaloneSourceArchiveMutation.isPending} onUpdate={input => standaloneSourceUpdateMutation.mutate(input)} onArchive={sourceId => standaloneSourceArchiveMutation.mutate({ sourceId })} />}

            {canReview && <section className="soft-panel mt-6 overflow-hidden">
              <div className="border-b border-slate-100 p-5"><h2 className="font-black">تحقق المصدر</h2><p className="mt-1 text-xs text-slate-500">يسجل المراجع الأدلة وحالة التحقق فقط. لا يملك هذا الإجراء أي مسار للنشر، ولا يمكنه ترقية Pilot داخلي إلى مصدر رسمي حالي.</p></div>
              <div className="divide-y divide-slate-100">{sources?.map(source => <SourceVerificationEditor key={source.id} source={source} saving={sourceVerificationMutation.isPending} onSave={input => sourceVerificationMutation.mutate(input)} />)}{!isLoading && !sources?.length && <div className="p-6 text-center text-sm text-slate-500">لا توجد مصادر لتسجيل تحققها.</div>}</div>
            </section>}

            <section className="soft-panel mt-6 overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">طابور فحص الكتب المرفوعة</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">الرفع يولّد ملفًا في طابور الفحص فقط. حتى لو اكتملت القائمة، لا ينشئ هذا المسار مصدرًا ولا يربطه بالمحتوى ولا يفتح النشر.</p></div><Badge variant="outline" className="border-violet-100 bg-violet-50 text-violet-700">{officialBookIntakeLoading ? "جارٍ التحميل" : `${officialBookIntake?.length ?? 0} ملفات`}</Badge></div>
              <div className="divide-y divide-slate-100">{officialBookIntake?.map(upload => canReview ? <OfficialBookIntakeEditor key={upload.id} upload={upload} saving={officialBookReviewMutation.isPending} onSave={input => officialBookReviewMutation.mutate(input)} /> : <OfficialBookIntakeReadOnly key={upload.id} upload={upload} />)}{!officialBookIntakeLoading && !officialBookIntake?.length && <div className="p-6 text-center text-sm text-slate-500">لا توجد كتب مرفوعة بانتظار الفحص.</div>}</div>
            </section>

            <ReviewOnlyVisualModels />

            {canUpload && <DraftComponentEditor parents={reviewQueue ?? []} saving={draftMutation.isPending} onCreate={input => draftMutation.mutate(input)} />}
            {canUpload && <DraftComponentUpdateEditor drafts={drafts ?? []} loading={draftsLoading} saving={draftUpdateMutation.isPending} submitting={draftReviewSubmissionMutation.isPending} discarding={draftDiscardMutation.isPending} onUpdate={input => draftUpdateMutation.mutate(input)} onSubmitForReview={learningItemId => draftReviewSubmissionMutation.mutate({ learningItemId })} onDiscard={learningItemId => draftDiscardMutation.mutate({ learningItemId })} />}

            <section className="soft-panel mt-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-black">طابور المراجعة الأكاديمية</h2><p className="mt-1 text-xs text-slate-500">قرار بشري موثق: اعتماد أو إعادة للمسودة فقط. لا توجد أي عملية نشر في هذا المسار.</p></div><Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">{reviewQueueLoading ? "جارٍ التحميل" : `${reviewQueue?.length ?? 0} عناصر`}</Badge></div>
              <div className="divide-y divide-slate-100">{reviewQueue?.map(item => <div key={item.id} className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{item.titleAr}</p><p className="mt-1 text-xs text-slate-500">{item.subjectNameAr} · {item.unitTitleAr} · {item.lessonTitleAr} · {item.type}</p><p className="mt-1 text-xs text-slate-500">{item.sourceTitle ?? "مصدر غير مكتمل"} · {item.sourceAuthority ?? "غير موثق"}</p><p className="mt-2 text-xs font-bold text-slate-600">{item.reviewComponents.length} مكوّنات مسودة فعلية · {item.reviewComponentState === "outline_only" ? "مقيّدة بالنشر حتى الاعتماد" : "تحتاج جردًا"}</p></div><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-violet-50 text-violet-700 hover:bg-violet-50">in_review</Badge><Badge variant="outline" className="border-amber-100 bg-amber-50 text-amber-800">{item.sourceStatus ?? "غير متحقق"}</Badge>{item.isInternalPilot && <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">داخلي</Badge>}{item.publicationBlocked && <Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-700">قفل الحزمة</Badge>}</div></div><div className="mt-4 grid gap-2 md:grid-cols-2">{item.reviewComponents.map(component => <article key={component.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-slate-800">{reviewComponentLabels[component.componentKey] ?? component.componentKey}</p><div className="flex gap-1.5"><Badge variant="outline" className="border-blue-100 bg-white text-[10px] text-blue-700">{component.workflowState}</Badge><Badge variant="outline" className="border-rose-100 bg-white text-[10px] text-rose-700">قفل النشر</Badge></div></div><p className="mt-2 text-xs leading-5 text-slate-600">{component.draftContentAr ?? "لا توجد حمولة مسودة بعد."}</p><p className="mt-2 text-[10px] font-bold text-slate-500">المصدر: {item.sourceTitle ?? "غير مكتمل"} · سجل {component.sourceId ?? "—"} · {component.contentStatus ?? "مسودة"}</p></article>)}</div></div>)}{!reviewQueueLoading && !reviewQueue?.length && <div className="p-10 text-center text-sm text-slate-500">لا توجد عناصر بانتظار المراجعة حاليًا.</div>}</div>
            </section>

            {canReview && <section className="soft-panel mt-6 overflow-hidden">
              <div className="border-b border-slate-100 p-5"><h2 className="font-black">قرارات المراجعة</h2><p className="mt-1 text-xs text-slate-500">الاعتماد ينقل العنصر إلى Approved فقط؛ ولا يفتح النشر لأن مصدر Batch 1 ما زال مرجع عمل داخليًا.</p></div>
              <div className="divide-y divide-slate-100">{reviewQueue?.map(item => <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{item.titleAr}</p><p className="mt-1 text-xs text-slate-500">قرارك يُسجل في سجل المراجعة مع بقاء قفل النشر فعالًا.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ learningItemId: item.id, decision: "approved", noteAr: "اعتماد أكاديمي داخلي؛ النشر مقفل حتى تحقق المصدر." })} className="bg-emerald-700 hover:bg-emerald-800">اعتماد أكاديمي</Button><Button size="sm" variant="outline" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ learningItemId: item.id, decision: "changes_requested", noteAr: "تحتاج المسودة إلى تعديل أكاديمي قبل الاعتماد." })}>إعادة للمسودة</Button></div></div>)}</div>
            </section>}

            <section className="mt-6 rounded-[1.5rem] border border-dashed border-blue-200 bg-blue-50/60 p-6">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-700 text-white"><FileUp className="h-5 w-5" /></div>
                <div className="flex-1">
                  <h2 className="font-black text-slate-950">رفع النسخة الرسمية الحالية</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">اختر المادة ثم ارفع PDF الكتاب الذي حصلت عليه بصورة مشروعة. يتحقق الفريق من الغلاف والعنوان والمستوى والشعبة والناشر والطبعة والفهرس قبل تغيير حالة المصدر.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select value={selectedSubject ?? ""} onChange={event => setSelectedSubject(event.target.value ? Number(event.target.value) : null)} className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">اختر المادة أولًا</option>
                      {curriculum.data?.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.nameAr}</option>)}
                    </select>
                    <span className="text-xs text-slate-500">PDF فقط، حتى 25 م.ب. · الحالة الأولية: غير متحقق.</span>
                  </div>
                  {!canUpload && <p className="mt-3 text-xs font-bold text-amber-700">الرفع متاح للمدير أو محرر المحتوى فقط؛ يملك المراجع صلاحية التحقق والقرار الأكاديمي.</p>}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

type StudioSource = { id: number; documentTitle: string; sourceAuthority: string; url: string; academicYear?: string | null; edition?: string | null; verificationStatus: "unverified" | "current_official" | "official_but_version_unconfirmed" | "historical_official"; verificationNotes?: string | null; isInternalPilot: boolean; metadataEditable?: boolean };
type SourceVerificationInput = { sourceId: number; verificationStatus: StudioSource["verificationStatus"]; verificationNotes: string };
type SourceCreateInput = { sourceAuthority: string; documentTitle: string; url: string; subjectId: number; academicYear?: string; level?: string; track?: string; edition?: string; sourceVersion?: string };
type DraftUnitCreateInput = { subjectId: number; titleAr: string; summaryAr?: string; sortOrder?: number };
type DraftUnitOption = { id: number; titleAr: string; subjectNameAr: string; sortOrder: number };
type DraftLessonCreateInput = { unitId: number; titleAr: string; objectiveAr?: string; estimatedMinutes?: number; sortOrder?: number };
type StandaloneSourceUpdateInput = { sourceId: number; sourceAuthority: string; documentTitle: string; url: string; academicYear?: string; edition?: string };
type OfficialBookChecklist = { cover: boolean; title: boolean; level: boolean; track: boolean; publisher: boolean; authorship: boolean; edition: boolean; bookCode: boolean; publicationYear: boolean; tableOfContents: boolean };
type OfficialBookIntake = { id: number; subjectNameAr: string; sourceId: number | null; sourceTitle: string | null; fileUrl: string; originalFilename: string; verificationChecklist: OfficialBookChecklist; verificationStatus: StudioSource["verificationStatus"]; uploadedByUserId: number; uploadedAt: Date; reviewedByUserId: number | null; reviewedAt: Date | null };
type OfficialBookReviewInput = { uploadId: number; verificationStatus: StudioSource["verificationStatus"]; verificationChecklist: OfficialBookChecklist };
type DraftParent = { id: number; titleAr: string; sourceTitle?: string | null };
type DraftComponentInput = { parentLearningItemId: number; titleAr: string; componentKey: string; draftTextAr: string };
type EditableDraft = { id: number; titleAr: string; lessonId: number; sourceId: number | null; componentKey: string; draftTextAr: string; workflowState: "draft"; publicationBlocked: boolean };
type DraftUpdateInput = { learningItemId: number; titleAr: string; draftTextAr: string };

function SourceCreateEditor({ subjects, saving, onCreate }: { subjects: { id: number; nameAr: string }[]; saving: boolean; onCreate: (input: SourceCreateInput) => void }) {
  const [sourceAuthority, setSourceAuthority] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState<number | null>(subjects[0]?.id ?? null);
  const [academicYear, setAcademicYear] = useState("");
  const [edition, setEdition] = useState("");
  const validUrl = /^https?:\/\/.+/i.test(url.trim());
  const ready = sourceAuthority.trim().length >= 3 && documentTitle.trim().length >= 3 && validUrl && Boolean(subjectId);
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">إضافة سجل مصدر جديد</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">للمحرر أو المدير فقط. يُحفظ السجل دائمًا بحالة غير متحقق ومقيد بالنشر؛ لا توجد هنا خانة «رسمي حالي» أو أي قرار نشر.</p></div><div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">الجهة المرجعية<input aria-label="الجهة المرجعية" value={sourceAuthority} onChange={event => setSourceAuthority(event.target.value)} placeholder="مثال: وزارة التربية الوطنية" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">عنوان الوثيقة<input aria-label="عنوان وثيقة المصدر" value={documentTitle} onChange={event => setDocumentTitle(event.target.value)} placeholder="مثال: كتاب مدرسي مقترح" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">رابط المصدر<input aria-label="رابط المصدر الجديد" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" inputMode="url" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">المادة<select aria-label="مادة المصدر الجديد" value={subjectId ?? ""} onChange={event => setSubjectId(Number(event.target.value) || null)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">اختر المادة</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.nameAr}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-600">السنة الدراسية (اختياري)<input aria-label="السنة الدراسية للمصدر" value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2026–2027" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">الطبعة (اختياري)<input aria-label="طبعة المصدر" value={edition} onChange={event => setEdition(event.target.value)} placeholder="الطبعة الأولى" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><div className="flex items-end"><Badge variant="outline" className="mb-2 border-rose-100 bg-rose-50 text-rose-700">Unverified · قفل النشر</Badge></div><div className="md:col-span-2"><Button disabled={!ready || saving} onClick={() => subjectId && onCreate({ sourceAuthority: sourceAuthority.trim(), documentTitle: documentTitle.trim(), url: url.trim(), subjectId, academicYear: academicYear.trim() || undefined, edition: edition.trim() || undefined })} className="bg-slate-950 hover:bg-slate-800">{saving ? "جارٍ إنشاء السجل…" : "إنشاء مصدر غير متحقق"}</Button></div></div></section>;
}

function DraftUnitCreateEditor({ subjects, saving, onCreate }: { subjects: { id: number; nameAr: string }[]; saving: boolean; onCreate: (input: DraftUnitCreateInput) => void }) {
  const [subjectId, setSubjectId] = useState<number | null>(subjects[0]?.id ?? null);
  const [titleAr, setTitleAr] = useState("");
  const [summaryAr, setSummaryAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const ready = Boolean(subjectId) && titleAr.trim().length >= 3 && /^\d+$/.test(sortOrder);
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">إضافة وحدة منهجية مسودة</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">للمحرر أو المدير فقط. تُنشأ الوحدة دائمًا Draft وغير مجانية ومقيدة بالنشر؛ لا توجد هنا حالة اعتماد أو نشر أو وصول حر.</p></div><div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">المادة<select aria-label="مادة الوحدة المسودة" value={subjectId ?? ""} onChange={event => setSubjectId(Number(event.target.value) || null)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">اختر المادة</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.nameAr}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-600">ترتيب الوحدة<input aria-label="ترتيب الوحدة المسودة" value={sortOrder} onChange={event => setSortOrder(event.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">عنوان الوحدة<input aria-label="عنوان الوحدة المسودة" value={titleAr} onChange={event => setTitleAr(event.target.value)} placeholder="مثال: الحركية الكيميائية" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">ملخص داخلي (اختياري)<textarea aria-label="ملخص الوحدة المسودة" value={summaryAr} onChange={event => setSummaryAr(event.target.value)} rows={3} placeholder="وصف موجز للمراجعة الداخلية…" className="rounded-xl border border-slate-200 bg-white p-3 text-sm" /></label><div className="md:col-span-2 flex flex-wrap items-center gap-3"><Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-700">Draft · غير مجانية · قفل النشر</Badge><Button disabled={!ready || saving} onClick={() => subjectId && onCreate({ subjectId, titleAr: titleAr.trim(), summaryAr: summaryAr.trim() || undefined, sortOrder: Number(sortOrder) })} className="bg-slate-950 hover:bg-slate-800">{saving ? "جارٍ إنشاء المسودة…" : "إنشاء وحدة مسودة"}</Button></div></div></section>;
}

function DraftLessonCreateEditor({ units, saving, onCreate }: { units: DraftUnitOption[]; saving: boolean; onCreate: (input: DraftLessonCreateInput) => void }) {
  const [unitId, setUnitId] = useState<number | null>(units[0]?.id ?? null);
  const [titleAr, setTitleAr] = useState("");
  const [objectiveAr, setObjectiveAr] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [sortOrder, setSortOrder] = useState("0");
  const numericFieldsValid = /^\d+$/.test(estimatedMinutes) && /^\d+$/.test(sortOrder) && Number(estimatedMinutes) >= 1;
  const ready = Boolean(unitId) && titleAr.trim().length >= 3 && numericFieldsValid;
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">إضافة درس ضمن وحدة مسودة</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">للمحرر أو المدير فقط. لا تظهر هنا إلا الوحدات Draft؛ ينشأ الدرس Draft بنيويًا من دون مصدر أو محتوى أو نشر.</p></div>{units.length ? <div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">الوحدة الأم<select aria-label="الوحدة الأم للدرس المسودة" value={unitId ?? ""} onChange={event => setUnitId(Number(event.target.value) || null)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">{units.map(unit => <option key={unit.id} value={unit.id}>{unit.subjectNameAr} · {unit.titleAr}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-600">المدة التقديرية (دقيقة)<input aria-label="مدة الدرس المسودة" value={estimatedMinutes} onChange={event => setEstimatedMinutes(event.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">عنوان الدرس<input aria-label="عنوان الدرس المسودة" value={titleAr} onChange={event => setTitleAr(event.target.value)} placeholder="مثال: سرعة التفاعل والعوامل المؤثرة" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">هدف داخلي (اختياري)<textarea aria-label="هدف الدرس المسودة" value={objectiveAr} onChange={event => setObjectiveAr(event.target.value)} rows={3} placeholder="هدف أولي للمراجعة الداخلية…" className="rounded-xl border border-slate-200 bg-white p-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">ترتيب الدرس<input aria-label="ترتيب الدرس المسودة" value={sortOrder} onChange={event => setSortOrder(event.target.value.replace(/\D/g, ""))} inputMode="numeric" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><div className="flex items-end"><Badge variant="outline" className="mb-2 border-rose-100 bg-rose-50 text-rose-700">Draft · لا محتوى · قفل النشر</Badge></div><div className="md:col-span-2"><Button disabled={!ready || saving} onClick={() => unitId && onCreate({ unitId, titleAr: titleAr.trim(), objectiveAr: objectiveAr.trim() || undefined, estimatedMinutes: Number(estimatedMinutes), sortOrder: Number(sortOrder) })} className="bg-slate-950 hover:bg-slate-800">{saving ? "جارٍ إنشاء الدرس…" : "إنشاء درس مسودة"}</Button></div></div> : <p className="p-5 text-sm text-slate-500">أنشئ وحدة Draft أولًا قبل إضافة درسها. لا يمكن اختيار وحدة معتمدة أو منشورة من هنا.</p>}</section>;
}

function StandaloneSourceUpdateEditor({ sources, saving, archiving, onUpdate, onArchive }: { sources: StudioSource[]; saving: boolean; archiving: boolean; onUpdate: (input: StandaloneSourceUpdateInput) => void; onArchive: (sourceId: number) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(sources[0]?.id ?? null);
  const selected = sources.find(source => source.id === selectedId) ?? sources[0];
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">تصحيح بيانات مصدر غير متحقق</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">للمحرر أو المدير فقط، ومتاح للسجل المستقل غير المتحقق فقط. يرفض الخادم أي سجل مرتبط بمحتوى أو بكتاب مرفوع، وأي تغيير لحالة المصدر أو قفل النشر. الأرشفة تحفظ السجل ولا تحذفه.</p></div>{selected ? <StandaloneSourceUpdateFields key={selected.id} source={selected} sources={sources} saving={saving} archiving={archiving} onSelect={setSelectedId} onUpdate={onUpdate} onArchive={onArchive} /> : <p className="p-5 text-sm text-slate-500">لا توجد مصادر مستقلة غير متحققة متاحة للتصحيح. السجلات المرتبطة أو الخاضعة للمراجعة محفوظة للتدقيق.</p>}</section>;
}

function StandaloneSourceUpdateFields({ source, sources, saving, archiving, onSelect, onUpdate, onArchive }: { source: StudioSource; sources: StudioSource[]; saving: boolean; archiving: boolean; onSelect: (id: number) => void; onUpdate: (input: StandaloneSourceUpdateInput) => void; onArchive: (sourceId: number) => void }) {
  const [sourceAuthority, setSourceAuthority] = useState(source.sourceAuthority);
  const [documentTitle, setDocumentTitle] = useState(source.documentTitle);
  const [url, setUrl] = useState(source.url);
  const [academicYear, setAcademicYear] = useState(source.academicYear ?? "");
  const [edition, setEdition] = useState(source.edition ?? "");
  const ready = sourceAuthority.trim().length >= 3 && documentTitle.trim().length >= 3 && /^https?:\/\/.+/i.test(url.trim());
  return <div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">السجل<select aria-label="سجل المصدر المراد تصحيحه" value={source.id} onChange={event => onSelect(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">{sources.map(item => <option key={item.id} value={item.id}>#{item.id} · {item.documentTitle}</option>)}</select></label><div className="flex items-end"><Badge variant="outline" className="mb-2 border-rose-100 bg-rose-50 text-rose-700">Unverified · قفل النشر ثابت</Badge></div><label className="grid gap-1 text-xs font-bold text-slate-600">الجهة المرجعية<input aria-label="الجهة المرجعية المحدثة" value={sourceAuthority} onChange={event => setSourceAuthority(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">عنوان الوثيقة<input aria-label="عنوان وثيقة المصدر المحدث" value={documentTitle} onChange={event => setDocumentTitle(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">رابط المصدر<input aria-label="رابط المصدر المحدث" value={url} onChange={event => setUrl(event.target.value)} inputMode="url" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">السنة الدراسية (اختياري)<input aria-label="السنة الدراسية المحدثة" value={academicYear} onChange={event => setAcademicYear(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">الطبعة (اختياري)<input aria-label="طبعة المصدر المحدثة" value={edition} onChange={event => setEdition(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><div className="flex flex-wrap gap-3 md:col-span-2"><Button disabled={!ready || saving} onClick={() => onUpdate({ sourceId: source.id, sourceAuthority: sourceAuthority.trim(), documentTitle: documentTitle.trim(), url: url.trim(), academicYear: academicYear.trim() || undefined, edition: edition.trim() || undefined })} className="bg-slate-950 hover:bg-slate-800">{saving ? "جارٍ حفظ التصحيح…" : "حفظ تصحيح البيانات فقط"}</Button><Button variant="outline" disabled={archiving} onClick={() => onArchive(source.id)} className="border-rose-200 text-rose-700 hover:bg-rose-50">{archiving ? "جارٍ الأرشفة…" : "أرشفة السجل دون حذف"}</Button></div></div>;
}

function DraftComponentEditor({ parents, saving, onCreate }: { parents: DraftParent[]; saving: boolean; onCreate: (input: DraftComponentInput) => void }) {
  const [parentId, setParentId] = useState<number | null>(parents[0]?.id ?? null);
  const [titleAr, setTitleAr] = useState("");
  const [componentKey, setComponentKey] = useState("guided_note");
  const [draftTextAr, setDraftTextAr] = useState("");
  const ready = Boolean(parentId) && titleAr.trim().length >= 3 && componentKey.trim().length >= 2 && draftTextAr.trim().length >= 8;
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">مسودة مكوّن مرتبطة بالمصدر</h2><p className="mt-1 text-xs leading-5 text-slate-500">للمحرر أو المدير فقط. ترث المسودة الدرس والمصدر من الحزمة الأب، وتُحفظ دائمًا في Draft مع قفل نشر صريح.</p></div>{parents.length ? <div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">الحزمة الأب<select aria-label="الحزمة الأب للمسودة" value={parentId ?? ""} onChange={event => setParentId(Number(event.target.value) || null)} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">{parents.map(parent => <option key={parent.id} value={parent.id}>{parent.titleAr} · {parent.sourceTitle ?? "مصدر مرتبط"}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-600">عنوان المسودة<input aria-label="عنوان المسودة" value={titleAr} onChange={event => setTitleAr(event.target.value)} placeholder="مثال: ملاحظة توجيهية" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600">مفتاح المكوّن<input aria-label="مفتاح المكوّن" value={componentKey} onChange={event => setComponentKey(event.target.value)} placeholder="guided_note" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><div className="flex items-end"><Badge variant="outline" className="mb-2 border-rose-100 bg-rose-50 text-rose-700">Draft · قفل النشر</Badge></div><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">نص المسودة الأصلي<textarea aria-label="نص المسودة الأصلي" value={draftTextAr} onChange={event => setDraftTextAr(event.target.value)} placeholder="اكتب مسودة عربية أصلية للمراجعة الأكاديمية…" className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-sm" /></label><div className="md:col-span-2"><Button disabled={!ready || saving} onClick={() => parentId && onCreate({ parentLearningItemId: parentId, titleAr: titleAr.trim(), componentKey: componentKey.trim(), draftTextAr: draftTextAr.trim() })} className="bg-blue-700 hover:bg-blue-800">{saving ? "جارٍ حفظ المسودة…" : "حفظ مسودة مقيدة بالنشر"}</Button></div></div> : <div className="p-5 text-sm text-slate-500">لا توجد حزمة مراجعة مرتبطة بمصدر يمكن أن ترث منها مسودة جديدة.</div>}</section>;
}

function DraftComponentUpdateEditor({ drafts, loading, saving, submitting, discarding, onUpdate, onSubmitForReview, onDiscard }: { drafts: EditableDraft[]; loading: boolean; saving: boolean; submitting: boolean; discarding: boolean; onUpdate: (input: DraftUpdateInput) => void; onSubmitForReview: (learningItemId: number) => void; onDiscard: (learningItemId: number) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(drafts[0]?.id ?? null);
  const selected = drafts.find(draft => draft.id === selectedId) ?? drafts[0];
  return <section className="soft-panel mt-6 overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-black">تحديث مسودة قائمة</h2><p className="mt-1 text-xs leading-5 text-slate-500">يُسمح بتحديث العنوان والنص الأصلي فقط للمحرر أو المدير. الدرس والمصدر والحالة وقفل النشر غير قابلة للتعديل هنا.</p></div>{loading ? <p className="p-5 text-sm text-slate-500">جارٍ تحميل المسودات…</p> : selected ? <DraftUpdateFields key={selected.id} draft={selected} saving={saving} submitting={submitting} discarding={discarding} onUpdate={onUpdate} onSubmitForReview={onSubmitForReview} onDiscard={onDiscard} onSelect={setSelectedId} drafts={drafts} /> : <p className="p-5 text-sm text-slate-500">لا توجد مسودات قابلة للتحديث حاليًا.</p>}</section>;
}

function DraftUpdateFields({ draft, drafts, saving, submitting, discarding, onUpdate, onSubmitForReview, onDiscard, onSelect }: { draft: EditableDraft; drafts: EditableDraft[]; saving: boolean; submitting: boolean; discarding: boolean; onUpdate: (input: DraftUpdateInput) => void; onSubmitForReview: (learningItemId: number) => void; onDiscard: (learningItemId: number) => void; onSelect: (id: number) => void }) {
  const [titleAr, setTitleAr] = useState(draft.titleAr);
  const [draftTextAr, setDraftTextAr] = useState(draft.draftTextAr);
  const ready = titleAr.trim().length >= 3 && draftTextAr.trim().length >= 8;
  return <div className="grid gap-4 p-5 md:grid-cols-2"><label className="grid gap-1 text-xs font-bold text-slate-600">المسودة<select aria-label="المسودة المراد تحديثها" value={draft.id} onChange={event => onSelect(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-sm">{drafts.map(item => <option key={item.id} value={item.id}>#{item.id} · {item.titleAr}</option>)}</select></label><div className="flex items-end gap-2"><Badge variant="outline" className="mb-2 border-slate-200 bg-slate-50 text-slate-600">درس {draft.lessonId}</Badge><Badge variant="outline" className="mb-2 border-rose-100 bg-rose-50 text-rose-700">Draft · قفل النشر</Badge></div><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">عنوان المسودة<input aria-label="عنوان المسودة المحدث" value={titleAr} onChange={event => setTitleAr(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" /></label><label className="grid gap-1 text-xs font-bold text-slate-600 md:col-span-2">نص المسودة الأصلي<textarea aria-label="نص المسودة المحدث" value={draftTextAr} onChange={event => setDraftTextAr(event.target.value)} className="min-h-28 rounded-xl border border-slate-200 bg-white p-3 text-sm" /></label><div className="flex flex-wrap gap-3 md:col-span-2"><Button disabled={!ready || saving} onClick={() => onUpdate({ learningItemId: draft.id, titleAr: titleAr.trim(), draftTextAr: draftTextAr.trim() })} className="bg-slate-950 hover:bg-slate-800">{saving ? "جارٍ تحديث المسودة…" : "حفظ تعديل المسودة"}</Button><Button variant="outline" disabled={submitting} onClick={() => onSubmitForReview(draft.id)} className="border-blue-200 text-blue-800 hover:bg-blue-50">{submitting ? "جارٍ الإرسال…" : "إرسال للمراجعة (لا ينشر)"}</Button><Button variant="outline" disabled={discarding} onClick={() => onDiscard(draft.id)} className="border-rose-200 text-rose-700 hover:bg-rose-50">{discarding ? "جارٍ الأرشفة…" : "إلغاء المسودة وحفظ سجلها"}</Button></div></div>;
}

function SourceVerificationEditor({ source, saving, onSave }: { source: StudioSource; saving: boolean; onSave: (input: SourceVerificationInput) => void }) {
  const [status, setStatus] = useState<StudioSource["verificationStatus"]>(source.verificationStatus);
  const [notes, setNotes] = useState(source.verificationNotes ?? "");
  const blockedInternalPromotion = source.isInternalPilot && status === "current_official";
  return <div className="grid gap-3 p-5 lg:grid-cols-[1fr_190px_1.2fr_auto] lg:items-end"><div><p className="font-bold text-slate-900">{source.documentTitle}</p><p className="mt-1 text-xs text-slate-500">الدليل يحدّث سجل المصدر فقط، ولا ينشر أي محتوى.</p></div><label className="text-xs font-bold text-slate-600">الحالة<select aria-label={`حالة ${source.documentTitle}`} value={status} onChange={event => setStatus(event.target.value as StudioSource["verificationStatus"])} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs"><option value="unverified">غير متحقق</option><option value="official_but_version_unconfirmed">رسمي والطبعة غير مؤكدة</option><option value="historical_official">رسمي تاريخي</option><option value="current_official" disabled={source.isInternalPilot}>رسمي حالي</option></select></label><label className="text-xs font-bold text-slate-600">ملاحظة التحقق<textarea aria-label={`ملاحظة ${source.documentTitle}`} value={notes} onChange={event => setNotes(event.target.value)} placeholder="سجل الغلاف أو الطبعة أو صفحة الدليل…" className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs" /></label><Button size="sm" disabled={saving || notes.trim().length < 3 || blockedInternalPromotion} onClick={() => onSave({ sourceId: source.id, verificationStatus: status, verificationNotes: notes })} className="bg-blue-700 hover:bg-blue-800">حفظ التحقق</Button>{blockedInternalPromotion && <p className="text-xs font-bold text-rose-700 lg:col-span-4">لا يمكن ترقية مصدر Pilot داخلي إلى مصدر رسمي حالي هنا.</p>}</div>;
}

const officialBookChecklistLabels: Record<keyof OfficialBookChecklist, string> = { cover: "الغلاف", title: "العنوان", level: "المستوى", track: "الشعبة", publisher: "الناشر", authorship: "المؤلف", edition: "الطبعة", bookCode: "رمز الكتاب", publicationYear: "سنة النشر", tableOfContents: "الفهرس" };

function OfficialBookIntakeReadOnly({ upload }: { upload: OfficialBookIntake }) {
  return <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{upload.originalFilename}</p><p className="mt-1 text-xs text-slate-500">{upload.subjectNameAr} · رُفع بواسطة المستخدم #{upload.uploadedByUserId}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="border-violet-100 bg-violet-50 text-violet-700">{upload.verificationStatus}</Badge><Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-700">لا مصدر · لا نشر</Badge><a href={upload.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">فتح PDF</a></div></div>;
}

function OfficialBookIntakeEditor({ upload, saving, onSave }: { upload: OfficialBookIntake; saving: boolean; onSave: (input: OfficialBookReviewInput) => void }) {
  const [status, setStatus] = useState<StudioSource["verificationStatus"]>(upload.verificationStatus);
  const [checklist, setChecklist] = useState<OfficialBookChecklist>(upload.verificationChecklist);
  const complete = Object.values(checklist).every(Boolean);
  return <div className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{upload.originalFilename}</p><p className="mt-1 text-xs text-slate-500">{upload.subjectNameAr} · رُفع بواسطة المستخدم #{upload.uploadedByUserId} · {upload.sourceTitle ? `مرتبط بالسجل: ${upload.sourceTitle}` : "غير مربوط بسجل مصدر"}</p></div><div className="flex flex-wrap items-center gap-2"><a href={upload.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">فتح PDF</a><Badge variant="outline" className="border-rose-100 bg-rose-50 text-rose-700">لا تعديل للمصدر · لا نشر</Badge></div></div><fieldset className="mt-4 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-2 lg:grid-cols-5"><legend className="px-1 text-xs font-black text-slate-700">قائمة فحص الكتاب المرفوع</legend>{Object.entries(officialBookChecklistLabels).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={checklist[key as keyof OfficialBookChecklist]} onChange={event => setChecklist(current => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</fieldset><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="grid gap-1 text-xs font-bold text-slate-600">حالة فحص الملف<select aria-label={`حالة فحص ${upload.originalFilename}`} value={status} onChange={event => setStatus(event.target.value as StudioSource["verificationStatus"])} className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs"><option value="unverified">غير متحقق</option><option value="official_but_version_unconfirmed">رسمي والطبعة غير مؤكدة</option><option value="historical_official">رسمي تاريخي</option><option value="current_official" disabled={!complete}>رسمي حالي (يتطلب اكتمال الفحص)</option></select></label><Button disabled={saving} onClick={() => onSave({ uploadId: upload.id, verificationStatus: status, verificationChecklist: checklist })} className="bg-violet-700 hover:bg-violet-800">{saving ? "جارٍ حفظ الفحص…" : "حفظ فحص الملف فقط"}</Button><p className="text-xs text-slate-500">{complete ? "القائمة مكتملة؛ ما زال سجل المصدر والنشر دون تغيير." : "يمكن حفظ الفحص الناقص، لكن لا يمكن تصنيفه رسميًا حاليًا."}</p></div></div>;
}

function StudioNav({ icon: Icon, label, active }: { icon: typeof LibraryBig; label: string; active?: boolean }) {
  return <button className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-bold ${active ? "bg-blue-50 text-blue-800" : "text-slate-500 hover:bg-slate-50"}`}><Icon className="h-4.5 w-4.5" />{label}</button>;
}
function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof ShieldAlert; label: string; value: string; sub: string; tone: "amber" | "blue" | "emerald" }) {
  const tones = { amber: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700", emerald: "bg-emerald-100 text-emerald-700" };
  return <div className="soft-panel p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs text-slate-500">{sub}</p></div>;
}
