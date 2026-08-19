import type { AppRole, SourceStatus, WorkflowState } from "./authorization";
import { canPublishContent } from "./authorization";

export function validWorkflowTransition(from: WorkflowState, to: WorkflowState) {
  const transitions: Record<WorkflowState, WorkflowState[]> = { draft: ["in_review", "archived"], in_review: ["draft", "approved", "archived"], approved: ["published", "draft", "archived"], published: ["archived"], archived: ["draft"] };
  return transitions[from].includes(to);
}
export function canTransitionContent(input: { role: AppRole; from: WorkflowState; to: WorkflowState; sourceStatus: SourceStatus | null; reviewerApproved: boolean }) {
  if (!validWorkflowTransition(input.from, input.to)) return false;
  if (input.to === "published") return canPublishContent({ role: input.role, workflowState: input.from, sourceStatus: input.sourceStatus, reviewerApproved: input.reviewerApproved });
  return input.role === "admin" || input.role === "content_editor" || input.role === "academic_reviewer";
}
