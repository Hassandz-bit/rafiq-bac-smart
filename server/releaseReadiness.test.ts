import { describe, expect, it, vi } from "vitest";

const curriculumMocks = vi.hoisted(() => ({ getStudioReviewQueue: vi.fn() }));
const qualityMocks = vi.hoisted(() => ({ getReleaseQualityCheckSummary: vi.fn() }));
vi.mock("./curriculum", () => curriculumMocks);
vi.mock("./releaseQualityChecks", () => qualityMocks);

import { getReleaseReadinessDashboard } from "./releaseReadiness";

describe("getReleaseReadinessDashboard", () => {
  it("يلخص الأدلة الواقعية وبوابات البشر من دون أي إجراء كتابة أو نشر", async () => {
    curriculumMocks.getStudioReviewQueue.mockResolvedValue([
      { reviewComponents: [{ draftContentAr: "نص عربي جوهري ".repeat(10), publicationBlocked: true }, { draftContentAr: "قصير", publicationBlocked: true }] },
      { reviewComponents: [{ draftContentAr: "نص عربي جوهري ".repeat(10), publicationBlocked: true }] },
    ]);
    qualityMocks.getReleaseQualityCheckSummary.mockResolvedValue([
      { checkKey: "academic_batch_qa", latestEvidence: "محضر مراجعة معلق", recordedAt: new Date(), actorUserId: 5 },
      { checkKey: "real_account_qa", latestEvidence: null, recordedAt: null, actorUserId: null },
      { checkKey: "operational_qa", latestEvidence: null, recordedAt: null, actorUserId: null },
      { checkKey: "published_bac_session", latestEvidence: null, recordedAt: null, actorUserId: null },
    ]);

    await expect(getReleaseReadinessDashboard()).resolves.toMatchObject({
      isReadOnly: true,
      batch1: { inReviewPackages: 2, componentCount: 3, substantiveComponentCount: 2, blockedComponentCount: 3, publicationAllowed: false },
      technicalEvidence: { automatedTestCount: 177, testFileCount: 67, sourceBackupVerified: true, repositoryIntegrityVerified: true },
      humanAcceptanceGates: [{ key: "academic_batch_qa", status: "required", evidence: { latestEvidence: "محضر مراجعة معلق" } }, { key: "real_account_qa", status: "required" }, { key: "operational_qa", status: "required" }, { key: "published_bac_session", status: "required" }],
    });
    expect(curriculumMocks.getStudioReviewQueue).toHaveBeenCalledTimes(1);
    expect(qualityMocks.getReleaseQualityCheckSummary).toHaveBeenCalledTimes(1);
  });
});
