// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
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
const mockedSources = vi.hoisted(() => [{ id: 30001, documentTitle: "نسخة عمل الرياضيات", sourceAuthority: "نسخة عمل مرجعية", subjectNameAr: "الرياضيات", url: "https://example.edu/math", isUserApprovedWorkingReference: true, isInternalPilot: true, verificationStatus: "historical_official" as const, verificationNotes: "الطبعة المرجعية تحتاج تحققًا لاحقًا." }]);

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "academic_reviewer" } }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/studio", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    studio: {
      sourceRegistry: { useQuery: () => ({ data: mockedSources, isLoading: false }) },
      reviewQueue: { useQuery: () => ({ data: mockedReviewQueue, isLoading: false }) },
      reviewLearningItem: { useMutation: () => mockedReviewMutation },
      updateSourceVerification: { useMutation: () => mockedSourceVerificationMutation },
    },
    curriculum: { overview: { useQuery: () => ({ data: { subjects: [] } }) } },
    useUtils: () => ({ studio: { reviewQueue: { invalidate: vi.fn() }, sourceRegistry: { invalidate: vi.fn() } } }),
  },
}));

afterEach(cleanup);

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
    expect(screen.getByRole("button", { name: "حفظ التحقق" })).toBeTruthy();
    expect(screen.getByLabelText("ملاحظة نسخة عمل الرياضيات")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /نشر/i })).toBeNull();
  });
});
