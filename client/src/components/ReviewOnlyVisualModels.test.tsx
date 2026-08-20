// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewOnlyVisualModels } from "./ReviewOnlyVisualModels";

describe("نماذج المراجعة البصرية التفاعلية", () => {
  it("تغيّر حالتي نموذج التحولات والبنية داخل Studio فقط مع إبقاء قفل النشر ظاهرًا", () => {
    render(<ReviewOnlyVisualModels />);
    expect(screen.getAllByText(/النشر محظور/)).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "بيتا السالب" }));
    expect(screen.getByText("مسار بيتا السالب — مسودة مراجعة")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "تغيّر بنيوي" }));
    expect(screen.getByText("تغيّر في البنية — مسودة مراجعة")).toBeTruthy();
    expect(screen.getByText(/لا تدخلان مسار الطالب/)).toBeTruthy();
  });
});
