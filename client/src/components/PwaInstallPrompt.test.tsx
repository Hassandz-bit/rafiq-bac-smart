import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PwaInstallPrompt } from "./PwaInstallPrompt";

describe("PwaInstallPrompt", () => {
  it("يعرض طلب تثبيت المتصفح ويستدعي موجه التثبيت عند النقر", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted"; platform: string }> };
    Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }) });

    render(<PwaInstallPrompt />);
    fireEvent(window, event);
    fireEvent.click(await screen.findByRole("button", { name: "تثبيت التطبيق" }));

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it("يعرض خطوات Safari اليدوية عند فتح المنصة من iPhone", async () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });

    try {
      render(<PwaInstallPrompt />);
      fireEvent.click(await screen.findByRole("button", { name: "طريقة التثبيت على iPhone" }));
      const guide = screen.getByRole("dialog", { name: "خطوات تثبيت رفيق الباك على iPhone" });
      expect(guide).toBeTruthy();
      expect(guide.textContent).toContain("إضافة إلى الشاشة الرئيسية");
    } finally {
      Object.defineProperty(navigator, "userAgent", { configurable: true, value: originalUserAgent });
    }
  });
});
