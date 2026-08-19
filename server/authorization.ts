import type { User } from "../drizzle/schema";

export type AppRole = User["role"];
export type ContentRole = Extract<AppRole, "admin" | "content_editor" | "academic_reviewer">;
export type WorkflowState = "draft" | "in_review" | "approved" | "published" | "archived";
export type SourceStatus = "current_official" | "official_but_version_unconfirmed" | "historical_official" | "unverified";

export function hasAnyRole(role: AppRole, allowed: readonly AppRole[]) {
  return allowed.includes(role);
}

export function canEditContent(role: AppRole) {
  return hasAnyRole(role, ["admin", "content_editor"]);
}

export function canReviewContent(role: AppRole) {
  return hasAnyRole(role, ["admin", "academic_reviewer"]);
}

export function canPublishContent(input: {
  role: AppRole;
  workflowState: WorkflowState;
  sourceStatus: SourceStatus | null;
  reviewerApproved: boolean;
}) {
  return (
    canReviewContent(input.role) &&
    input.workflowState === "approved" &&
    input.sourceStatus === "current_official" &&
    input.reviewerApproved
  );
}

export function sourceAllowsAcademicPublishing(status: SourceStatus | null) {
  return status === "current_official";
}
