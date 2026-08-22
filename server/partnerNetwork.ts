import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { partnerApplications, partnerAuditLogs, partnerCommissionTiers, partnerCommissions, partnerOperatingSettings, partnerPayoutAllocations, partnerPayoutRequests, partnerReferralCodes, partnerReferrals, partners, studentPlanAssignments, users } from "../drizzle/schema";
import { getDb } from "./db";
import { encryptPayoutDestination, type PayoutMethod } from "./partnerPayoutSecurity";

export const partnerApplicationStatuses = ["pending", "under_review", "approved", "rejected", "needs_information", "cancelled"] as const;
export const partnerTypes = ["support_school", "distribution_office"] as const;
export const partnerPayoutMethods = ["ccp", "baridimob", "bank_transfer", "other"] as const;
export type PartnerApplicationStatus = typeof partnerApplicationStatuses[number];
export type PartnerType = typeof partnerTypes[number];

function normalizeCodeSeed(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 24) || "PARTNER";
}

function partnerCodeFor(applicationId: number, institutionName: string) {
  return `${normalizeCodeSeed(institutionName)}-${applicationId.toString(36).toUpperCase()}`.slice(0, 64);
}

function referralPath(code: string) {
  return `/?ref=${encodeURIComponent(code)}`;
}

function visitorTokenHash(visitorToken: string) {
  return createHash("sha256").update(visitorToken).digest("hex");
}

async function ensurePrimaryReferralCode(tx: any, partnerId: number, code: string) {
  const existing = await tx.select({ id: partnerReferralCodes.id, code: partnerReferralCodes.code })
    .from(partnerReferralCodes)
    .where(eq(partnerReferralCodes.partnerId, partnerId))
    .orderBy(desc(partnerReferralCodes.createdAt))
    .limit(1);
  if (existing[0]) return existing[0];
  const created = await tx.insert(partnerReferralCodes).values({ partnerId, code, landingPage: "/", isActive: true });
  return { id: Number(created[0].insertId), code };
}

