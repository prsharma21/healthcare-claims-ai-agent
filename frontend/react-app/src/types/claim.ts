import type { Patient } from "./patient";
import type { Payer, Policy } from "./payer";
import type { Provider } from "./provider";

export type ClaimStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "DENIED"
  | "REQUEST_INFORMATION"
  | "FRAUD_REVIEW";

export const CLAIM_STATUSES: readonly ClaimStatus[] = [
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "DENIED",
  "REQUEST_INFORMATION",
  "FRAUD_REVIEW",
];

/** Statuses the Decision Agent can produce. */
export type FinalDecisionStatus = Extract<ClaimStatus, "APPROVED" | "DENIED" | "REQUEST_INFORMATION" | "FRAUD_REVIEW">;

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const RISK_LEVELS: readonly RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

export type ClaimType = "INPATIENT" | "OUTPATIENT";

export interface ClaimDocument {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  contentType: "application/pdf";
  uploadedAt: string;
  /** Location in the (future) S3 bucket. Mock value for now. */
  storageKey: string;
}

export interface ClaimDecision {
  status: FinalDecisionStatus;
  reason: string;
  confidence: number;
  decidedAt: string;
}

/** A claim as it is stored (references other entities by ID). */
export interface ClaimRecord {
  id: string;
  patientId: string;
  providerId: string;
  payerId: string;
  policyId: string;
  claimType: ClaimType;
  diagnosisCode: string;
  diagnosisName: string;
  diagnosisDescription: string;
  procedureCode: string;
  procedureDescription: string;
  amount: number;
  dateOfService: string;
  submittedAt: string;
  status: ClaimStatus;
  riskLevel: RiskLevel | null;
  fraudScore: number | null;
  document: ClaimDocument;
  decision: ClaimDecision | null;
}

/** A claim enriched with display names, as returned to the UI. */
export interface Claim extends ClaimRecord {
  patientName: string;
  providerName: string;
  payerName: string;
}

export interface HistoricalClaim {
  claimId: string;
  dateOfService: string;
  procedureCode: string;
  amount: number;
  status: ClaimStatus;
}

export type ClaimDateRange = "ALL" | "TODAY" | "LAST_7_DAYS" | "LAST_30_DAYS";

export interface ClaimFilters {
  search: string;
  status: ClaimStatus | "ALL";
  payerId: string;
  providerId: string;
  risk: RiskLevel | "ALL";
  dateRange: ClaimDateRange;
}

export interface DashboardMetrics {
  totalClaims: number;
  pending: number;
  approved: number;
  denied: number;
  fraudReview: number;
  averageProcessingTimeSeconds: number;
}

export type AuditActorType = "USER" | "SYSTEM" | "AGENT" | "INTEGRATION";

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorType: AuditActorType;
  action: string;
  detail: string;
}

export interface ClaimDetail {
  claim: Claim;
  patient: Patient;
  provider: Provider;
  payer: Payer;
  policy: Policy;
  auditTrail: AuditEvent[];
}
