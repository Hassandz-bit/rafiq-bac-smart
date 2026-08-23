export type PartnerCreditEntryType = "credit" | "debit";

/** Pure ledger arithmetic: the caller persists the immutable entry and resulting balance atomically. */
export function calculatePartnerCreditBalance(input: { availableCredits: number; entryType: PartnerCreditEntryType; amount: number }) {
  if (!Number.isInteger(input.availableCredits) || input.availableCredits < 0) throw new Error("حالة الرصيد الحالية غير صالحة.");
  if (!Number.isInteger(input.amount) || input.amount <= 0 || input.amount > 1_000_000) throw new Error("يجب أن يكون مقدار الرصيد عددًا صحيحًا موجبًا ضمن الحد التشغيلي.");
  if (input.entryType === "debit" && input.availableCredits < input.amount) throw new Error("الرصيد المتاح غير كافٍ لهذه العملية.");
  return input.entryType === "credit" ? input.availableCredits + input.amount : input.availableCredits - input.amount;
}
