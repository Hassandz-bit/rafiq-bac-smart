// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudioPage from "./StudioPage";

const mockedReviewQueue = vi.hoisted(() => {
  const packages = [
    [90001, "مسودة مراجعة: Batch 1 — النهايات والاستمرارية", "الرياضيات", 30001],
    [90002, "مسودة مراجعة: Batch 1 — الاشتقاقية", "الرياضيات", 30001],
    [90003, "مسودة مراجعة: Batch 1 — تطور كميات المتفاعلات والنواتج", "العلوم الفيزيائية", 30003],
    [90004, "مسودة مراجعة: Batch 1 — التحولات النووية", "العلوم الفيزيائية", 30003],
    [90005, "مسودة مراجعة: Batch 1 — تركيب البروتين", "علوم الطبيعة والحياة", 30005],
    [90006, "مسودة مراجعة: Batch 1 — العلاقة بين بنية ووظيفة البروتين", "علوم الطبيعة والحياة", 30005],
  ] as const;
  const componentKeys = ["objectives", "prerequisites", "diagnostic", "mind_map", "original_slides", "practice", "quiz", "bac_style_practice", "error_patterns", "summary", "quick_review", "source_links"];
  return packages.map(([id, titleAr, subjectNameAr, sourceId]) => ({
    id, titleAr, type: "batch_review_package", workflowState: "in_review", subjectNameAr, unitTitleAr: titleAr.replace("مسودة مراجعة: ", ""), lessonTitleAr: titleAr, sourceTitle: "نسخة عمل داخلية", sourceAuthority: "نسخة عمل مرجعية قدمها المستخدم", sourceStatus: "historical_official", isInternalPilot: true, publicationBlocked: true, sourceReviewRequired: true, reviewComponentState: "outline_only",
    reviewComponents: componentKeys.map((componentKey, index) => ({ id: id * 100 + index, componentKey, titleAr: `مسودة مكوّن: ${componentKey}`, type: `batch1_${componentKey}_draft`, sourceId, workflowState: "in_review", componentState: "outline_only", contentStatus: "original_draft_text", draftContentAr: "مسودة عربية أصلية مقيدة بالنشر حتى اعتماد المصدر.", publicationBlocked: true, sourceReviewRequired: true })),
  }));
});
const mockedReviewMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedSourceVerificationMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedSourceCreateMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedStandaloneSourceUpdateMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedOfficialBookReviewMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedDraftMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedDraftUpdateMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedDraftReviewSubmissionMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedDraftDiscardMutation = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
const mockedDrafts = vi.hoisted(() => [{ id: 99001, titleAr: "ملاحظة توجيهية أولية", lessonId: 701, sourceId: 30001, componentKey: "guided_note", draftTextAr: "نص مسودة أصلي قابل للتحرير فقط قبل المراجعة.", workflowState: "draft" as const, publicationBlocked: true }]);
const mockAuth = vi.hoisted(() => ({ role: "academic_reviewer" }));
const mockedSources = vi.hoisted(() => [
  { id: 30001, documentTitle: "نسخة عمل الرياضيات", sourceAuthority: "نسخة عمل مرجعية", subjectNameAr: "الرياضيات", url: "https://example.edu/math", isUserApprovedWorkingReference: true, isInternalPilot: true, metadataEditable: false, verificationStatus: "historical_official" as const, verificationNotes: "الطبعة المرجعية تحتاج تحققًا لاحقًا." },
  { id: 30002, documentTitle: "سجل استقبال مستقل", sourceAuthority: "جهة استقبال", subjectNameAr: "الرياضيات", url: "https://example.edu/intake", isUserApprovedWorkingReference: false, isInternalPilot: false, metadataEditable: true, verificationStatus: "unverified" as const, verificationNotes: "سجل غير متحقق قابل لتصحيح البيانات فقط." },
]);
const mockedOfficialBookIntake = vi.hoisted(() => [{ id: 70001, subjectNameAr: "الرياضيات", sourceId: null, sourceTitle: null, fileUrl: "/manus-storage/official-books/math.pdf", originalFilename: "كتاب-رياضيات-2027.pdf", verificationChecklist: { cover: false, title: false, level: false, track: false, publisher: false, authorship: false, edition: false, bookCode: false, publicationYear: false, tableOfContents: false }, verificationStatus: "unverified" as const, uploadedByUserId: 77, uploadedAt: new Date(), reviewedByUserId: null, reviewedAt: null }]);

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: mockAuth.role } }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/studio", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    studio: {
      sourceRegistry: { useQuery: () => ({ data: mockedSources, isLoading: false }) },
      officialBookIntake: { useQuery: () => ({ data: mockedOfficialBookIntake, isLoading: false }) },
      reviewQueue: { useQuery: () => ({ data: mockedReviewQueue, isLoading: false }) },
      reviewLearningItem: { useMutation: () => mockedReviewMutation },
      updateSourceVerification: { useMutation: () => mockedSourceVerificationMutation },
      createSource: { useMutation: () => mockedSourceCreateMutation },
      updateStandaloneSource: { useMutation: () => mockedStandaloneSourceUpdateMutation },
      reviewOfficialBookUpload: { useMutation: () => mockedOfficialBookReviewMutation },
      createDraftComponent: { useMutation: () => mockedDraftMutation },
      draftComponents: { useQuery: () => ({ data: mockedDrafts, isLoading: false }) },
      updateDraftComponent: { useMutation: () => mockedDraftUpdateMutation },
      submitDraftComponentForReview: { useMutation: () => mockedDraftReviewSubmissionMutation },
      discardDraftComponent: { useMutation: () => mockedDraftDiscardMutation },
    },
    curriculum: { overview: { useQuery: () => ({ data: { subjects: [{ id: 301, nameAr: "الرياضيات" }] } }) } },
    useUtils: () => ({ studio: { reviewQueue: { invalidate: vi.fn() }, sourceRegistry: { invalidate: vi.fn() }, officialBookIntake: { invalidate: vi.fn() }, draftComponents: { invalidate: vi.fn() } } }),
  },
}));

