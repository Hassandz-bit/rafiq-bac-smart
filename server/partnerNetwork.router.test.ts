import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const partnerNetworkMocks = vi.hoisted(() => ({
  submitPartnerApplication: vi.fn(),
  getAdminPartnerApplications: vi.fn(),
  getPartnerNetworkSummary: vi.fn(),
  reviewPartnerApplication: vi.fn(),
  linkPartnerAccount: vi.fn(),
  captureReferral: vi.fn(),
  claimCapturedReferral: vi.fn(),
  getPartnerDashboard: vi.fn(),
  getCommissionTiers: vi.fn(),
  getPartnerOperatingSettings: vi.fn(),
  getPartnerFinanceAdminQueue: vi.fn(),
  getPartnerAuditLog: vi.fn(),
  getPartnerOperationsReport: vi.fn(),
  getPartnerPayoutSnapshot: vi.fn(),
  getPartnerCreditSnapshot: vi.fn(),
  recordEligibleConversion: vi.fn(),
  recordPartnerCreditEntry: vi.fn(),
  requestPartnerPayout: vi.fn(),
  reviewCommission: vi.fn(),
  reviewPayoutRequest: vi.fn(),
  saveCommissionTier: vi.fn(),
  savePartnerOperatingSettings: vi.fn(),
}));

vi.mock("./partnerNetwork", () => ({
  partnerTypes: ["support_school", "distribution_office"],
  partnerPayoutMethods: ["ccp", "baridimob", "bank_transfer", "other"],
  partnerApplicationStatuses: ["pending", "under_review", "approved", "rejected", "needs_information", "cancelled"],
  ...partnerNetworkMocks,
}));

import { appRouter } from "./routers";

type AppUser = NonNullable<TrpcContext["user"]>;

