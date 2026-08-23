import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SubjectsPage from "./SubjectsPage";

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("wouter", () => ({ useLocation: () => ["/subjects", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    curriculum: {
      overview: {
        useQuery: () => ({
          data: {
            curriculum: { academicYear: "2026–2027" },
            subjects: [{ id: 1, code: "math", nameAr: "الرياضيات", taglineAr: "مسار منظم", sourceGate: "pending", sourceGateNote: null }],
          },
          isLoading: false,
        }),
      },
    },
  },
}));

afterEach(cleanup);

describe("بطاقة مسار المادة", () => {
  it("تعرض محتواها المقيد بوضوح وتحافظ على زر المصدر غير المتحقق معطّلًا", () => {
    render(<SubjectsPage />);
    const card = screen.getByText("الرياضيات").closest("article");
    expect(card).not.toBeNull();
    expect(card?.className).toContain("relative");
    expect(screen.getByText("قيد الإثراء")).toBeTruthy();
    expect((screen.getByRole("button", { name: "سيضاف قريبًا" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
