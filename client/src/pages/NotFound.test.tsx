import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NotFound from "./NotFound";

const setLocation = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/404", setLocation] }));

afterEach(() => { cleanup(); setLocation.mockReset(); });

describe("شاشة عدم العثور", () => {
  it("تعيد المستخدم إلى الرئيسية عبر الزر العربي الظاهر", () => {
    render(<NotFound />);
    fireEvent.click(screen.getByRole("button", { name: "العودة للرئيسية" }));
    expect(setLocation).toHaveBeenCalledWith("/");
  });
});
