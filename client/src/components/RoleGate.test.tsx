// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 7, role: "content_editor" }, loading: false }),
}));

import { RoleGate } from "./RoleGate";

describe("RoleGate mobile RTL shell", () => {
  it("uses a viewport-bounded full-width shell for a forbidden protected route", () => {
    const { container } = render(<RoleGate allowed={["student"]}>محمي</RoleGate>);
    expect(screen.getByText("هذه المساحة ليست متاحة لحسابك الآن.")).toBeTruthy();
    const shell = container.querySelector("section");
    expect(shell?.className).toContain("w-screen");
    expect(shell?.className).toContain("max-w-[100vw]");
    expect(shell?.className).toContain("overflow-x-hidden");
  });
});
