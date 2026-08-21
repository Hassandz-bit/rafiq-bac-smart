// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentHome from "./StudentHome";

const refetch = vi.fn();
const assessment = { strengths: ["ثبات جيد في المحاولات"], attentionPoint: "تحقق من الوحدة", feedback: "ركز على سبب الخطأ قبل تكرار السؤال.", nextReview: "ابدأ بأقدم مراجعة مستحقة.", confidence: "low" as const };

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", setTheme: vi.fn(), resolvedTheme: "dark", switchable: true }) }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/app", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    curriculum: { overview: { useQuery: () => ({ data: undefined }) }, studentLearningItems: { useQuery: () => ({ data: [] }) } },
    progress: { summary: { useQuery: () => ({ data: { errors: [], reviews: [], mastery: [] } }) }, smartAssessment: { useQuery: () => ({ data: assessment, isFetching: false, refetch }) } },
  },
}));

afterEach(() => { cleanup(); refetch.mockReset(); });

describe("لوحة الطالب Premium", () => {
  it("تعرض الملاحظة العربية المسجلة وتطلب تحديثها من الإجراء المحمي", () => {
    render(<StudentHome />);
    expect(screen.getByText("قراءتنا لمستواك")).toBeTruthy();
    expect(screen.getByText("قوي في")).toBeTruthy();
    expect(screen.getByText("ثبات جيد في المحاولات")).toBeTruthy();
    expect(screen.getByText("تحقق من الوحدة")).toBeTruthy();
    expect(screen.getByText("ابدأ بأقدم مراجعة مستحقة.")).toBeTruthy();
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("رحلتك اليوم").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "اقرأ أدائي" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
