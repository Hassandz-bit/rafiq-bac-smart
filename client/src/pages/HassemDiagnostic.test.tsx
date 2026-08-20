// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HassemDiagnostic from "./HassemDiagnostic";

vi.mock("wouter", () => ({ useLocation: () => ["/hassem/diagnostic", vi.fn()] }));

afterEach(cleanup);

describe("Hassem BAC diagnostic responsive shell", () => {
  it("keeps the RTL diagnostic and answer controls inside explicit overflow-safe containers", () => {
    render(<HassemDiagnostic />);
    const main = screen.getByRole("main");
    const panel = screen.getByText("تأكد من ترتيب أولوياتك.").closest("section");
    const firstAnswer = screen.getByRole("button", { name: /التحقق من شرط التعويض/ });

    expect(main.className).toContain("w-full");
    expect(main.className).toContain("overflow-x-hidden");
    expect(panel?.className).toContain("w-full");
    expect(panel?.className).toContain("min-w-0");
    expect(panel?.className).toContain("overflow-hidden");
    expect(firstAnswer.className).toContain("min-w-0");
  });
});
