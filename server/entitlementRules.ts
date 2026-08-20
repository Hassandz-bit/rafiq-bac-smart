export const subjectEntitlements = { math: "subject:math:access", physics: "subject:physics:access", natural_sciences: "subject:science:access" } as const;
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
