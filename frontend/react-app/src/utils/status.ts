import type { BadgeTone } from "@/components/ui/badge";
import type { AgentStatus, AgentType, FraudCheckResult } from "@/types/agent";
import type { ClaimStatus, RiskLevel } from "@/types/claim";
import type { ApiClaimStatus, ApiClaimType } from "@/types/claimApi";
import type { IntegrationStatus } from "@/types/integration";

interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export const claimStatusMeta: Record<ClaimStatus, StatusMeta & { color: string; description: string }> = {
  PENDING: {
    label: "Pending",
    tone: "neutral",
    color: "#94a3b8",
    description: "Waiting for AI processing.",
  },
  PROCESSING: {
    label: "Processing",
    tone: "info",
    color: "#2563eb",
    description: "AI agents are processing this claim.",
  },
  APPROVED: {
    label: "Approved",
    tone: "success",
    color: "#16a34a",
    description: "Claim approved for payment.",
  },
  DENIED: {
    label: "Denied",
    tone: "danger",
    color: "#dc2626",
    description: "Claim denied.",
  },
  REQUEST_INFORMATION: {
    label: "Request Information",
    tone: "warning",
    color: "#d97706",
    description: "Additional information is required.",
  },
  FRAUD_REVIEW: {
    label: "Fraud Review",
    tone: "alert",
    color: "#ea580c",
    description: "Routed for manual fraud investigation.",
  },
};

export const riskMeta: Record<RiskLevel, StatusMeta & { color: string }> = {
  LOW: { label: "Low", tone: "success", color: "#16a34a" },
  MEDIUM: { label: "Medium", tone: "warning", color: "#d97706" },
  HIGH: { label: "High", tone: "danger", color: "#dc2626" },
};

export const agentStatusMeta: Record<AgentStatus, StatusMeta> = {
  PENDING: { label: "Pending", tone: "neutral" },
  RUNNING: { label: "Running", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const integrationStatusMeta: Record<IntegrationStatus, StatusMeta> = {
  CONNECTED: { label: "Connected", tone: "success" },
  DEGRADED: { label: "Degraded", tone: "warning" },
  DISCONNECTED: { label: "Disconnected", tone: "danger" },
};

export const fraudCheckMeta: Record<FraudCheckResult, StatusMeta> = {
  PASSED: { label: "Passed", tone: "success" },
  WARNING: { label: "Warning", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const agentNames: Record<AgentType, string> = {
  DOCUMENT: "Document Agent",
  POLICY: "Policy Agent",
  CODING: "Coding Agent",
  FRAUD: "Fraud Agent",
  DECISION: "Decision Agent",
};

/** Statuses returned by the FastAPI claims endpoints. */
export const apiClaimStatusMeta: Record<ApiClaimStatus, StatusMeta> = {
  RECEIVED: { label: "Received", tone: "info" },
  UPLOADED: { label: "Uploaded", tone: "info" },
  PROCESSING: { label: "Processing", tone: "info" },
  APPROVED: { label: "Approved", tone: "success" },
  DENIED: { label: "Denied", tone: "danger" },
  REQUEST_INFORMATION: { label: "Request Information", tone: "warning" },
  FRAUD_REVIEW: { label: "Fraud Review", tone: "alert" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const apiClaimTypeLabels: Record<ApiClaimType, string> = {
  INPATIENT: "Inpatient",
  OUTPATIENT: "Outpatient",
  EMERGENCY: "Emergency",
  PHARMACY: "Pharmacy",
};

export function riskFromScore(score: number): RiskLevel {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.3) return "MEDIUM";
  return "LOW";
}
