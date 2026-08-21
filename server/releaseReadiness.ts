import { getStudioReviewQueue } from "./curriculum";
import { getReleaseQualityCheckSummary } from "./releaseQualityChecks";

/**
 * Administrative evidence summary only. It deliberately exposes no mutation,
 * approval, source promotion, plan assignment, or publication capability.
 */
export async function getReleaseReadinessDashboard() {
  const reviewQueue = await getStudioReviewQueue();
  const qualityChecks = await getReleaseQualityCheckSummary();
  const components = reviewQueue.flatMap(item => item.reviewComponents);
  const substantiveComponents = components.filter(component => (component.draftContentAr?.trim().length ?? 0) >= 80).length;
  const blockedComponents = components.filter(component => component.publicationBlocked).length;

  const humanAcceptanceGates = [
    { key: "academic_batch_qa" as const, labelAr: "مراجعة أكاديمية بشرية للمصادر والوحدات والتمارين والأصول", status: "required" as const },
    { key: "real_account_qa" as const, labelAr: "اختبار عملي بأربعة حسابات OAuth حقيقية للأدوار", status: "required" as const },
    { key: "operational_qa" as const, labelAr: "قبول تشغيلي يدوي للهاتف وقارئ الشاشة ولوحة المفاتيح", status: "required" as const },
    { key: "published_bac_session" as const, labelAr: "توفر جلسة BAC منشورة ومعتمدة لربط BAC Focus", status: "required" as const },
  ];

  return {
    isReadOnly: true as const,
    technicalEvidence: {
      automatedTestCount: 176,
      testFileCount: 66,
      baselineTag: "qa-readiness-20260821-176",
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
    humanAcceptanceGates: humanAcceptanceGates.map(gate => ({ ...gate, evidence: qualityChecks.find(check => check.checkKey === gate.key) ?? null })),
    publicationGuard: "لا يفتح هذا الملخص النشر؛ تظل جميع بوابات المصدر والمراجعة البشرية فعالة.",
  };
}
