import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button loading state", () => {
  it("يعرض حالة تحميل ويمنع النقر المتكرر", () => {
    render(<Button isLoading loadingText="جارٍ الحفظ…">حفظ</Button>);
    const button = screen.getByRole("button", { name: "جارٍ الحفظ…" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });
});
