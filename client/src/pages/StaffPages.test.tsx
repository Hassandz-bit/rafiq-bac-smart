// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "./StaffPages";

const mutate = vi.fn();
vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="الهوية" /> }));
vi.mock("wouter", () => ({ useLocation: () => ["/admin", vi.fn()] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    administration: {
      planCatalog: { useQuery: () => ({ data: [{ id: 30002, code: "season_one_subject", nameAr: "باقة الموسم — مادة واحدة", priceDzd: 2900, isActive: true, entitlements: ["season:subject"] }], isLoading: false }) },
      grantPlanAccess: { useMutation: () => ({ mutate, isPending: false, data: undefined, error: null }) },
    },
  },
}));

afterEach(() => { cleanup(); mutate.mockReset(); });

describe("تعيين خطة الوصول الإداري", () => {
  it("يطابق عدد المواد مع الخطة ويرسل تعيين موسم يحفظ منحه المشتقة", () => {
    render(<AdminPage />);
    const assign = screen.getByRole("button", { name: "حفظ التعيين ومنح الاستحقاقات" }) as HTMLButtonElement;
    expect(assign.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("رقم الطالب الداخلي"), { target: { value: "42" } });
    fireEvent.change(screen.getByLabelText("خطة الوصول"), { target: { value: "season_two_subjects" } });
    fireEvent.click(screen.getByRole("button", { name: "الفيزياء" }));

    expect(assign.disabled).toBe(false);
    fireEvent.click(assign);
    expect(mutate).toHaveBeenCalledWith({ userId: 42, planCode: "season_two_subjects", subjects: ["math", "physics"] });
  });
});
