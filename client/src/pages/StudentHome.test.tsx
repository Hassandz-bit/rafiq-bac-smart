// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentHome from "./StudentHome";

const refetch = vi.fn();
const assessment = { strengths: ["ثبات جيد في المحاولات"], attentionPoint: "تحقق من الوحدة", feedback: "ركز على سبب الخطأ قبل تكرار السؤال.", nextReview: "ابدأ بأقدم مراجعة مستحقة.", confidence: "low" as const };

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/app", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    curriculum: { overview: { useQuery: () => ({ data: undefined }) }, studentLearningItems: { useQuery: () => ({ data: [] }) } },
    progress: { summary: { useQuery: () => ({ data: { errors: [], reviews: [], mastery: [] } }) }, smartAssessment: { useQuery: () => ({ data: assessment, isFetching: false, refetch }) } },
  },
}));

afterEach(() => { cleanup(); refetch.mockReset(); });

describe("لوحة التقييم الذكي للطالب", () => {
  it("تعرض الملاحظة العربية المسجلة وتطلب تحديثها من الإجراء المحمي", () => {
    render(<StudentHome />);
    expect(screen.getByText("تقييم ذكي لأدائك")).toBeTruthy();
    expect(screen.getByText("نقطة قوة:")).toBeTruthy();
    expect(screen.getByText("ثبات جيد في المحاولات")).toBeTruthy();
    expect(screen.getByText("تحقق من الوحدة")).toBeTruthy();
    expect(screen.getByText("ابدأ بأقدم مراجعة مستحقة.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "حلّل أدائي" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