export async function submitPartnerApplication(input: {
  partnerType: PartnerType;
  institutionName: string;
  tradeName?: string;
  contactName: string;
  contactPosition?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  wilaya: string;
  commune: string;
  address: string;
  latitude: string;
  longitude: string;
  websiteUrl?: string;
  facebookUrl?: string;
  notes?: string;
  expectedStudentReach?: number;
  discoverySource?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const created = await db.insert(partnerApplications).values({ ...input, status: "pending" });
  const applicationId = Number(created[0].insertId);
  return { applicationId, status: "pending" as const, messageAr: "وصل طلب الشراكة. سيتواصل فريقنا بعد مراجعته." };
}

export async function getAdminPartnerApplications(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({
      id: partnerApplications.id,
      partnerId: partners.id,
      partnerType: partnerApplications.partnerType,
      institutionName: partnerApplications.institutionName,
      contactName: partnerApplications.contactName,
      phone: partnerApplications.phone,
      email: partnerApplications.email,
      wilaya: partnerApplications.wilaya,
      commune: partnerApplications.commune,
      latitude: partnerApplications.latitude,
      longitude: partnerApplications.longitude,
      expectedStudentReach: partnerApplications.expectedStudentReach,
      status: partnerApplications.status,
      reviewNoteAr: partnerApplications.reviewNoteAr,
      internalNoteAr: partnerApplications.internalNoteAr,
      createdAt: partnerApplications.createdAt,
      reviewedAt: partnerApplications.reviewedAt,
    })
    .from(partnerApplications)
    .leftJoin(partners, eq(partners.applicationId, partnerApplications.id))
    .orderBy(desc(partnerApplications.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function reviewPartnerApplication(input: {
  applicationId: number;
  status: Exclude<PartnerApplicationStatus, "pending" | "cancelled">;
  reviewNoteAr?: string;
  internalNoteAr?: string;
  actorUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.transaction(async tx => {
    const application = await tx.select().from(partnerApplications).where(eq(partnerApplications.id, input.applicationId)).limit(1);
    if (!application[0]) return null;
    const previous = application[0];
    const values = {
      status: input.status,
      reviewNoteAr: input.reviewNoteAr?.trim() || null,
      internalNoteAr: input.internalNoteAr?.trim() || null,
      reviewedByUserId: input.actorUserId,
      reviewedAt: new Date(),
    } as const;
    await tx.update(partnerApplications).set(values).where(eq(partnerApplications.id, previous.id));

    let partnerId: number | null = null;
    if (input.status === "approved") {
      const existing = await tx.select({ id: partners.id }).from(partners).where(eq(partners.applicationId, previous.id)).limit(1);
      if (existing[0]) {
        partnerId = existing[0].id;
      } else {
        const code = partnerCodeFor(previous.id, previous.institutionName);
        const inserted = await tx.insert(partners).values({
          applicationId: previous.id,
          partnerType: previous.partnerType,
          status: "active",
          institutionName: previous.institutionName,
          tradeName: previous.tradeName,
          contactName: previous.contactName,
          contactPosition: previous.contactPosition,
          phone: previous.phone,
          whatsapp: previous.whatsapp,
          email: previous.email,
          wilaya: previous.wilaya,
          commune: previous.commune,
          address: previous.address,
          latitude: previous.latitude,
          longitude: previous.longitude,
          websiteUrl: previous.websiteUrl,
          facebookUrl: previous.facebookUrl,
          partnerCode: code,
          referralUrl: referralPath(code),
          referralActive: true,
          commissionModel: "marginal_tier",
        });
        partnerId = Number(inserted[0].insertId);
      }
      await ensurePrimaryReferralCode(tx, partnerId, partnerCodeFor(previous.id, previous.institutionName));
    }

    await tx.insert(partnerAuditLogs).values({
      partnerId,
      actorUserId: input.actorUserId,
      action: "partner_application_reviewed",
      entityType: "partner_application",
      entityId: previous.id,
      previousData: { status: previous.status, reviewNoteAr: previous.reviewNoteAr },
      nextData: { status: input.status, reviewNoteAr: values.reviewNoteAr, partnerId },
      noteAr: values.internalNoteAr,
    });
    return { applicationId: previous.id, status: input.status, partnerId, referralActive: input.status === "approved" };
  });
}

/** Link an already-authenticated OAuth account after approval; partner access is never provisioned from a public application form. */
export async function linkPartnerAccount(input: { partnerId: number; userId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const [partner] = await tx.select().from(partners).where(eq(partners.id, input.partnerId)).limit(1);
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
    if (!partner || !user) return null;
    const existingForUser = await tx.select({ id: partners.id }).from(partners).where(eq(partners.userId, input.userId)).limit(1);
    if (existingForUser[0] && existingForUser[0].id !== input.partnerId) throw new Error("هذا الحساب مرتبط بالفعل بشريك آخر.");
    await tx.update(partners).set({ userId: input.userId, status: "active", referralActive: true }).where(eq(partners.id, input.partnerId));
    await tx.update(users).set({ role: "partner" }).where(eq(users.id, input.userId));
    await tx.insert(partnerAuditLogs).values({
      partnerId: input.partnerId,
      actorUserId: input.actorUserId,
      action: "partner_account_linked",
      entityType: "partner",
      entityId: input.partnerId,
      previousData: { userId: partner.userId },
      nextData: { userId: input.userId, role: "partner" },
    });
    return { partnerId: input.partnerId, userId: input.userId, role: "partner" as const };
  });
}

export async function getPartnerByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(partners).where(and(eq(partners.userId, userId), eq(partners.status, "active"))).limit(1);
  return rows[0] ?? null;
}

/** Stores only a one-way hash of a browser-held token. The first valid capture is preserved and never creates a commission. */
export async function captureReferral(input: { code: string; visitorToken: string; landingPage?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const code = input.code.trim().toUpperCase();
  const [activeCode] = await db.select({ id: partnerReferralCodes.id, partnerId: partnerReferralCodes.partnerId, code: partnerReferralCodes.code, campaignCode: partnerReferralCodes.campaignCode })
    .from(partnerReferralCodes)
    .innerJoin(partners, eq(partners.id, partnerReferralCodes.partnerId))
    .where(and(eq(partnerReferralCodes.code, code), eq(partnerReferralCodes.isActive, true), eq(partners.status, "active"), eq(partners.referralActive, true)))
    .limit(1);
  if (!activeCode) return { captured: false as const, reason: "invalid_or_inactive" as const };
  const tokenHash = visitorTokenHash(input.visitorToken);
  const [existing] = await db.select({ id: partnerReferrals.id, partnerId: partnerReferrals.partnerId, status: partnerReferrals.status })
    .from(partnerReferrals).where(eq(partnerReferrals.visitorTokenHash, tokenHash)).orderBy(partnerReferrals.firstSeenAt).limit(1);
  if (existing) return { captured: false as const, reason: "first_capture_already_exists" as const, referralId: existing.id, partnerId: existing.partnerId, status: existing.status };
  try {
    const inserted = await db.insert(partnerReferrals).values({ partnerId: activeCode.partnerId, referralCodeId: activeCode.id, referralCode: activeCode.code, visitorTokenHash: tokenHash, campaignCode: activeCode.campaignCode, landingPage: input.landingPage?.startsWith("/") ? input.landingPage.slice(0, 500) : "/", status: "captured" });
    return { captured: true as const, referralId: Number(inserted[0].insertId), partnerId: activeCode.partnerId, status: "captured" as const };
  } catch (error) {
    const [firstCapture] = await db.select({ id: partnerReferrals.id, partnerId: partnerReferrals.partnerId, status: partnerReferrals.status }).from(partnerReferrals).where(eq(partnerReferrals.visitorTokenHash, tokenHash)).limit(1);
    if (firstCapture) return { captured: false as const, reason: "first_capture_already_exists" as const, referralId: firstCapture.id, partnerId: firstCapture.partnerId, status: firstCapture.status };
    throw error;
  }
}

/** Locks the captured referral to the first authenticated account. It never changes plans, content access, payments, or commissions. */
export async function claimCapturedReferral(input: { visitorToken: string; userId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const tokenHash = visitorTokenHash(input.visitorToken);
  return db.transaction(async tx => {
    const [alreadyLinked] = await tx.select({ id: partnerReferrals.id, partnerId: partnerReferrals.partnerId, status: partnerReferrals.status })
      .from(partnerReferrals).where(eq(partnerReferrals.userId, input.userId)).orderBy(partnerReferrals.firstSeenAt).limit(1);
    if (alreadyLinked) return { claimed: false as const, reason: "user_attribution_already_locked" as const, referralId: alreadyLinked.id, partnerId: alreadyLinked.partnerId, status: alreadyLinked.status };
    const [captured] = await tx.select({ id: partnerReferrals.id, partnerId: partnerReferrals.partnerId, status: partnerReferrals.status })
      .from(partnerReferrals).where(eq(partnerReferrals.visitorTokenHash, tokenHash)).orderBy(partnerReferrals.firstSeenAt).limit(1);
    if (!captured || captured.status !== "captured") return { claimed: false as const, reason: "no_unclaimed_capture" as const };
    const [partnerOwner] = await tx.select({ userId: partners.userId }).from(partners).where(eq(partners.id, captured.partnerId)).limit(1);
    if (partnerOwner?.userId === input.userId) {
      await tx.update(partnerReferrals).set({ status: "invalid", invalidReasonAr: "مُنع ربط الشريك بإحالته الذاتية." }).where(eq(partnerReferrals.id, captured.id));
      await tx.insert(partnerAuditLogs).values({ partnerId: captured.partnerId, actorUserId: input.userId, action: "self_referral_blocked", entityType: "partner_referral", entityId: captured.id, previousData: { status: captured.status }, nextData: { status: "invalid" }, noteAr: "مُنع ربط الشريك بإحالته الذاتية؛ لا ينشئ ذلك عمولة أو وصولًا." });
      return { claimed: false as const, reason: "self_referral_blocked" as const, referralId: captured.id, partnerId: captured.partnerId, status: "invalid" as const };
    }
    const now = new Date();
    await tx.update(partnerReferrals).set({ userId: input.userId, status: "registered", registeredAt: now, lockedAt: now }).where(eq(partnerReferrals.id, captured.id));
    await tx.insert(partnerAuditLogs).values({ partnerId: captured.partnerId, actorUserId: input.userId, action: "referral_attribution_locked", entityType: "partner_referral", entityId: captured.id, previousData: { status: captured.status }, nextData: { status: "registered" }, noteAr: "تم قفل أول إحالة صحيحة عند التسجيل؛ لا ينشئ ذلك عمولة أو وصولًا." });
    return { claimed: true as const, referralId: captured.id, partnerId: captured.partnerId, status: "registered" as const };
  });
}

export async function getPartnerDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const partner = await getPartnerByUserId(userId);
  if (!partner) return null;
  const referralCodes = await db.select({ id: partnerReferralCodes.id, code: partnerReferralCodes.code, campaignCode: partnerReferralCodes.campaignCode, landingPage: partnerReferralCodes.landingPage, isActive: partnerReferralCodes.isActive, createdAt: partnerReferralCodes.createdAt })
    .from(partnerReferralCodes).where(eq(partnerReferralCodes.partnerId, partner.id)).orderBy(desc(partnerReferralCodes.createdAt));
  const referralRows = await db.select({ status: partnerReferrals.status, count: sql<number>`count(*)` })
    .from(partnerReferrals).where(eq(partnerReferrals.partnerId, partner.id)).groupBy(partnerReferrals.status);
  const referralSummary = referralRows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.status]: Number(row.count) }), {});
  const [eligibleCountRow] = await db.select({ count: sql<number>`count(*)` }).from(partnerCommissions)
    .where(and(eq(partnerCommissions.partnerId, partner.id), sql`${partnerCommissions.status} not in ('cancelled', 'reversed')`));
  const eligibleCount = Number(eligibleCountRow?.count ?? 0);
  const tiers = await db.select({ id: partnerCommissionTiers.id, fromEligibleCount: partnerCommissionTiers.fromEligibleCount, toEligibleCount: partnerCommissionTiers.toEligibleCount, commissionRate: partnerCommissionTiers.commissionRate })
    .from(partnerCommissionTiers).where(and(eq(partnerCommissionTiers.partnerType, partner.partnerType), eq(partnerCommissionTiers.isActive, true))).orderBy(asc(partnerCommissionTiers.fromEligibleCount));
  const currentTier = tiers.filter(tier => tier.fromEligibleCount <= Math.max(eligibleCount, 1) && (tier.toEligibleCount === null || tier.toEligibleCount >= Math.max(eligibleCount, 1))).at(-1) ?? null;
  const nextTier = tiers.find(tier => tier.fromEligibleCount > eligibleCount) ?? null;
  const referredSubscribers = await db.select({ studentId: partnerReferrals.userId, assignmentId: studentPlanAssignments.id, productTier: studentPlanAssignments.productTier, assignedAt: studentPlanAssignments.assignedAt, expiresAt: studentPlanAssignments.expiresAt, assignmentActive: studentPlanAssignments.isActive, commissionStatus: partnerCommissions.status })
    .from(partnerReferrals).innerJoin(studentPlanAssignments, eq(partnerReferrals.userId, studentPlanAssignments.userId)).leftJoin(partnerCommissions, eq(partnerCommissions.studentPlanAssignmentId, studentPlanAssignments.id))
    .where(and(eq(partnerReferrals.partnerId, partner.id), sql`${partnerReferrals.userId} is not null`)).orderBy(desc(studentPlanAssignments.assignedAt)).limit(30);
  return {
    profile: { id: partner.id, partnerType: partner.partnerType, institutionName: partner.institutionName, tradeName: partner.tradeName, wilaya: partner.wilaya, commune: partner.commune, partnerCode: partner.partnerCode, referralPath: partner.referralUrl, referralActive: partner.referralActive, status: partner.status },
    referralCodes: referralCodes.map(code => ({ ...code, referralPath: referralPath(code.code) })),
    referralSummary,
    tierProgress: { eligibleCount, currentTier: currentTier ? { id: currentTier.id, rate: Number(currentTier.commissionRate), fromEligibleCount: currentTier.fromEligibleCount, toEligibleCount: currentTier.toEligibleCount } : null, nextTier: nextTier ? { rate: Number(nextTier.commissionRate), fromEligibleCount: nextTier.fromEligibleCount, remainingEligibleCount: Math.max(0, nextTier.fromEligibleCount - eligibleCount) } : null },
    referredSubscribers: referredSubscribers.map(row => ({ studentId: row.studentId, assignmentId: row.assignmentId, productTier: row.productTier, assignedAt: row.assignedAt, expiresAt: row.expiresAt, isActive: row.assignmentActive, commissionStatus: row.commissionStatus ?? "not_recorded" })),
    finance: { enabled: false as const, messageAr: "تُعرض العمولات المسجلة والموافق عليها فقط. لا ينشئ تسجيل الإحالة عمولة تلقائيًا، ولا ينفذ النظام تحويلًا آليًا." },
  };
}

