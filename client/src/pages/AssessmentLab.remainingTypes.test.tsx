// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

const fixture = vi.hoisted(() => ({ exercise: { id: 9, type: "multi_select", prompt: { textAr: "تمرين" }, answerDefinition: { choices: [{ labelAr: "اختيار حي" }] }, hints: [], revealSteps: [], provenance: "official_current" } as Record<string, unknown> }));
vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("wouter", () => ({ useLocation: () => ["/assessment", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { attempts: { accessibleExercises: { useQuery: () => ({ data: [fixture.exercise], isLoading: false }) }, submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

import AssessmentLab from "./AssessmentLab";

function liveSection() { return screen.getByText("تمرين من مرجع العمل المعتمد").closest("section")!; }

describe("أنواع الإجابة الحية من تعريف التمرين", () => {
  beforeEach(() => cleanup());

  it("يعرض multi-select وtrue/false من الاختيارات المصدرية", () => {
    fixture.exercise = { id: 9, type: "multi_select", prompt: { textAr: "تمرين" }, answerDefinition: { choices: [{ labelAr: "اختيار متعدد حي" }] }, hints: [], revealSteps: [], provenance: "official_current" };
    render(<AssessmentLab />);
    expect(within(liveSection()).getByRole("button", { name: "اختيار متعدد حي" })).toBeTruthy();

    cleanup();
    fixture.exercise = { id: 10, type: "true_false", prompt: { textAr: "تمرين" }, answerDefinition: { choices: [{ labelAr: "صحيح حي" }, { labelAr: "خطأ حي" }] }, hints: [], revealSteps: [], provenance: "official_current" };
    render(<AssessmentLab />);
    expect(within(liveSection()).getByRole("button", { name: "صحيح حي" })).toBeTruthy();
  });

  it("يعرض numeric وmath-expression بصيغة إدخال مصدرية", () => {
    fixture.exercise = { id: 11, type: "numeric", prompt: { textAr: "تمرين" }, answerDefinition: { placeholderAr: "القيمة الحية بوحدة SI" }, hints: [], revealSteps: [], provenance: "official_current" };
    render(<AssessmentLab />);
    expect(within(liveSection()).getByPlaceholderText("القيمة الحية بوحدة SI")).toBeTruthy();

    cleanup();
    fixture.exercise = { id: 12, type: "math_expression", prompt: { textAr: "تمرين" }, answerDefinition: { formatAr: "التعبير الحي المبسط" }, hints: [], revealSteps: [], provenance: "official_current" };
    render(<AssessmentLab />);
    expect(within(liveSection()).getByPlaceholderText("التعبير الحي المبسط")).toBeTruthy();
  });
});
