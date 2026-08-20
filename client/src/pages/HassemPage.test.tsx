// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HassemPage from "./HassemPage";

const navigate = vi.fn();
let progressData: { reviews: Array<{ id: number; reason: string; dueAt: Date }>; errors: []; mastery: [] } | undefined;

vi.mock("wouter", () => ({ useLocation: () => ["/hassem", navigate] }));
vi.mock("@/lib/trpc", () => ({
  trpc: { progress: { summary: { useQuery: () => ({ data: progressData, isLoading: false }) } } },
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
  progressData = undefined;
});

describe("Hassem diagnostic handoff", () => {
  it("keeps the diagnostic blocked while a due review exists", () => {
    progressData = { reviews: [{ id: 1, reason: "خطأ متكرر", dueAt: new Date() }], errors: [], mastery: [] };
    render(<HassemPage />);
    const button = screen.getByRole("button", { name: "التشخيص بعد المراجعات" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("unlocks and hands off to the dedicated BAC diagnostic when no reviews are due", () => {
    progressData = { reviews: [], errors: [], mastery: [] };
    render(<HassemPage />);
    const button = screen.getByRole("button", { name: "ابدأ تشخيص الحسم" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(navigate).toHaveBeenCalledWith("/hassem/diagnostic");
  });
});
