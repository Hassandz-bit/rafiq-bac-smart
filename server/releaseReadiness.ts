import { getStudioReviewQueue } from "./curriculum";

/**
 * Administrative evidence summary only. It deliberately exposes no mutation,
 * approval, source promotion, plan assignment, or publication capability.
 */
export async function getReleaseReadinessDashboard() {
  const reviewQueue = await getStudioReviewQueue();
  const components = reviewQueue.flatMap(item => item.reviewComponents);
  const substantiveComponents = components.filter(component => (component.draftContentAr?.trim().length ?? 0) >= 80).length;
  const blockedComponents = components.filter(component => component.publicationBlocked).length;

  return {
    isReadOnly: true as const,
    technicalEvidence: {
      automatedTestCount: 171,
      testFileCount: 65,
      baselineTag: "qa-readiness-20260821-171",
      sourceBackupVerified: true,
      repositoryIntegrityVerified: true,
    },
    batch1: {
      inReviewPackages: reviewQueue.length,
      componentCount: components.length,
      substantiveComponentCount: substantiveComponents,
      blockedComponentCount: blockedComponents,
      publicationAllowed: false,
    },
    humanAcceptanceGates: [
      { key: "academic_review", labelAr: "مراجعة أكاديمية بشرية للمصادر والوحدات والتمارين والأصول", status: "required" as const },
      { key: "real_accounts", labelAr: "اختبار عملي بأربعة حسابات OAuth حقيقية للأدوار", status: "required" as const },
      { key: "published_bac", labelAr: "توفر جلسة BAC منشورة ومعتمدة لربط BAC Focus", status: "required" as const },
    ],
    publicationGuard: "لا يفتح هذا الملخص النشر؛ تظل جميع بوابات المصدر والمراجعة البشرية فعالة.",
  };
}
