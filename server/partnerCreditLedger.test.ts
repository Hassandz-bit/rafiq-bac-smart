import { describe, expect, it } from "vitest";
import { calculatePartnerCreditBalance } from "./partnerCreditLedger";

describe("دفتر رصيد B", () => {
  it("يضيف رصيدًا صحيحًا من دون أي دلالة دفع", () => {
    expect(calculatePartnerCreditBalance({ availableCredits: 5, entryType: "credit", amount: 12 })).toBe(17);
  });

  it("يخصم الرصيد فقط داخل المتاح", () => {
    expect(calculatePartnerCreditBalance({ availableCredits: 17, entryType: "debit", amount: 12 })).toBe(5);
    expect(() => calculatePartnerCreditBalance({ availableCredits: 5, entryType: "debit", amount: 6 })).toThrow("الرصيد المتاح غير كافٍ");
  });

  it("يرفض المقادير غير الصحيحة والحالة السالبة", () => {
    expect(() => calculatePartnerCreditBalance({ availableCredits: 0, entryType: "credit", amount: 0 })).toThrow("موجب");
    expect(() => calculatePartnerCreditBalance({ availableCredits: -1, entryType: "credit", amount: 1 })).toThrow("حالة الرصيد");
  });
});
