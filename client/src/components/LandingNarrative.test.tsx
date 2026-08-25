import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingNarrative } from "./LandingNarrative";

afterEach(cleanup);

describe("مؤشرات لولي الأمر", () => {
  it("يعرض المؤشرات كقائمة معلومات وليس كأزرار خاملة", () => {
    render(<LandingNarrative onNavigate={vi.fn()} />);

    const list = screen.getByRole("list", { name: "مؤشرات توضيحية لولي الأمر" });
    expect(list.querySelectorAll("li")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "تقدم قابل للفهم" })).toBeNull();
    expect(screen.queryByRole("button", { name: "مراجعة منظمة" })).toBeNull();
  });
});
