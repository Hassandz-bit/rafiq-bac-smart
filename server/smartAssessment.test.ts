import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), invokeLLM: vi.fn() }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));

import { generateSmartAssessment } from "./smartAssessment";

function queryResult(rows: unknown[]) {
  const query = {
    from: () => query,
    where: () => query,
    orderBy: () => query,
    limit: () => Promise.resolve(rows),
  };
  return query;
}

function studentSignalDb() {
  return {
    select: vi.fn()
      .mockReturnValueOnce(queryResult([
        { isCorrect: true, hintsUsed: 1, revealedSteps: 0, errorType: null },
        { isCorrect: false, hintsUsed: 2, revealedSteps: 1, errorType: "algebra" },
      ]))
      .mockReturnValueOnce(queryResult([{ errorType: "التحقق من شروط التعويض", occurrences: 3 }]))
      .mockReturnValueOnce(queryResult([{ id: 9 }]))
      .mockReturnValueOnce(queryResult([{ status: "understand" }])),
  };
}

describe("التقييم الذكي", () => {
  beforeEach(() => vi.resetAllMocks());

  it("يقدم بديلاً عربيًا حتميًا عندما لا تتاح قاعدة البيانات", async () => {
    mocks.getDb.mockResolvedValue(null);

    await expect(generateSmartAssessment(42)).resolves.toMatchObject({
      confidence: "low",
      attentionPoint: "تثبيت طريقة الحل",
      feedback: "دقة محاولاتك الحالية 0% بناءً على 0 محاولة مسجلة. ركّز على فهم سبب الخطأ قبل تكرار السؤال.",
    });
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("يرسل للذكاء الاصطناعي إشارات أداء مسجلة فقط ويعيد العقد العربي المنظّم", async () => {
    mocks.getDb.mockResolvedValue(studentSignalDb());
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ strengths: ["ثبات في فهم شروط التعويض"], attentionPoint: "انتبه للوحدات", feedback: "ملاحظة عربية قصيرة.", nextReview: "ابدأ بتمرين مراجعة واحد.", confidence: "medium" }) } }] });

    const result = await generateSmartAssessment(42);
    const invocation = mocks.invokeLLM.mock.calls[0]?.[0];
    const userPayload = JSON.parse(invocation.messages[1].content);

    expect(userPayload.signals).toEqual({ attempts: 2, correct: 1, hints: 3, reveals: 1, errors: ["التحقق من شروط التعويض"], dueReviews: 1, masteryStates: ["understand"] });
    expect(userPayload).not.toHaveProperty("userId");
    expect(invocation.response_format.json_schema.name).toBe("smart_assessment");
    expect(result).toEqual({ strengths: ["ثبات في فهم شروط التعويض"], attentionPoint: "انتبه للوحدات", feedback: "ملاحظة عربية قصيرة.", nextReview: "ابدأ بتمرين مراجعة واحد.", confidence: "medium" });
  });

  it("يحافظ على بديل عملي عند تعذر نموذج الذكاء الاصطناعي", async () => {
    mocks.getDb.mockResolvedValue(studentSignalDb());
    mocks.invokeLLM.mockRejectedValue(new Error("temporary model failure"));

    await expect(generateSmartAssessment(42)).resolves.toMatchObject({
      attentionPoint: "التحقق من شروط التعويض",
      nextReview: "ابدأ بأقدم عنصر في طابور المراجعة المستحق.",
      confidence: "low",
    });
  });
});
