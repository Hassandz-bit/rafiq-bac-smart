// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return <div><p>{`${theme}/${resolvedTheme}`}</p><button onClick={() => setTheme?.("light")}>light</button><button onClick={() => setTheme?.("system")}>system</button></div>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("يدعم الوضع الداكن والضوء والنظام مع سمة محفوظة", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const media = { matches: false, addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener), removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener) };
    vi.stubGlobal("matchMedia", vi.fn(() => media));
    render(<ThemeProvider defaultTheme="dark" switchable><ThemeProbe /></ThemeProvider>);
    expect(screen.getByText("dark/dark")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "light" }));
    expect(screen.getByText("light/light")).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "system" }));
    expect(screen.getByText("system/light")).toBeTruthy();
    expect(localStorage.getItem("theme")).toBe("system");
  });
});
