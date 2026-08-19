export const subjectEntitlements = { math: "subject:math:access", physics: "subject:physics:access", natural_sciences: "subject:science:access" } as const;
export function canAccessSubject(input: { subject: keyof typeof subjectEntitlements; entitlements: string[]; hasFreeUnit: boolean }) {
  return input.hasFreeUnit || input.entitlements.includes(subjectEntitlements[input.subject]);
}
