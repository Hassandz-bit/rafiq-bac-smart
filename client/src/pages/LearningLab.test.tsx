import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LearningLab from "./LearningLab";

const setLocation = vi.fn();

vi.mock("@/components/RoleGate", () => ({ RoleGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/MindMapCanvas", () => ({ MindMapCanvas: () => <div aria-label="خريطة مفاهيم تجريبية" /> }));
vi.mock("wouter", () => ({ useLocation: () => ["/lab", setLocation] }));

afterEach(() => { cleanup(); setLocation.mockReset(); });

describe("بطاقة شرح الدرس", () => {
  it("يعرض زر رجوع مسمى ويعيد المستخدم إلى رحلته", () => {
    render(<LearningLab />);
    fireEvent.click(screen.getByRole("button", { name: "العودة إلى رحلة التعلّم" }));
    expect(setLocation).toHaveBeenCalledWith("/app");
  });

  it("تبدّل النوع التوضيحي بالنقر وبالسهم مع حالة تبويب واضحة", () => {
    const { container } = render(<LearningLab />);
    expect(container.querySelector(".mfrac")).not.toBeNull();

    const concept = screen.getByRole("tab", { name: "مفهوم" });
    fireEvent.click(concept);
    expect(concept.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("ابدأ بالفكرة العامة قبل الانتقال إلى الرموز أو الحساب.")).toBeTruthy();

    const formula = screen.getByRole("tab", { name: "صيغة" });
    fireEvent.keyDown(formula, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "تعريف" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("ثبّت المعنى المقصود أولًا، ثم اربطه بمثال بسيط.")).toBeTruthy();
  });
});
