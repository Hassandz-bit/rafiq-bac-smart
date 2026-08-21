export type LocalPaymentStatus = {
  enabled: false;
  provider: "none";
  mode: "manual_only";
  billingFlowAvailable: false;
  messageAr: string;
  supportedFutureCapabilities: readonly ["checkout_intent", "payment_confirmation", "webhook_reconciliation"];
};

export const disabledLocalPaymentStatus: LocalPaymentStatus = {
  enabled: false,
  provider: "none",
  mode: "manual_only",
  billingFlowAvailable: false,
  messageAr: "الدفع الإلكتروني غير مفعّل. تغييرات الخطط تُسجل يدويًا من الإدارة فقط ولا يوجد رابط دفع أو تحصيل.",
  supportedFutureCapabilities: ["checkout_intent", "payment_confirmation", "webhook_reconciliation"],
};

export function getLocalPaymentStatus(): LocalPaymentStatus {
  return disabledLocalPaymentStatus;
}

export async function createDisabledCheckoutIntent(): Promise<never> {
  throw new Error("الدفع الإلكتروني غير مفعّل في هذه المنصة.");
}
