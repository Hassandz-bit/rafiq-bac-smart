import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboardPage } from "./AdminDashboardPage";

const mockedSetLocation = vi.hoisted(() => vi.fn());
const mockedLogout = vi.hoisted(() => vi.fn());

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/BrandMark", () => ({ BrandMark: () => <div aria-label="هوية المنصة" /> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "مدير الاختبار", role: "admin" }, logout: mockedLogout, loading: false }) }));
vi.mock("wouter", () => ({ useLocation: () => ["/admin", mockedSetLocation] }));

afterEach(() => { cleanup(); mockedSetLocation.mockReset(); mockedLogout.mockReset(); });

describe("لوحة المدير", () => {
  it("تفصل لوحة المدير عن قسم الاشتراكات وتعرض المداخل الإدارية الأساسية", () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole("heading", { name: "إدارة المنصة من نقطة واحدة." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /إدارة التشغيل والاشتراكات/ }));
    expect(mockedSetLocation).toHaveBeenCalledWith("/admin/subscriptions");
    fireEvent.click(screen.getByRole("button", { name: /استوديو المحتوى/ }));
    expect(mockedSetLocation).toHaveBeenCalledWith("/studio");
    fireEvent.click(screen.getByRole("button", { name: /المراجعة الأكاديمية/ }));
    expect(mockedSetLocation).toHaveBeenCalledWith("/review");
  });

  it("يعرض تسجيل خروج مدير واضحًا", () => {
    render(<AdminDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "تسجيل الخروج من حساب المدير" }));
    expect(mockedLogout).toHaveBeenCalledTimes(1);
  });

  it("يعرض ملاحظات التشغيل كمعلومات لا كأزرار خاملة", () => {
    render(<AdminDashboardPage />);
    expect(screen.getAllByRole("note")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "إشعارات المشتركين" })).toBeNull();
    expect(screen.queryByRole("button", { name: "مبدأ التشغيل" })).toBeNull();
  });
});
