import type { FinalDecisionStatus } from "./claim";

export type EvaluationMetricUnit = "PERCENT" | "SECONDS";

export interface EvaluationMetric {
  key: string;
  label: string;
  /** Fraction (0 to 1) for PERCENT, seconds for SECONDS. */
  value: number;
  target: number;
  unit: EvaluationMetricUnit;
  /** True when a lower value is better (for example latency). */
  lowerIsBetter: boolean;
  description: string;
}

export type EvaluationResult = "PASS" | "FAIL";

export interface EvaluationTestCase {
  testId: string;
  claimId: string;
  scenario: string;
  expectedDecision: FinalDecisionStatus;
  actualDecision: FinalDecisionStatus;
  result: EvaluationResult;
  latencyMs: number;
}

export interface EvaluationSummary {
  runId: string;
  lastRunAt: string;
  datasetName: string;
  framework: string;
  metrics: EvaluationMetric[];
  tests: EvaluationTestCase[];
}
