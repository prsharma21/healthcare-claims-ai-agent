import type { ClaimStatus, RiskLevel } from "./claim";

export interface StatusCount {
  status: ClaimStatus;
  count: number;
}

export interface ProcessingTrendPoint {
  /** ISO date (yyyy-mm-dd) */
  date: string;
  submitted: number;
  approved: number;
  denied: number;
  fraudReview: number;
}

export interface AgentTiming {
  agentName: string;
  averageSeconds: number;
}

export interface RiskCount {
  risk: RiskLevel;
  count: number;
}

export interface PayerCount {
  payerName: string;
  claims: number;
  amount: number;
}

export interface AnalyticsData {
  claimsByStatus: StatusCount[];
  processingTrend: ProcessingTrendPoint[];
  agentProcessingTime: AgentTiming[];
  fraudRiskDistribution: RiskCount[];
  payerDistribution: PayerCount[];
}
