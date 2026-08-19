export type SubjectCode = "math" | "physics" | "natural_sciences";
const classifications: Record<SubjectCode, readonly string[]> = {
  math: ["concept", "sign", "arithmetic", "wrong_method", "domain", "justification"],
  physics: ["formula", "unit_conversion", "substitution", "calculation", "interpretation"],
  natural_sciences: ["document_reading", "evidence", "relation", "reasoning", "conclusion", "methodology"],
};
export function errorTypesForSubject(subject: SubjectCode) { return classifications[subject]; }
