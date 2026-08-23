// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({ user: null as { role: string } | null, navigate: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock("@/contexts/ThemeContext", () => ({ useTheme: () => ({ theme: "dark", setTheme: vi.fn() }) }));
vi.mock("@/hooks/useScrollReveal", () => ({ useScrollReveal: vi.fn() }));
vi.mock("@/components/LandingNarrative", () => ({ LandingNarrative: () => <div /> }));
vi.mock("@/components/LaunchStory", () => ({ LaunchStory: () => <div /> }));
vi.mock("@/components/ScientificCanvas", () => ({ ScientificCanvas: () => <div /> }));
vi.mock("wouter", () => ({ useLocation: () => ["/", state.navigate] }));

import Home from "./Home";

afterEach(() => { cleanup(); state.user = null; state.navigate.mockReset(); });

describe("التنقل العام الواعي بالدور", () => {
  it("يوجه الزائر غير المسجل من بطاقة مادة إلى التشخيص العام بدل صفحة مواد محمية", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /الرياضيات/ }));
    expect(state.navigate).toHaveBeenCalledWith("/diagnostic");
  });

  it("يفتح للمدير معاينة المواد بدل إعادته إلى صفحة الإدارة", () => {
    state.user = { role: "admin" };
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /الرياضيات/ }));
    expect(state.navigate).toHaveBeenCalledWith("/subjects");
  });

  it("يفتح صفحة المواد للحساب الطالب فقط", () => {
    state.user = { role: "student" };
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /الرياضيات/ }));
    expect(state.navigate).toHaveBeenCalledWith("/subjects");
  });

  it("يبقي الشريك في مساحته ولا يفتح له معاينة الطالب", () => {
    state.user = { role: "partner" };
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /الرياضيات/ }));
    expect(state.navigate).toHaveBeenCalledWith("/partner");
  });
});
