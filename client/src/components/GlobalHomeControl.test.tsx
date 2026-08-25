import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalHomeControl } from "../App";

const setLocation = vi.hoisted(() => vi.fn());
let currentLocation = "/lab";

vi.mock("wouter", () => ({
  Route: () => null,
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLocation: () => [currentLocation, setLocation],
}));
vi.mock("../components/ErrorBoundary", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../components/ReferralAttributionCapture", () => ({ ReferralAttributionCapture: () => null }));
vi.mock("../components/PwaInstallPrompt", () => ({ PwaInstallPrompt: () => null }));
vi.mock("sonner", () => ({ Toaster: () => null }));

afterEach(() => { cleanup(); currentLocation = "/lab"; setLocation.mockReset(); });

describe("زر الرئيسية العالمي", () => {
  it("يظهر في الصفحة الفرعية ويعيد إلى الصفحة الرئيسية", () => {
    render(<GlobalHomeControl />);
    fireEvent.click(screen.getByRole("button", { name: "الرجوع إلى الصفحة الرئيسية" }));
    expect(setLocation).toHaveBeenCalledWith("/");
  });

  it("يختفي في الصفحة الرئيسية", () => {
    currentLocation = "/";
    render(<GlobalHomeControl />);
    expect(screen.queryByRole("button", { name: "الرجوع إلى الصفحة الرئيسية" })).toBeNull();
  });

  it("لا يكرر زر الرجوع في المسارات التي تملك عودة خاصة بها", () => {
    currentLocation = "/partners/apply";
    render(<GlobalHomeControl />);
    expect(screen.queryByRole("button", { name: "الرجوع إلى الصفحة الرئيسية" })).toBeNull();
  });
});
