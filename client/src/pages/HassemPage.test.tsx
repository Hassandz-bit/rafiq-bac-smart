// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HassemPage from "./HassemPage";

const navigate = vi.fn();
const startSession = vi.fn();
const completeSession = vi.fn();
const completeReview = vi.fn();
const toggleFinalMemory = vi.fn();
let progressData: { reviews: Array<{ id: number; reason: string; dueAt: Date }>; errors: []; mastery: [] } | undefined;
let latestSession: { id: number; durationMinutes: number; status: string } | null = null;
let startError: Error | null = null;
let completionError: Error | null = null;
let hassemPriorities = [{ unitId: 1, unitTitleAr: "الرياضيات", state: "priority" as const, explanationAr: "الإتقان 32% · الأخطاء المتكررة 3 · المراجعات المستحقة 2 · الضغط الزمني محسوب على 20 يومًا.", nextActionAr: "ابدأ بمراجعة خطأ متكرر ثم جلسة حسم قصيرة." }];
let finalMemoryItems = [{ id: 501, titleAr: "بطاقاتك الشخصية", promptAr: "استرجع ثلاث أفكار كتبتها أنت.", completedAt: null }];

vi.mock("wouter", () => ({ useLocation: () => ["/hassem", navigate] }));
vi.mock("@/lib/trpc", () => ({
  trpc: { useUtils: () => ({ progress: { summary: { invalidate: vi.fn() } }, hassem: { plan: { invalidate: vi.fn() }, finalMemory: { invalidate: vi.fn() }, latestSession: { invalidate: vi.fn() } } }), progress: { summary: { useQuery: () => ({ data: progressData, isLoading: false }) }, completeReview: { useMutation: () => ({ mutate: completeReview, isPending: false, error: null }) } }, hassem: { plan: { useQuery: ({ availableDays }: { availableDays: number }) => ({ data: { availableDays, priorities: hassemPriorities }, isLoading: false }) }, finalMemory: { useQuery: () => ({ data: finalMemoryItems, isLoading: false }) }, toggleFinalMemory: { useMutation: () => ({ mutate: toggleFinalMemory, isPending: false }) }, latestSession: { useQuery: () => ({ data: latestSession }) }, startSession: { useMutation: () => ({ mutate: startSession, isPending: false, error: startError }) }, completeSession: { useMutation: () => ({ mutate: completeSession, isPending: false, error: completionError }) } } },
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
  startSession.mockReset();
  completeSession.mockReset();
  completeReview.mockReset();
  toggleFinalMemory.mockReset();
  progressData = undefined;
  latestSession = null;
  startError = null;
  completionError = null;
  hassemPriorities = [{ unitId: 1, unitTitleAr: "الرياضيات", state: "priority", explanationAr: "الإتقان 32% · الأخطاء المتكررة 3 · المراجعات المستحقة 2 · الضغط الزمني محسوب على 20 يومًا.", nextActionAr: "ابدأ بمراجعة خطأ متكرر ثم جلسة حسم قصيرة." }];
  finalMemoryItems = [{ id: 501, titleAr: "بطاقاتك الشخصية", promptAr: "استرجع ثلاث أفكار كتبتها أنت.", completedAt: null }];
});

describe("Hassem diagnostic handoff", () => {
  it("keeps the diagnostic blocked while a due review exists", () => {
    progressData = { reviews: [{ id: 1, reason: "خطأ متكرر", dueAt: new Date() }], errors: [], mastery: [] };
    render(<HassemPage />);
    const button = screen.getByRole("button", { name: "التشخيص بعد المراجعات" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("يسجل إتمام المراجعة المستحقة بحساب الطالب قبل فتح التشخيص", () => {
    progressData = { reviews: [{ id: 41, reason: "خطأ متكرر", dueAt: new Date() }], errors: [], mastery: [] };
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "إتمام مراجعة: خطأ متكرر" }));
    expect(completeReview).toHaveBeenCalledWith({ reviewId: 41 });
    expect((screen.getByRole("button", { name: "التشخيص بعد المراجعات" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("يفتح التشخيص بعد تحديث الطابور وإزالة آخر مراجعة مستحقة", () => {
    progressData = { reviews: [{ id: 41, reason: "خطأ متكرر", dueAt: new Date() }], errors: [], mastery: [] };
    const rendered = render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "إتمام مراجعة: خطأ متكرر" }));
    progressData = { reviews: [], errors: [], mastery: [] };
    rendered.rerender(<HassemPage />);
    expect((screen.getByRole("button", { name: "ابدأ تشخيص الحسم" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("unlocks and hands off to the dedicated BAC diagnostic when no reviews are due", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    render(<HassemPage />);
    const button = screen.getByRole("button", { name: "ابدأ تشخيص الحسم" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(navigate).toHaveBeenCalledWith("/hassem/diagnostic");
  });

  it("opens BAC Focus from the Hassem sprint control without bypassing the review-first diagnostic rule", () => {
    progressData = { reviews: [{ id: 1, reason: "مراجعة مستحقة", dueAt: new Date() }], errors: [], mastery: [] };
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "BAC Sprint" }));
    expect(navigate).toHaveBeenCalledWith("/bac");
    expect((screen.getByRole("button", { name: "التشخيص بعد المراجعات" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("يحفظ بدء جلسة 10 دقائق ويعرض إتمام الجلسة المحفوظة", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "ابدأ 10 دقائق" }));
    expect(startSession).toHaveBeenCalledWith({ durationMinutes: 10 });
    fireEvent.click(screen.getByRole("button", { name: "ابدأ 20 دقيقة" }));
    expect(startSession).toHaveBeenCalledWith({ durationMinutes: 20 });

    cleanup();
    latestSession = { id: 71, durationMinutes: 10, status: "started" };
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "إتمام الجلسة" }));
    expect(completeSession).toHaveBeenCalledWith({ sessionId: 71 });
  });

  it("يعرض رسالة عربية عند تعذر حفظ جلسة الحسم", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    startError = new Error("تعذر الاتصال");
    render(<HassemPage />);
    expect(screen.getByRole("alert").textContent).toContain("تعذر حفظ جلسة الحسم أو إتمامها: تعذر الاتصال");
  });

  it("يعرض رسالة عربية عند تعذر إتمام جلسة حسم محفوظة", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    latestSession = { id: 71, durationMinutes: 20, status: "started" };
    completionError = new Error("فشل الحفظ النهائي");
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "إتمام الجلسة" }));
    expect(completeSession).toHaveBeenCalledWith({ sessionId: 71 });
    expect(screen.getByRole("alert").textContent).toContain("تعذر حفظ جلسة الحسم أو إتمامها: فشل الحفظ النهائي");
  });

  it("يعرض الأولوية الشفافة من الخادم ويغير الأيام المتاحة دون توصية ثابتة", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    render(<HassemPage />);
    expect(screen.getByText("الرياضيات")).toBeTruthy();
    expect(screen.getByText(/الأخطاء المتكررة 3/)).toBeTruthy();
    expect(screen.getByText("ابدأ بمراجعة خطأ متكرر ثم جلسة حسم قصيرة.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "10 يومًا" }));
    expect(screen.getByText("الأيام المتبقية:").parentElement?.textContent).toContain("10");
  });

  it("يفتح قائمة الليلة الهادئة ويحفظ بطاقة ذاكرة شخصية ويوجه محاكاة مشتقة من الأولوية", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    render(<HassemPage />);
    fireEvent.click(screen.getByRole("button", { name: "افتح قائمة هادئة" }));
    expect(screen.getByText("ثبّت، لا تفتح جديدًا.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /بطاقاتك الشخصية/ }));
    expect(toggleFinalMemory).toHaveBeenCalledWith({ itemId: 501 });
    expect(screen.getByText(/ابدأ محاكاة BAC قصيرة بعد تثبيت الرياضيات/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ابدأ محاكاة مقترحة" }));
    expect(navigate).toHaveBeenCalledWith("/bac");
  });
});