export async function getCommissionTiers() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(partnerCommissionTiers).orderBy(asc(partnerCommissionTiers.partnerType), asc(partnerCommissionTiers.fromEligibleCount));
}

export async function getPartnerOperatingSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [settings] = await db.select().from(partnerOperatingSettings).orderBy(asc(partnerOperatingSettings.id)).limit(1);
  const payoutMethods = Array.isArray(settings?.payoutMethods)
    ? settings.payoutMethods.filter((value): value is PayoutMethod => typeof value === "string" && partnerPayoutMethods.includes(value as PayoutMethod))
    : [...partnerPayoutMethods];
  return { id: settings?.id ?? null, verificationDays: settings?.verificationDays ?? 7, minimumPayoutDzd: settings?.minimumPayoutDzd ?? 2000, payoutMethods: payoutMethods.length ? payoutMethods : [...partnerPayoutMethods], automatedTransfersEnabled: false as const };
}

export async function savePartnerOperatingSettings(input: { verificationDays: number; minimumPayoutDzd: number; payoutMethods: PayoutMethod[]; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const payoutMethods = Array.from(new Set(input.payoutMethods));
  if (!Number.isInteger(input.verificationDays) || input.verificationDays < 0 || input.verificationDays > 365 || !Number.isInteger(input.minimumPayoutDzd) || input.minimumPayoutDzd < 0 || !payoutMethods.length || payoutMethods.some(method => !partnerPayoutMethods.includes(method))) throw new Error("إعدادات التشغيل غير صالحة.");
  return db.transaction(async tx => {
    const [previous] = await tx.select().from(partnerOperatingSettings).orderBy(asc(partnerOperatingSettings.id)).limit(1);
    const values = { verificationDays: input.verificationDays, minimumPayoutDzd: input.minimumPayoutDzd, payoutMethods, updatedByUserId: input.actorUserId };
    if (previous) await tx.update(partnerOperatingSettings).set(values).where(eq(partnerOperatingSettings.id, previous.id));
    else await tx.insert(partnerOperatingSettings).values(values);
    await tx.insert(partnerAuditLogs).values({ actorUserId: input.actorUserId, action: "partner_operating_settings_updated", entityType: "partner_operating_settings", entityId: previous?.id ?? 0, previousData: previous ? { verificationDays: previous.verificationDays, minimumPayoutDzd: previous.minimumPayoutDzd, payoutMethods: previous.payoutMethods } : null, nextData: values, noteAr: "تحديث إعدادات مراجعة وصرف يدوي؛ لا يفعّل تحصيلًا أو تحويلًا آليًا." });
    return { ...values, automatedTransfersEnabled: false as const };
  });
}

export async function saveCommissionTier(input: { id?: number; partnerType: PartnerType; fromEligibleCount: number; toEligibleCount?: number | null; commissionRate: number; isActive: boolean; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.fromEligibleCount < 1 || (input.toEligibleCount !== null && input.toEligibleCount !== undefined && input.toEligibleCount < input.fromEligibleCount) || input.commissionRate < 0 || input.commissionRate > 100) throw new Error("حدود الشريحة أو النسبة غير صالحة.");
  const values = { partnerType: input.partnerType, fromEligibleCount: input.fromEligibleCount, toEligibleCount: input.toEligibleCount ?? null, commissionRate: input.commissionRate.toFixed(2), isActive: input.isActive };
  if (input.id) {
    await db.update(partnerCommissionTiers).set(values).where(eq(partnerCommissionTiers.id, input.id));
    return { ...values, id: input.id, updated: true as const };
  }
  const created = await db.insert(partnerCommissionTiers).values(values);
  return { ...values, id: Number(created[0].insertId), updated: false as const };
}

/** Creates a pending ledger entry only after an administrator documents the eligible conversion against an existing assignment. */
export async function recordEligibleConversion(input: { referralId: number; studentPlanAssignmentId: number; grossAmountDzd: number; orderReference?: string; notesAr: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.grossAmountDzd < 0 || !Number.isInteger(input.grossAmountDzd) || input.notesAr.trim().length < 10) throw new Error("يلزم مبلغ صحيح وملاحظة تحقق موثقة قبل إنشاء السجل.");
  return db.transaction(async tx => {
    const [referral] = await tx.select({ id: partnerReferrals.id, partnerId: partnerReferrals.partnerId, userId: partnerReferrals.userId, status: partnerReferrals.status })
      .from(partnerReferrals).where(eq(partnerReferrals.id, input.referralId)).limit(1);
    const [assignment] = await tx.select({ id: studentPlanAssignments.id, userId: studentPlanAssignments.userId, isActive: studentPlanAssignments.isActive })
      .from(studentPlanAssignments).where(eq(studentPlanAssignments.id, input.studentPlanAssignmentId)).limit(1);
    if (!referral || !assignment || !assignment.isActive || !referral.userId || referral.userId !== assignment.userId) throw new Error("لا تتطابق الإحالة المقفلة مع تعيين وصول نشط للطالب.");
    const [partner] = await tx.select({ id: partners.id, partnerType: partners.partnerType, status: partners.status }).from(partners).where(eq(partners.id, referral.partnerId)).limit(1);
    if (!partner || partner.status !== "active") throw new Error("الشريك غير نشط أو غير موجود.");
    const existing = await tx.select({ id: partnerCommissions.id }).from(partnerCommissions).where(eq(partnerCommissions.studentPlanAssignmentId, assignment.id)).limit(1);
    if (existing[0]) throw new Error("يوجد سجل عمولة بالفعل لتعيين الوصول هذا.");
    const prior = await tx.select({ count: sql<number>`count(*)` }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partner.id), sql`${partnerCommissions.status} not in ('cancelled', 'reversed')`));
    const eligibleNumber = Number(prior[0]?.count ?? 0) + 1;
    const tiers = await tx.select().from(partnerCommissionTiers).where(and(eq(partnerCommissionTiers.partnerType, partner.partnerType), eq(partnerCommissionTiers.isActive, true))).orderBy(desc(partnerCommissionTiers.fromEligibleCount));
    const tier = tiers.find(item => item.fromEligibleCount <= eligibleNumber && (item.toEligibleCount === null || item.toEligibleCount >= eligibleNumber));
    if (!tier) throw new Error("لا توجد شريحة عمولة مفعّلة تغطي هذا التحويل. اضبط الشرائح أولًا.");
    const commissionRate = Number(tier.commissionRate);
    const commissionAmountDzd = Math.floor(input.grossAmountDzd * commissionRate / 100);
    const created = await tx.insert(partnerCommissions).values({ partnerId: partner.id, referralId: referral.id, studentUserId: assignment.userId, studentPlanAssignmentId: assignment.id, orderReference: input.orderReference?.trim() || null, grossAmountDzd: input.grossAmountDzd, commissionRate: commissionRate.toFixed(2), commissionAmountDzd, tierId: tier.id, status: "pending", notesAr: input.notesAr.trim() });
    const commissionId = Number(created[0].insertId);
    await tx.update(partnerReferrals).set({ status: "eligible", eligibleAt: new Date() }).where(eq(partnerReferrals.id, referral.id));
    await tx.insert(partnerAuditLogs).values({ partnerId: partner.id, actorUserId: input.actorUserId, action: "commission_eligible_recorded", entityType: "partner_commission", entityId: commissionId, previousData: { referralStatus: referral.status }, nextData: { status: "pending", tierId: tier.id, commissionAmountDzd }, noteAr: input.notesAr.trim() });
    return { commissionId, status: "pending" as const, commissionAmountDzd, commissionRate, tierId: tier.id, financeMovementStarted: false as const };
  });
}