function callerFor(role: AppUser["role"] | null = "student") {
  const user = role === null ? null : {
    id: 41,
    openId: "partner-network-test-user",
    email: "tester@example.com",
    name: "Tester",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as AppUser;
  return appRouter.createCaller({ user, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
}

const validApplication = {
  partnerType: "support_school" as const,
  institutionName: "ثانوية الاختبار النموذجية",
  contactName: "أحمد مثال",
  phone: "0550123456",
  wilaya: "الجزائر",
  commune: "الجزائر الوسطى",
  address: "العنوان التشغيلي الكامل للاختبار",
  latitude: 36.7538,
  longitude: 3.0588,
};

describe("partner network tRPC contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a valid public application and normalizes coordinates for storage", async () => {
    partnerNetworkMocks.submitPartnerApplication.mockResolvedValue({ applicationId: 12, status: "pending" });
    await expect(callerFor(null).partners.submitApplication(validApplication)).resolves.toEqual({ applicationId: 12, status: "pending" });
    expect(partnerNetworkMocks.submitPartnerApplication).toHaveBeenCalledWith(expect.objectContaining({ latitude: "36.7538000", longitude: "3.0588000" }));
  });

  it("rejects malformed public applications before service execution", async () => {
    await expect(callerFor(null).partners.submitApplication({ ...validApplication, institutionName: "x" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(partnerNetworkMocks.submitPartnerApplication).not.toHaveBeenCalled();
  });

  it("denies partner-network administration to non-admin users", async () => {
    await expect(callerFor("student").administration.partnerApplications()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor("partner").administration.reviewPartnerApplication({ applicationId: 8, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor("student").administration.partnerOperatingSettings()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(partnerNetworkMocks.getAdminPartnerApplications).not.toHaveBeenCalled();
    expect(partnerNetworkMocks.reviewPartnerApplication).not.toHaveBeenCalled();
  });

  it("يحصر إعدادات التحقق والصرف اليدوي في المدير ولا يمرر أي أمر تحويل", async () => {
    partnerNetworkMocks.savePartnerOperatingSettings.mockResolvedValue({ verificationDays: 7, minimumPayoutDzd: 2000, payoutMethods: ["ccp", "baridimob"], automatedTransfersEnabled: false });
    await expect(callerFor("student").administration.savePartnerOperatingSettings({ verificationDays: 7, minimumPayoutDzd: 2000, payoutMethods: ["ccp"] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await callerFor("admin").administration.savePartnerOperatingSettings({ verificationDays: 7, minimumPayoutDzd: 2000, payoutMethods: ["ccp", "baridimob"] });
    expect(partnerNetworkMocks.savePartnerOperatingSettings).toHaveBeenCalledWith({ verificationDays: 7, minimumPayoutDzd: 2000, payoutMethods: ["ccp", "baridimob"], actorUserId: 41 });
  });

  it("يحصر إضافة أو خصم رصيد B في المدير ولا يمرر أي أمر دفع", async () => {
    partnerNetworkMocks.recordPartnerCreditEntry.mockResolvedValue({ entryId: 71, availableCredits: 24, paymentInitiated: false, entitlementChanged: false });
    const input = { partnerId: 33, entryType: "credit" as const, amount: 24, reasonAr: "تصحيح تشغيلي موثق", idempotencyKey: "credit-b-20260823-0001" };
    await expect(callerFor("partner").administration.recordPartnerCreditEntry(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await callerFor("admin").administration.recordPartnerCreditEntry(input);
    expect(partnerNetworkMocks.recordPartnerCreditEntry).toHaveBeenCalledWith({ ...input, actorUserId: 41 });
    await expect(callerFor("admin").administration.recordPartnerCreditEntry({ ...input, idempotencyKey: "قصير" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يعيد كشف رصيد B للشريك نفسه فقط من دون أوامر شراء أو وصول", async () => {
    partnerNetworkMocks.getPartnerCreditSnapshot.mockResolvedValue({ partnerId: 33, availableCredits: 24, entries: [], purchasingEnabled: false, paymentInitiated: false, entitlementChanged: false });
    await expect(callerFor("student").partners.creditSnapshot()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor("partner").partners.creditSnapshot()).resolves.toMatchObject({ partnerId: 33, purchasingEnabled: false, paymentInitiated: false });
    expect(partnerNetworkMocks.getPartnerCreditSnapshot).toHaveBeenCalledWith(41);
  });

  it("passes the authenticated admin as the reviewer and link actor", async () => {
    partnerNetworkMocks.reviewPartnerApplication.mockResolvedValue({ applicationId: 8, status: "approved", partnerId: 33, referralActive: true });
    partnerNetworkMocks.linkPartnerAccount.mockResolvedValue({ partnerId: 33, userId: 91, role: "partner" });
    const admin = callerFor("admin");
    await admin.administration.reviewPartnerApplication({ applicationId: 8, status: "approved", reviewNoteAr: "تمت مراجعة الطلب واعتماده تشغيليًا." });
    await admin.administration.linkPartnerAccount({ partnerId: 33, userId: 91 });
    expect(partnerNetworkMocks.reviewPartnerApplication).toHaveBeenCalledWith(expect.objectContaining({ applicationId: 8, actorUserId: 41 }));
    expect(partnerNetworkMocks.linkPartnerAccount).toHaveBeenCalledWith({ partnerId: 33, userId: 91, actorUserId: 41 });
  });

  it("validates a visitor referral before capture and forwards only the permitted attribution fields", async () => {
    partnerNetworkMocks.captureReferral.mockResolvedValue({ captured: true, referralId: 9, partnerId: 33, status: "captured" });
    await expect(callerFor(null).partners.captureReferral({ code: "SCHOOL-9", visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba", landingPage: "/diagnostic" })).resolves.toMatchObject({ captured: true });
    expect(partnerNetworkMocks.captureReferral).toHaveBeenCalledWith({ code: "SCHOOL-9", visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba", landingPage: "/diagnostic" });
    await expect(callerFor(null).partners.captureReferral({ code: "x", visitorToken: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("locks an existing captured attribution to the authenticated account only", async () => {
    partnerNetworkMocks.claimCapturedReferral.mockResolvedValue({ claimed: true, referralId: 9, partnerId: 33, status: "registered" });
    await callerFor("student").partners.claimCapturedReferral({ visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba" });
    expect(partnerNetworkMocks.claimCapturedReferral).toHaveBeenCalledWith({ visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba", userId: 41 });
    await expect(callerFor("student").partners.me()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("preserves the server-side self-referral block without exposing a partner-only route", async () => {
    partnerNetworkMocks.claimCapturedReferral.mockResolvedValue({ claimed: false, reason: "self_referral_blocked", referralId: 9, partnerId: 33, status: "invalid" });
    await expect(callerFor("partner").partners.claimCapturedReferral({ visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba" })).resolves.toMatchObject({ claimed: false, reason: "self_referral_blocked", status: "invalid" });
    expect(partnerNetworkMocks.claimCapturedReferral).toHaveBeenCalledWith({ visitorToken: "8d5ec5bd-55ef-4e5f-9630-0f10cb5920ba", userId: 41 });
  });
});
