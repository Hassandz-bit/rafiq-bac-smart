export type InternalPilotSnapshot = {
  sourceStatus: string;
  isInternalPilot: boolean;
  unitState: string;
  lessonState: string;
  itemTypes: string[];
  mindMapState: string;
  nodeCount: number;
  edgeCount: number;
  exerciseState: string;
  hintCount: number;
};

export function isSafeInternalMathPilot(snapshot: InternalPilotSnapshot) {
  const requiredItemTypes = ["concept", "formula", "step_by_step", "example", "bac_tip"];
  return (
    snapshot.sourceStatus === "historical_official" &&
    snapshot.isInternalPilot &&
    snapshot.unitState === "draft" &&
    snapshot.lessonState === "draft" &&
    requiredItemTypes.every(type => snapshot.itemTypes.includes(type)) &&
    snapshot.mindMapState === "draft" &&
    snapshot.nodeCount === 4 &&
    snapshot.edgeCount === 3 &&
    snapshot.exerciseState === "draft" &&
    snapshot.hintCount === 3
  );
}
