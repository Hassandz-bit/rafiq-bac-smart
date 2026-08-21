// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "./StaffPages";

const mutate = vi.fn();
const updateMutate = vi.fn();
vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("wouter", () => ({ useLocation: () => ["/admin", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ administration: { planCatalog: { invalidate: vi.fn() }, planAssignmentAudit: { invalidate: vi.fn() }, planChangeAudit: { invalidate: vi.fn() } } }),
    administration: {
      planCatalog: { useQuery: () => ({ data: [{ id: 30002, code: "season_one_subject", nameAr: "باقة الموسم — مادة واحدة", priceDzd: 2900, durationDays: 0, subjectLimit: 1, subjectBundle: ["math"], isActive: true, entitlements: ["season:subject"] }], isLoading: false }) },
      localPaymentStatus: { useQuery: () => ({ data: { enabled: false, provider: "none", mode: "manual_only", billingFlowAvailable: false, messageAr: "الدفع الإلكتروني غير مفعّل. تغييرات الخطط تُسجل يدويًا من الإدارة فقط ولا يوجد رابط دفع أو تحصيل.", supportedFutureCapabilities: ["checkout_intent", "payment_confirmation", "webhook_reconciliation"] }, isLoading: false }) },
      previewPlanAssignment: { useQuery: () => ({ data: { plan: { id: 30002, code: "season_one_subject", nameAr: "باقة الموسم — مادة واحدة", subjectLimit: 1, durationDays: 0, subjectBundle: ["math"], isActive: true }, productTier: "season", selectedSubjects: ["math"], entitlements: ["season:math", "hasm:math"], expiresAt: null, isDryRun: true }, isLoading: false }) },
      planAssignmentAudit: { useQuery: () => ({ data: [{ assignmentId: 9, userId: 42, planCode: "season_one_subject", planNameAr: "باقة الموسم — مادة واحدة", productTier: "season", selectedSubjects: ["math"], isActive: true, assignedAt: new Date(), expiresAt: null, activeEntitlements: [{ userId: 42, entitlement: "season:math", expiresAt: null }, { userId: 42, entitlement: "hasm:math", expiresAt: null }] }], isLoading: false }) },
      planChangeAudit: { useQuery: () => ({ data: [{ id: 8, userId: 42, actorUserId: 1, nextPlanNameAr: "باقة الموسم — مادة واحدة", changeKind: "promotion", noteAr: "عرض داخلي موثق", createdAt: new Date() }], isLoading: false }) },
      grantPlanAccess: { useMutation: () => ({ mutate, isPending: false, data: undefined, error: null }) },
      updatePlanConfiguration: { useMutation: () => ({ mutate: updateMutate, isPending: false, data: undefined, error: null }) },
    },
  },
}));

afterEach(() => { cleanup(); mutate.mockReset(); updateMutate.mockReset(); });

describe("تعيين خطة الوصول الإداري", () => {
  it("يطابق عدد المواد مع الخطة ويرسل تعيين موسم يحفظ منحه المشتقة", () => {
    render(<AdminPage />);
    const assign = screen.getByRole("button", { name: "حفظ التعيين ومنح الاستحقاقات" }) as HTMLButtonElement;
    expect(assign.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("رقم الطالب الداخلي"), { target: { value: "42" } });
    fireEvent.change(screen.getByLabelText("خطة الوصول"), { target: { value: "season_two_subjects" } });
    fireEvent.click(screen.getAllByRole("button", { name: "الفيزياء" })[1]);

    expect(assign.disabled).toBe(false);
    fireEvent.click(assign);
    expect(mutate).toHaveBeenCalledWith({ userId: 42, planCode: "season_two_subjects", subjects: ["math", "physics"], changeKind: "manual_assignment", noteAr: undefined });
  });

  it("يسمح للمدير بضبط السعر والمدة والسعة والاستحقاقات دون مسار دفع", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("ضبط داخلي آمن"));
    fireEvent.change(screen.getByLabelText("سعر season_one_subject"), { target: { value: "3200" } });
    fireEvent.change(screen.getByLabelText("مدة season_one_subject"), { target: { value: "180" } });
    fireEvent.change(screen.getByLabelText("حد المواد season_one_subject"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("استحقاقات season_one_subject"), { target: { value: "season:subject, hasm:subject" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ ضبط الحزمة" }));
    expect(updateMutate).toHaveBeenCalledWith({ id: 30002, priceDzd: 3200, durationDays: 180, subjectLimit: 1, subjectBundle: ["math"], isActive: true, entitlements: ["season:subject", "hasm:subject"] });
  });

  it("يعرض في تعيين الطالب المواد التي يسمح بها تشكيل الحزمة المحفوظ فقط", () => {
    render(<AdminPage />);
    const assignmentFieldset = screen.getByText("اختر 1 مادة/مواد بالضبط").closest("fieldset");
    expect(assignmentFieldset).not.toBeNull();
    expect(within(assignmentFieldset!).getByRole("button", { name: "الرياضيات" })).toBeTruthy();
    expect(within(assignmentFieldset!).queryByRole("button", { name: "الفيزياء" })).toBeNull();
    expect(within(assignmentFieldset!).queryByRole("button", { name: "علوم الطبيعة" })).toBeNull();
  });

  it("يعرض سجل تعيين محفوظ واستحقاقاته كلوحة تدقيق للقراءة فقط", () => {
    render(<AdminPage />);
    expect(screen.getByText("سجل تعيينات الوصول")).toBeTruthy();
    expect(screen.getAllByText("طالب #42 · باقة الموسم — مادة واحدة")).toHaveLength(2);
    expect(screen.getAllByText(/season:math، hasm:math/)).toHaveLength(2);
    expect(screen.getByText("Read-only audit")).toBeTruthy();
    expect(screen.getByText("سجل العروض والترقيات الداخلي")).toBeTruthy();
    expect(screen.getByText("عرض داخلي موثق")).toBeTruthy();
  });

  it("يعرض حد الدفع المحلي كحالة معطلة دون أي زر تحصيل أو بدء دفع", () => {
    render(<AdminPage />);
    expect(screen.getByText("حد الدفع المحلي المستقبلي")).toBeTruthy();
    expect(screen.getByText(/الدفع الإلكتروني غير مفعّل/)).toBeTruthy();
    expect(screen.getByText("معطّل")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /دفع|checkout|تحصيل/i })).toBeNull();
  });

  it("يعرض معاينة الاستحقاقات بلا كتابة قبل الحفظ التشغيلي", () => {
    render(<AdminPage />);
    expect(screen.getByText("معاينة غير مُعدِّلة")).toBeTruthy();
    expect(screen.getByText(/هذه المعاينة لا تحفظ تعيينًا ولا تمنح وصولًا/)).toBeTruthy();
    expect(screen.getAllByText(/season:math، hasm:math/)).toHaveLength(2);
    expect(mutate).not.toHaveBeenCalled();
  });
});
