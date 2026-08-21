// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ start: vi.fn(), submit: vi.fn() }));
vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("wouter", () => ({ useLocation: () => ["/bac", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({ trpc: {
  curriculum: { overview: { useQuery: () => ({ data: { subjects: [{ id: 4 }] } }) } },
  bac: {
    start: { useMutation: (options: { onSuccess: (value: { id: number }) => void }) => ({ mutate: () => { mocks.start(); options.onSuccess({ id: 71 }); }, isPending: false }) },
    autosave: { useMutation: () => ({ mutate: vi.fn() }) },
    submit: { useMutation: (options: { onSuccess: (value: unknown) => void }) => ({ mutate: (input: unknown) => { mocks.submit(input); options.onSuccess({ score: 64, elapsedSeconds: 0, rescueLevel: "consolidate", labelAr: "خطة تثبيت", summaryAr: "تحليل مسجل", signals: ["العلامة المسجلة: 64/100."], actionsAr: ["راجع دفتر الأخطاء بحسب التكرار."] }); }, isPending: false }) },
  },
} }));

import BacPage from "./BacPage";

describe("نتائج BAC Focus", () => {
  it("يرسل العلامة والأيام المدخلة ويعرض خطة الإنقاذ العائدة من العقد المحمي", () => {
    render(<BacPage />);
    fireEvent.change(screen.getByLabelText("العلامة المسجلة في المحاكاة"), { target: { value: "64" } });
    fireEvent.change(screen.getByLabelText("الأيام المتبقية"), { target: { value: "18" } });
    fireEvent.click(screen.getByRole("button", { name: "ابدأ المحاكاة" }));
    fireEvent.click(screen.getByRole("button", { name: "اقرأ النتيجة" }));
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 71, score: 64, remainingDays: 18 }));
    expect(screen.getByText("خطة تثبيت")).toBeTruthy();
    expect(screen.getByText("راجع دفتر الأخطاء بحسب التكرار.")).toBeTruthy();
  });
});