export async function reviewCommission(input: { commissionId: number; action: "approve" | "reverse"; noteAr: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.noteAr.trim().length < 5) throw new Error("أضف ملاحظة مراجعة موجزة وموثقة.");
  return db.transaction(async tx => {
    const [commission] = await tx.select().from(partnerCommissions).where(eq(partnerCommissions.id, input.commissionId)).limit(1);
    if (!commission) return null;
    if (input.action === "approve") {
      if (commission.status !== "pending") throw new Error("لا يمكن اعتماد سجل ليس قيد الانتظار.");
      await tx.update(partnerCommissions).set({ status: "approved", approvedAt: new Date(), approvedByUserId: input.actorUserId, notesAr: input.noteAr.trim() }).where(eq(partnerCommissions.id, commission.id));
    } else {
      if (commission.status === "paid" || commission.status === "reversed") throw new Error("لا يمكن عكس سجل مدفوع أو معكوس سابقًا.");
      await tx.update(partnerCommissions).set({ status: "reversed", reversedAt: new Date(), reversedByUserId: input.actorUserId, reversalReasonAr: input.noteAr.trim() }).where(eq(partnerCommissions.id, commission.id));
    }
    await tx.insert(partnerAuditLogs).values({ partnerId: commission.partnerId, actorUserId: input.actorUserId, action: input.action === "approve" ? "commission_approved" : "commission_reversed", entityType: "partner_commission", entityId: commission.id, previousData: { status: commission.status }, nextData: { status: input.action === "approve" ? "approved" : "reversed" }, noteAr: input.noteAr.trim() });
    return { commissionId: commission.id, status: input.action === "approve" ? "approved" as const : "reversed" as const, financeMovementStarted: false as const };
  });
}

