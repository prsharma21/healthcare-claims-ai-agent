import type { FinalDecisionStatus, HistoricalClaim, RiskLevel } from "./claim";
import type { EligibilityStatus } from "./payer";

export type AgentStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type AgentType = "DOCUMENT" | "POLICY" | "CODING" | "FRAUD" | "DECISION";

export const AGENT_TYPES: readonly AgentType[] = ["DOCUMENT", "POLICY", "CODING", "FRAUD", "DECISION"];

export type PipelineStepKey =
  | "CLAIM_RECEIVED"
  | "DOCUMENT_EXTRACTION"
  | "POLICY_VALIDATION"
  | "MEDICAL_CODING"
  | "FRAUD_DETECTION"
  | "ENTERPRISE_VERIFICATION"
  | "DECISION";

export interface PipelineStep {
  key: PipelineStepKey;
  label: string;
  description: string;
  /** The agent responsible for this step, or null for system steps. */
  agent: AgentType | null;
  status: AgentStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  summary: string;
}

interface AgentResultBase {
  agent: AgentType;
  name: string;
  status: AgentStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  /** 0 to 1 */
  confidence: number;
  summary: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string | null;
  confidence: number;
}

export interface DocumentAgentResult extends AgentResultBase {
  agent: "DOCUMENT";
  extraction: {
    fields: ExtractedField[];
    fieldsExtracted: number;
    fieldsExpected: number;
    pagesProcessed: number;
    missingFields: string[];
  };
}

export type CoverageStatus = "COVERED" | "NOT_COVERED";
export type AuthorizationRequirement = "REQUIRED" | "NOT_REQUIRED";
export type AuthorizationEvidence = "ON_FILE" | "MISSING" | "NOT_APPLICABLE";

export interface PolicyAgentResult extends AgentResultBase {
  agent: "POLICY";
  validation: {
    policyId: string;
    eligibility: EligibilityStatus;
    coverage: CoverageStatus;
    authorization: AuthorizationRequirement;
    authorizationEvidence: AuthorizationEvidence;
    coveragePercent: number;
    reasoning: string;
  };
}

export type CodeType = "ICD10" | "CPT";

export interface CodeValidation {
  codeType: CodeType;
  code: string;
  description: string;
  valid: boolean;
  note: string;
}

export interface CodingAgentResult extends AgentResultBase {
  agent: "CODING";
  codes: CodeValidation[];
}

export type FraudCheckResult = "PASSED" | "WARNING" | "FAILED";

export interface FraudCheck {
  name: string;
  result: FraudCheckResult;
  detail: string;
}

export interface FraudAgentResult extends AgentResultBase {
  agent: "FRAUD";
  analysis: {
    riskLevel: RiskLevel;
    /** 0 to 1 */
    score: number;
    checks: FraudCheck[];
    matchingClaimId: string | null;
    historicalClaims: HistoricalClaim[];
    recommendation: string;
  };
}

export interface DecisionAgentResult extends AgentResultBase {
  agent: "DECISION";
  decision: {
    status: FinalDecisionStatus;
    reason: string;
    nextSteps: string[];
  };
}

export type AgentResult =
  | DocumentAgentResult
  | PolicyAgentResult
  | CodingAgentResult
  | FraudAgentResult
  | DecisionAgentResult;

export type ProcessingRunStatus = "NOT_STARTED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface ProcessingRun {
  claimId: string;
  status: ProcessingRunStatus;
  /** 0 to 100 */
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  steps: PipelineStep[];
  /** Results of agents that have completed so far. */
  agents: AgentResult[];
}

export interface AgentPerformance {
  agent: AgentType;
  name: string;
  averageDurationMs: number;
  successRate: number;
  runsToday: number;
}
