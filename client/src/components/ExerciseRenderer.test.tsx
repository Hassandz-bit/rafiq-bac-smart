// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExerciseResponsePanel } from "./ExerciseRenderer";

describe("ضوابط الإجابة المعرّفة بالتمرين", () => {
  it("يبني المطابقة والترتيب والصورة التفاعلية من answerDefinition", () => {
    render(<ExerciseResponsePanel type="matching" definition={{ pairs: [{ leftAr: "المصطلح الحقيقي", rightAr: "البيان الحقيقي" }] }} />);
    expect(screen.getByText("المصطلح الحقيقي")).toBeTruthy();
    expect(screen.getByRole("option", { name: "البيان الحقيقي" })).toBeTruthy();

    cleanup();
    render(<ExerciseResponsePanel type="ordering" definition={{ items: ["الخطوة الحقيقية الأولى", "الخطوة الحقيقية الثانية"] }} />);
    expect(screen.getByText(/البطاقة الخطوة الحقيقية الأولى/)).toBeTruthy();

    cleanup();
    render(<ExerciseResponsePanel type="interactive_image" definition={{ regions: ["منطقة المصدر"] }} />);
    expect(screen.getByRole("button", { name: "اختيار منطقة المصدر" })).toBeTruthy();
  });

  it("يبني الاختيارات المتعددة وصح أو خطأ وحقول الإدخال من تعريف الإجابة", () => {
    render(<ExerciseResponsePanel type="multi_select" definition={{ choices: [{ labelAr: "اختيار متعدد حقيقي" }] }} />);
    expect(screen.getByRole("button", { name: "اختيار متعدد حقيقي" })).toBeTruthy();

    cleanup();
    render(<ExerciseResponsePanel type="true_false" definition={{ choices: [{ labelAr: "العبارة صحيحة حسب المصدر" }, { labelAr: "العبارة خاطئة حسب المصدر" }] }} />);
    expect(screen.getByRole("button", { name: "العبارة صحيحة حسب المصدر" })).toBeTruthy();

    cleanup();
    render(<ExerciseResponsePanel type="numeric" definition={{ placeholderAr: "أدخل القيمة بوحدة SI" }} />);
    expect(screen.getByPlaceholderText("أدخل القيمة بوحدة SI")).toBeTruthy();

    cleanup();
    render(<ExerciseResponsePanel type="math_expression" definition={{ formatAr: "اكتب التعبير المبسط" }} />);
    expect(screen.getByPlaceholderText("اكتب التعبير المبسط")).toBeTruthy();
  });
});
