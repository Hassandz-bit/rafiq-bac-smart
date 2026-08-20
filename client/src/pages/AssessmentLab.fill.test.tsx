// @vitest-environment jsdom
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("wouter", () => ({ useLocation: () => ["/assessment", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({ trpc: { attempts: { accessibleExercises: { useQuery: () => ({ data: [{ id: 8, type: "fill", prompt: { textAr: "أكمل العبارة" }, answerDefinition: { placeholderAr: "اكتب المصطلح المصدرّي" }, hints: [], revealSteps: [], provenance: "official_current" }], isLoading: false }) }, submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

import AssessmentLab from "./AssessmentLab";

describe("تمرين fill معتمد", () => {
  it("يعرض حقل الإدخال المحدد في answerDefinition", () => {
    render(<AssessmentLab />);
    const liveExercise = screen.getByText("تمرين من مرجع العمل المعتمد").closest("section");
    expect(within(liveExercise!).getByPlaceholderText("اكتب المصطلح المصدرّي")).toBeTruthy();
  });
});
