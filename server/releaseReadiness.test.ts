import { describe, expect, it, vi } from "vitest";

const curriculumMocks = vi.hoisted(() => ({ getStudioReviewQueue: vi.fn() }));
vi.mock("./curriculum", () => curriculumMocks);

import { getReleaseReadinessDashboard } from "./releaseReadiness";

describe("getReleaseReadinessDashboard", () => {
  it("يلخص الأدلة الواقعية وبوابات البشر من دون أي إجراء كتابة أو نشر", async () => {
    curriculumMocks.getStudioReviewQueue.mockResolvedValue([
      { reviewComponents: [{ draftContentAr: "نص عربي جوهري ".repeat(10), publicationBlocked: true }, { draftContentAr: "قصير", publicationBlocked: true }] },
      { reviewComponents: [{ draftContentAr: "نص عربي جوهري ".repeat(10), publicationBlocked: true }] },
    ]);

    await expect(getReleaseReadinessDashboard()).resolves.toMatchObject({
      isReadOnly: true,
      batch1: { inReviewPackages: 2, componentCount: 3, substantiveComponentCount: 2, blockedComponentCount: 3, publicationAllowed: false },
      technicalEvidence: { automatedTestCount: 171, testFileCount: 65, sourceBackupVerified: true, repositoryIntegrityVerified: true },
      humanAcceptanceGates: [{ key: "academic_review", status: "required" }, { key: "real_accounts", status: "required" }, { key: "published_bac", status: "required" }],
    });
    expect(curriculumMocks.getStudioReviewQueue).toHaveBeenCalledTimes(1);
  });
});
