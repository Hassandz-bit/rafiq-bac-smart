// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FreeDiagnostic from "./FreeDiagnostic";

const setLocation = vi.fn();
vi.mock("wouter", () => ({ useLocation: () => ["/diagnostic", setLocation] }));

afterEach(() => { cleanup(); setLocation.mockReset(); });

describe("التشخيص المجاني دون تسجيل", () => {
  it("ينهي الأسئلة محليًا ويعرض تحويلات منفصلة للتجربة والموسم والحسم دون حفظ شخصي", () => {
    render(<FreeDiagnostic />);
    ["شرط التعويض", "اختيار كمية أو قياس دال", "تحديد الدليل", "إشارة المشتقة", "الوحدة"].forEach(option => fireEvent.click(screen.getByRole("button", { name: option })));
    expect(screen.getByText("تبقى نتيجتك في هذه الجلسة فقط")).toBeTruthy();
    expect(screen.getByText("لن نرسل إجاباتك أو نتيجتك قبل أن تختار إنشاء حساب.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "ابدأ التجربة" }));
    fireEvent.click(screen.getByRole("button", { name: "ابدأ موسمك" }));
    fireEvent.click(screen.getByRole("button", { name: "ابدأ مرحلة الحسم" }));
    expect(setLocation).toHaveBeenNthCalledWith(1, "/app?offer=trial");
    expect(setLocation).toHaveBeenNthCalledWith(2, "/app?offer=season");
    expect(setLocation).toHaveBeenNthCalledWith(3, "/hassem?offer=hasm");
  });
});
