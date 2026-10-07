import type { EvaluationMetric, EvaluationTestCase } from "@/types/evaluation";

export const evaluationDatasetName = "golden_claims_v1 (40 synthetic claims)";
export const evaluationFramework = "DeepEval (mock)";

export const evaluationMetrics: EvaluationMetric[] = [
  {
    key: "faithfulness",
    label: "RAG Faithfulness",
    value: 0.92,
    target: 0.85,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "Share of answer statements supported by the retrieved context.",
  },
  {
    key: "answer_relevance",
    label: "Answer Relevance",
    value: 0.94,
    target: 0.85,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "How directly the answer addresses the coverage question.",
  },
  {
    key: "context_relevance",
    label: "Context Relevance",
    value: 0.89,
    target: 0.8,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "How relevant the retrieved chunks are to the query.",
  },
  {
    key: "context_precision",
    label: "Context Precision",
    value: 0.91,
    target: 0.8,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "Whether the most relevant chunks are ranked highest.",
  },
  {
    key: "decision_accuracy",
    label: "Decision Accuracy",
    value: 0.95,
    target: 0.9,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "Final decisions matching the expected decision.",
  },
  {
    key: "agent_success_rate",
    label: "Agent Success Rate",
    value: 0.97,
    target: 0.95,
    unit: "PERCENT",
    lowerIsBetter: false,
    description: "Agent runs that completed without errors.",
  },
  {
    key: "average_latency",
    label: "Average Latency",
    value: 2.1,
    target: 3,
    unit: "SECONDS",
    lowerIsBetter: true,
    description: "Average end-to-end agent processing time per claim.",
  },
];

/** A sample of the evaluation dataset: one test per seeded claim. */
export const evaluationTests: EvaluationTestCase[] = [
  { testId: "TEST001", claimId: "CLM10001", scenario: "Covered inpatient care", expectedDecision: "APPROVED", actualDecision: "APPROVED", result: "PASS", latencyMs: 1940 },
  { testId: "TEST002", claimId: "CLM10002", scenario: "Inactive eligibility", expectedDecision: "DENIED", actualDecision: "DENIED", result: "PASS", latencyMs: 1620 },
  { testId: "TEST003", claimId: "CLM10003", scenario: "Excluded cosmetic procedure", expectedDecision: "DENIED", actualDecision: "DENIED", result: "PASS", latencyMs: 1780 },
  { testId: "TEST004", claimId: "CLM10004", scenario: "Missing prior authorization", expectedDecision: "REQUEST_INFORMATION", actualDecision: "REQUEST_INFORMATION", result: "PASS", latencyMs: 2310 },
  { testId: "TEST005", claimId: "CLM10005", scenario: "Missing prior authorization", expectedDecision: "REQUEST_INFORMATION", actualDecision: "REQUEST_INFORMATION", result: "PASS", latencyMs: 2240 },
  { testId: "TEST006", claimId: "CLM10006", scenario: "Incomplete claim document", expectedDecision: "REQUEST_INFORMATION", actualDecision: "REQUEST_INFORMATION", result: "PASS", latencyMs: 2050 },
  { testId: "TEST007", claimId: "CLM10007", scenario: "Duplicate claim", expectedDecision: "FRAUD_REVIEW", actualDecision: "FRAUD_REVIEW", result: "PASS", latencyMs: 2480 },
  { testId: "TEST008", claimId: "CLM10008", scenario: "Excessive billing pattern", expectedDecision: "FRAUD_REVIEW", actualDecision: "FRAUD_REVIEW", result: "PASS", latencyMs: 2620 },
  { testId: "TEST009", claimId: "CLM10009", scenario: "Routine outpatient visit", expectedDecision: "APPROVED", actualDecision: "APPROVED", result: "PASS", latencyMs: 1710 },
  { testId: "TEST010", claimId: "CLM10010", scenario: "Covered fracture treatment", expectedDecision: "APPROVED", actualDecision: "APPROVED", result: "PASS", latencyMs: 1890 },
  { testId: "TEST011", claimId: "CLM10004", scenario: "Authorization on file (variant)", expectedDecision: "APPROVED", actualDecision: "REQUEST_INFORMATION", result: "FAIL", latencyMs: 2390 },
];
