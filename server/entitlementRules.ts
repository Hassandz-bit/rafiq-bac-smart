export const subjectEntitlements = { math: "subject:math:access", physics: "subject:physics:access", natural_sciences: "subject:science:access" } as const;
export const hasmEntitlements = { math: "hasm:math", physics: "hasm:physics", natural_sciences: "hasm:natural_sciences" } as const;
export type EntitledSubject = keyof typeof subjectEntitlements;

const planSubjectCounts = {
  season_one_subject: 1,
  season_two_subjects: 2,
  season_three_subjects: 3,
  hasm_one_subject: 1,
  hasm_two_subjects: 2,
  hasm_three_subjects: 3,
} as const;

export type GrantablePlanCode = keyof typeof planSubjectCounts;

export function grantHasmFromSeason(entitlements: string[]) {
  const grants: string[] = [];
  (Object.keys(subjectEntitlements) as Array<keyof typeof subjectEntitlements>).forEach(subject => {
    if (entitlements.includes(subjectEntitlements[subject])) grants.push(hasmEntitlements[subject]);
  });
  return grants;
}

/** Returns the access claims that an administrator may provision internally, without collecting payment details. */
export function resolvePlanEntitlementGrant(input: { planCode: GrantablePlanCode; subjects: EntitledSubject[]; requiredSubjectCount?: number }) {
  const subjects = Array.from(new Set(input.subjects));
  const requiredCount = input.requiredSubjectCount ?? planSubjectCounts[input.planCode];
  if (subjects.length !== requiredCount) {
    throw new Error(`الخطة ${input.planCode} تتطلب اختيار ${requiredCount} مادة/مواد بالضبط.`);
  }
  const subjectClaims = subjects.map(subject => subjectEntitlements[subject]);
  const isSeason = input.planCode.startsWith("season_");
  return {
    subjects,
    entitlements: isSeason ? [...subjectClaims, ...grantHasmFromSeason(subjectClaims)] : subjects.map(subject => hasmEntitlements[subject]),
  } as const;
}

export function canAccessSubject(input: { subject: keyof typeof subjectEntitlements; entitlements: string[]; hasFreeUnit: boolean }) {
  return input.hasFreeUnit || input.entitlements.includes(subjectEntitlements[input.subject]);
}

export const subscriptionPlans = {
  one_subject: { subjectCount: 1, entitlements: [subjectEntitlements.math] },
  two_subjects: { subjectCount: 2, entitlements: [subjectEntitlements.math, subjectEntitlements.physics] },
  three_subjects: { subjectCount: 3, entitlements: [subjectEntitlements.math, subjectEntitlements.physics, subjectEntitlements.natural_sciences] },
} as const;

export function resolveUnitAccess(input: { subject: keyof typeof subjectEntitlements; entitlements: string[]; isFreeUnit: boolean }) {
  return {
    allowed: canAccessSubject({ subject: input.subject, entitlements: input.entitlements, hasFreeUnit: input.isFreeUnit }),
    reason: input.isFreeUnit ? "free_unit" : input.entitlements.includes(subjectEntitlements[input.subject]) ? "entitled_subject" : "subscription_required",
  } as const;
}