afterEach(() => { cleanup(); mockAuth.role = "academic_reviewer"; mockedStandaloneSourceUpdateMutation.mutate.mockReset(); mockedSourceCreateMutation.mutate.mockReset(); mockedOfficialBookReviewMutation.mutate.mockReset(); mockedDraftMutation.mutate.mockReset(); mockedDraftUpdateMutation.mutate.mockReset(); mockedDraftReviewSubmissionMutation.mutate.mockReset(); mockedDraftDiscardMutation.mutate.mockReset(); });

describe("طابور مراجعة Content Studio", () => {
  it("يعرض الوحدات الست ومكوّناتها الـ72 مع قرار مراجعة وقفل النشر دون زر نشر", () => {
    render(<StudioPage />);
    expect(screen.getByText("طابور المراجعة الأكاديمية")).toBeTruthy();
    expect(screen.getByText("6 عناصر")).toBeTruthy();
    expect(screen.getAllByText("مسودة مراجعة: Batch 1 — النهايات والاستمرارية")).toHaveLength(2);
    expect(screen.getAllByText("مسودة مراجعة: Batch 1 — العلاقة بين بنية ووظيفة البروتين")).toHaveLength(2);
    expect(screen.getAllByText(/12 مكوّنات مسودة فعلية/)).toHaveLength(6);
    expect(screen.getAllByText("أهداف التعلم")).toHaveLength(6);
    expect(screen.getAllByText("قفل النشر")).toHaveLength(72);
    expect(screen.getAllByRole("button", { name: "اعتماد أكاديمي" })).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: "إعادة للمسودة" })).toHaveLength(6);
    expect(screen.getByText("تحقق المصدر")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "حفظ التحقق" })).toHaveLength(2);
    expect(screen.getByLabelText("ملاحظة نسخة عمل الرياضيات")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /نشر/i })).toBeNull();
  });

  it("يسمح للمحرر بإنشاء مكوّن Draft يرث المصدر من حزمته الأب بلا زر نشر", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    expect(screen.getByText("مسودة مكوّن مرتبطة بالمصدر")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("مثال: ملاحظة توجيهية"), { target: { value: "ملاحظة توجيهية أصلية" } });
    fireEvent.change(screen.getByLabelText("مفتاح المكوّن"), { target: { value: "guided_note" } });
    fireEvent.change(screen.getByPlaceholderText("اكتب مسودة عربية أصلية للمراجعة الأكاديمية…"), { target: { value: "هذه مسودة عربية أصلية مرتبطة بالمصدر وتحتاج مراجعة." } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ مسودة مقيدة بالنشر" }));
    expect(mockedDraftMutation.mutate).toHaveBeenCalledWith({ parentLearningItemId: 90001, titleAr: "ملاحظة توجيهية أصلية", componentKey: "guided_note", draftTextAr: "هذه مسودة عربية أصلية مرتبطة بالمصدر وتحتاج مراجعة." });
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يسمح للمحرر بتحديث نص وعنوان Draft موجود دون تغيير مصدره أو فتح نشر", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    expect(screen.getByText("تحديث مسودة قائمة")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("عنوان المسودة المحدث"), { target: { value: "ملاحظة توجيهية محدثة" } });
    fireEvent.change(screen.getByLabelText("نص المسودة المحدث"), { target: { value: "نص مسودة عربي محدث يظل مقيدًا بالمصدر والمراجعة." } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ تعديل المسودة" }));
    expect(mockedDraftUpdateMutation.mutate).toHaveBeenCalledWith({ learningItemId: 99001, titleAr: "ملاحظة توجيهية محدثة", draftTextAr: "نص مسودة عربي محدث يظل مقيدًا بالمصدر والمراجعة." });
    expect(screen.getAllByText("Draft · قفل النشر")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يسمح للمحرر بإرسال Draft للمراجعة دون فتح أي نشر", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    fireEvent.click(screen.getByRole("button", { name: "إرسال للمراجعة (لا ينشر)" }));
    expect(mockedDraftReviewSubmissionMutation.mutate).toHaveBeenCalledWith({ learningItemId: 99001 });
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يسمح للمحرر بأرشفة Draft كسجل تدقيق دون حذفه أو نشره", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    fireEvent.click(screen.getByRole("button", { name: "إلغاء المسودة وحفظ سجلها" }));
    expect(mockedDraftDiscardMutation.mutate).toHaveBeenCalledWith({ learningItemId: 99001 });
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يسمح للمحرر بإنشاء سجل مصدر غير متحقق ومقيد بالنشر فقط", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    expect(screen.getByText("إضافة سجل مصدر جديد")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("مثال: وزارة التربية الوطنية"), { target: { value: "جهة مرجعية" } });
    fireEvent.change(screen.getByPlaceholderText("مثال: كتاب مدرسي مقترح"), { target: { value: "كتاب مقترح" } });
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://example.edu/proposed-book" } });
    fireEvent.click(screen.getByRole("button", { name: "إنشاء مصدر غير متحقق" }));
    expect(mockedSourceCreateMutation.mutate).toHaveBeenCalledWith({ sourceAuthority: "جهة مرجعية", documentTitle: "كتاب مقترح", url: "https://example.edu/proposed-book", subjectId: 301, academicYear: undefined, edition: undefined });
    expect(screen.getByText("Unverified · قفل النشر")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يسمح للمحرر بتصحيح بيانات مصدر مستقل غير متحقق من دون تغيير حالته", () => {
    mockAuth.role = "content_editor";
    render(<StudioPage />);
    expect(screen.getByText("تصحيح بيانات مصدر غير متحقق")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("الجهة المرجعية المحدثة"), { target: { value: "جهة استقبال محدثة" } });
    fireEvent.change(screen.getByLabelText("عنوان وثيقة المصدر المحدث"), { target: { value: "سجل مستقل محدث" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ تصحيح البيانات فقط" }));
    expect(mockedStandaloneSourceUpdateMutation.mutate).toHaveBeenCalledWith({ sourceId: 30002, sourceAuthority: "جهة استقبال محدثة", documentTitle: "سجل مستقل محدث", url: "https://example.edu/intake", academicYear: undefined, edition: undefined });
    expect(screen.getByText("Unverified · قفل النشر ثابت")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });

  it("يعرض للمراجع طابور الكتب المرفوعة وفحصه المعزول عن المصدر والنشر", () => {
    render(<StudioPage />);
    expect(screen.getByText("طابور فحص الكتب المرفوعة")).toBeTruthy();
    expect(screen.getByText("كتاب-رياضيات-2027.pdf")).toBeTruthy();
    expect(screen.getByText("لا تعديل للمصدر · لا نشر")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "حفظ فحص الملف فقط" }));
    expect(mockedOfficialBookReviewMutation.mutate).toHaveBeenCalledWith({ uploadId: 70001, verificationStatus: "unverified", verificationChecklist: { cover: false, title: false, level: false, track: false, publisher: false, authorship: false, edition: false, bookCode: false, publicationYear: false, tableOfContents: false } });
    expect(screen.queryByRole("button", { name: /^نشر$/i })).toBeNull();
  });
});