export async function getPartnerPayoutSnapshot(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const partner = await getPartnerByUserId(userId);
  if (!partner) return null;
  const allocated = db.select({ commissionId: partnerPayoutAllocations.commissionId }).from(partnerPayoutAllocations);
  const availableCommissions = await db.select({ id: partnerCommissions.id, amountDzd: partnerCommissions.commissionAmountDzd, approvedAt: partnerCommissions.approvedAt, createdAt: partnerCommissions.createdAt })
    .from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partner.id), eq(partnerCommissions.status, "approved"), sql`${partnerCommissions.id} not in (${allocated})`)).orderBy(asc(partnerCommissions.createdAt));
  const requests = await db.select({ id: partnerPayoutRequests.id, amountDzd: partnerPayoutRequests.amountDzd, payoutMethod: partnerPayoutRequests.payoutMethod, destinationMasked: partnerPayoutRequests.destinationMasked, status: partnerPayoutRequests.status, requestedAt: partnerPayoutRequests.requestedAt, reviewNoteAr: partnerPayoutRequests.reviewNoteAr })
    .from(partnerPayoutRequests).where(eq(partnerPayoutRequests.partnerId, partner.id)).orderBy(desc(partnerPayoutRequests.requestedAt));
  return { availableCommissions, availableBalanceDzd: availableCommissions.reduce((sum, row) => sum + row.amountDzd, 0), requests };
}

