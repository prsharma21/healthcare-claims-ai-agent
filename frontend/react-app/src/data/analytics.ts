import type { AnalyticsData } from "@/types/analytics";
import type { DashboardMetrics } from "@/types/claim";
import { toIsoDate } from "@/utils/date";

/** Portfolio-level numbers (all claims in the system, not only the sample claims in claims.ts). */
export const dashboardMetrics: DashboardMetrics = {
  totalClaims: 1248,
  pending: 43,
  approved: 876,
  denied: 291,
  fraudReview: 38,
  averageProcessingTimeSeconds: 138,
};

const trend = [
  { submitted: 168, approved: 112, denied: 41, fraudReview: 5 },
  { submitted: 182, approved: 125, denied: 43, fraudReview: 6 },
  { submitted: 175, approved: 121, denied: 40, fraudReview: 4 },
  { submitted: 194, approved: 138, denied: 45, fraudReview: 7 },
  { submitted: 188, approved: 132, denied: 42, fraudReview: 6 },
  { submitted: 161, approved: 115, denied: 38, fraudReview: 5 },
  { submitted: 180, approved: 133, denied: 42, fraudReview: 5 },
];

function lastSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return toIsoDate(date);
  });
}

export function getAnalyticsData(): AnalyticsData {
  const dates = lastSevenDays();
  return {
    claimsByStatus: [
      { status: "APPROVED", count: dashboardMetrics.approved },
      { status: "DENIED", count: dashboardMetrics.denied },
      { status: "PENDING", count: dashboardMetrics.pending },
      { status: "FRAUD_REVIEW", count: dashboardMetrics.fraudReview },
    ],
    processingTrend: trend.map((point, index) => ({ date: dates[index], ...point })),
    agentProcessingTime: [
      { agentName: "Document Agent", averageSeconds: 3.2 },
      { agentName: "Policy Agent", averageSeconds: 1.8 },
      { agentName: "Coding Agent", averageSeconds: 1.2 },
      { agentName: "Fraud Agent", averageSeconds: 2.4 },
      { agentName: "Decision Agent", averageSeconds: 0.9 },
    ],
    fraudRiskDistribution: [
      { risk: "LOW", count: 1034 },
      { risk: "MEDIUM", count: 176 },
      { risk: "HIGH", count: 38 },
    ],
    payerDistribution: [
      { payerName: "ABC Insurance", claims: 812, amount: 41_850_000 },
      { payerName: "XYZ Insurance", claims: 436, amount: 19_420_000 },
    ],
  };
}
