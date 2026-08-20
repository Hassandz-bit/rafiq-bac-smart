// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi, describe, expect, it } from "vitest";

const submit = vi.fn();
vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("wouter", () => ({ useLocation: () => ["/assessment", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { attempts: { accessibleExercises: { useQuery: () => ({ data: [{ id: 7, type: "mcq", prompt: { textAr: "سؤال معتمد" }, answerDefinition: { choices: [{ labelAr: "الخيار المصدرّي الحقيقي" }] }, hints: ["تلميح مصدر أول"], revealSteps: ["خطوة مصدر أول"], provenance: "official_current" }], isLoading: false }) }, submit: { useMutation: () => ({ mutate: submit, isPending: false }) } } } }));

import AssessmentLab from "./AssessmentLab";

describe("مختبر التقييم المصدرّي", () => {
  it("يعرض تلميحًا وخطوة كشف من التمرين المعتمد بدل محتوى المعاينة", () => {
    render(<AssessmentLab />);
    const liveExercise = screen.getByText("تمرين من مرجع العمل المعتمد").closest("section");
    expect(liveExercise).toBeTruthy();
    expect(within(liveExercise!).getByRole("button", { name: "الخيار المصدرّي الحقيقي" })).toBeTruthy();
    expect(within(liveExercise!).queryByRole("button", { name: "الخيار أ" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "أظهر التلميح 1" }));
    expect(screen.getByText(/تلميح مصدر أول/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "اكشف الخطوة التالية" }));
    expect(screen.getByText(/خطوة مصدر أول/)).toBeTruthy();
  });
});