export async function requestPartnerPayout(input: { userId: number; commissionIds: number[]; payoutMethod: PayoutMethod; destination: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const partner = await getPartnerByUserId(input.userId);
  if (!partner) throw new Error("لا يوجد سجل شريك فعّال لهذا الحساب.");
  const ids = Array.from(new Set(input.commissionIds)).filter(Number.isInteger);
  if (!ids.length) throw new Error("اختر سجل عمولة معتمدًا واحدًا على الأقل.");
  return db.transaction(async tx => {
    const rows = await tx.select({ id: partnerCommissions.id, amountDzd: partnerCommissions.commissionAmountDzd }).from(partnerCommissions).where(and(eq(partnerCommissions.partnerId, partner.id), eq(partnerCommissions.status, "approved"), inArray(partnerCommissions.id, ids)));
    if (rows.length !== ids.length) throw new Error("تتضمن الطلبات سجلًا غير معتمد أو لا يخص هذا الشريك.");
    const priorAllocations = await tx.select({ commissionId: partnerPayoutAllocations.commissionId }).from(partnerPayoutAllocations).where(inArray(partnerPayoutAllocations.commissionId, ids));
    if (priorAllocations.length) throw new Error("يتضمن الطلب سجل عمولة مخصصًا لطلب صرف سابق.");
    const amountDzd = rows.reduce((sum, row) => sum + row.amountDzd, 0);
    const [settings] = await tx.select({ minimumPayoutDzd: partnerOperatingSettings.minimumPayoutDzd, payoutMethods: partnerOperatingSettings.payoutMethods }).from(partnerOperatingSettings).orderBy(asc(partnerOperatingSettings.id)).limit(1);
    const allowedMethods = Array.isArray(settings?.payoutMethods) ? settings.payoutMethods.filter((value): value is PayoutMethod => typeof value === "string" && ["ccp", "baridimob", "bank_transfer", "other"].includes(value)) : ["ccp", "baridimob", "bank_transfer", "other"] as PayoutMethod[];
    const minimumPayoutDzd = settings?.minimumPayoutDzd ?? 2000;
    if (!allowedMethods.includes(input.payoutMethod)) throw new Error("طريقة الصرف غير مفعّلة في الإعدادات التشغيلية.");
    if (amountDzd < minimumPayoutDzd) throw new Error(`الحد الأدنى لطلب الصرف هو ${minimumPayoutDzd.toLocaleString("ar-DZ")} دج.`);
    const encrypted = encryptPayoutDestination(input.payoutMethod, input.destination);
    const created = await tx.insert(partnerPayoutRequests).values({ partnerId: partner.id, amountDzd, payoutMethod: input.payoutMethod, paymentDetailsCiphertext: encrypted.ciphertext, paymentDetailsIv: encrypted.iv, destinationMasked: encrypted.masked, status: "requested" });
    const payoutRequestId = Number(created[0].insertId);
    await tx.insert(partnerPayoutAllocations).values(rows.map(row => ({ payoutRequestId, commissionId: row.id, allocatedAmountDzd: row.amountDzd })));
    await tx.insert(partnerAuditLogs).values({ partnerId: partner.id, actorUserId: input.userId, action: "payout_requested", entityType: "partner_payout_request", entityId: payoutRequestId, nextData: { amountDzd, commissionIds: ids, payoutMethod: input.payoutMethod }, noteAr: "طلب صرف يدوي؛ لا يبدأ هذا الطلب تحويلًا آليًا." });
    return { payoutRequestId, amountDzd, destinationMasked: encrypted.masked, status: "requested" as const, transferInitiated: false as const };
  });
}

export async function reviewPayoutRequest(input: { payoutRequestId: number; action: "under_review" | "approve" | "reject" | "record_manual_payment"; noteAr: string; paymentReference?: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.noteAr.trim().length < 5) throw new Error("أضف ملاحظة مراجعة موثقة.");
  return db.transaction(async tx => {
    const [request] = await tx.select().from(partnerPayoutRequests).where(eq(partnerPayoutRequests.id, input.payoutRequestId)).limit(1);
    if (!request) return null;
    if (input.action === "record_manual_payment") {
      if (request.status !== "approved" || !input.paymentReference?.trim()) throw new Error("يلزم اعتماد الطلب ومرجع خارجي موثق لتسجيل دفع يدوي.");
      const allocations = await tx.select({ commissionId: partnerPayoutAllocations.commissionId }).from(partnerPayoutAllocations).where(eq(partnerPayoutAllocations.payoutRequestId, request.id));
      await tx.update(partnerPayoutRequests).set({ status: "paid", paidAt: new Date(), paidByUserId: input.actorUserId, paymentReference: input.paymentReference.trim(), reviewNoteAr: input.noteAr.trim() }).where(eq(partnerPayoutRequests.id, request.id));
      if (allocations.length) await tx.update(partnerCommissions).set({ status: "paid" }).where(inArray(partnerCommissions.id, allocations.map(row => row.commissionId)));
    } else {
      const status = input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "under_review";
      if (request.status === "paid") throw new Error("لا يمكن تعديل طلب صرف مسجّل كمدفوع.");
      await tx.update(partnerPayoutRequests).set({ status, reviewedAt: new Date(), reviewedByUserId: input.actorUserId, reviewNoteAr: input.noteAr.trim() }).where(eq(partnerPayoutRequests.id, request.id));
    }
    await tx.insert(partnerAuditLogs).values({ partnerId: request.partnerId, actorUserId: input.actorUserId, action: `payout_${input.action}`, entityType: "partner_payout_request", entityId: request.id, previousData: { status: request.status }, nextData: { status: input.action }, noteAr: input.noteAr.trim() });
    return { payoutRequestId: request.id, action: input.action, transferInitiated: false as const };
  });
}

/** Administrative queue intentionally excludes encrypted payout destination data. */
export async function getPartnerFinanceAdminQueue(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const commissions = await db.select({ id: partnerCommissions.id, partnerId: partnerCommissions.partnerId, partnerName: partners.tradeName, partnerInstitution: partners.institutionName, referralId: partnerCommissions.referralId, assignmentId: partnerCommissions.studentPlanAssignmentId, grossAmountDzd: partnerCommissions.grossAmountDzd, commissionRate: partnerCommissions.commissionRate, commissionAmountDzd: partnerCommissions.commissionAmountDzd, status: partnerCommissions.status, notesAr: partnerCommissions.notesAr, reversalReasonAr: partnerCommissions.reversalReasonAr, createdAt: partnerCommissions.createdAt })
    .from(partnerCommissions).innerJoin(partners, eq(partnerCommissions.partnerId, partners.id)).orderBy(desc(partnerCommissions.createdAt)).limit(limit);
  const payouts = await db.select({ id: partnerPayoutRequests.id, partnerId: partnerPayoutRequests.partnerId, partnerName: partners.tradeName, partnerInstitution: partners.institutionName, amountDzd: partnerPayoutRequests.amountDzd, payoutMethod: partnerPayoutRequests.payoutMethod, destinationMasked: partnerPayoutRequests.destinationMasked, status: partnerPayoutRequests.status, requestedAt: partnerPayoutRequests.requestedAt, reviewNoteAr: partnerPayoutRequests.reviewNoteAr, paymentReference: partnerPayoutRequests.paymentReference })
    .from(partnerPayoutRequests).innerJoin(partners, eq(partnerPayoutRequests.partnerId, partners.id)).orderBy(desc(partnerPayoutRequests.requestedAt)).limit(limit);
  return { commissions, payouts, safeguards: { automatedTransfersEnabled: false as const, destinationDetailsReturned: false as const } };
}

export async function getPartnerOperationsReport() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const mapPartners = await db.select({ id: partners.id, label: partners.tradeName, institutionName: partners.institutionName, partnerType: partners.partnerType, wilaya: partners.wilaya, commune: partners.commune, latitude: partners.latitude, longitude: partners.longitude, status: partners.status }).from(partners).where(and(eq(partners.status, "active"), sql`${partners.latitude} is not null`, sql`${partners.longitude} is not null`));
  const referralRows = await db.select({ status: partnerReferrals.status, count: sql<number>`count(*)` }).from(partnerReferrals).groupBy(partnerReferrals.status);
  const commissionRows = await db.select({ status: partnerCommissions.status, count: sql<number>`count(*)`, amountDzd: sql<number>`coalesce(sum(${partnerCommissions.commissionAmountDzd}), 0)` }).from(partnerCommissions).groupBy(partnerCommissions.status);
  const payoutRows = await db.select({ status: partnerPayoutRequests.status, count: sql<number>`count(*)`, amountDzd: sql<number>`coalesce(sum(${partnerPayoutRequests.amountDzd}), 0)` }).from(partnerPayoutRequests).groupBy(partnerPayoutRequests.status);
  return { mapPartners, referrals: referralRows.map(row => ({ status: row.status, count: Number(row.count) })), commissions: commissionRows.map(row => ({ status: row.status, count: Number(row.count), amountDzd: Number(row.amountDzd) })), payouts: payoutRows.map(row => ({ status: row.status, count: Number(row.count), amountDzd: Number(row.amountDzd) })), generatedFromRealRecords: true as const, automatedTransfersEnabled: false as const };
}

export async function getPartnerAuditLog(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select({ id: partnerAuditLogs.id, partnerId: partnerAuditLogs.partnerId, partnerName: partners.tradeName, partnerInstitution: partners.institutionName, actorUserId: partnerAuditLogs.actorUserId, action: partnerAuditLogs.action, entityType: partnerAuditLogs.entityType, entityId: partnerAuditLogs.entityId, noteAr: partnerAuditLogs.noteAr, createdAt: partnerAuditLogs.createdAt }).from(partnerAuditLogs).leftJoin(partners, eq(partnerAuditLogs.partnerId, partners.id)).orderBy(desc(partnerAuditLogs.createdAt)).limit(limit);
}

export async function getPartnerNetworkSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [row] = await db.select({
    totalPartners: sql<number>`count(*)`,
    activePartners: sql<number>`sum(case when ${partners.status} = 'active' then 1 else 0 end)`,
  }).from(partners);
  const [pending] = await db.select({ totalApplications: sql<number>`count(*)` }).from(partnerApplications).where(eq(partnerApplications.status, "pending"));
  return { totalPartners: Number(row?.totalPartners ?? 0), activePartners: Number(row?.activePartners ?? 0), pendingApplications: Number(pending?.totalApplications ?? 0) };
}
