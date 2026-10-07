import type {
  AgentPerformance,
  AgentResult,
  AgentType,
  CodingAgentResult,
  DecisionAgentResult,
  DocumentAgentResult,
  ExtractedField,
  FraudAgentResult,
  FraudCheck,
  PipelineStep,
  PipelineStepKey,
  PolicyAgentResult,
} from "@/types/agent";
import type { ClaimDecision, ClaimRecord, FinalDecisionStatus, RiskLevel } from "@/types/claim";
import type { Patient } from "@/types/patient";
import type { Payer, Policy } from "@/types/payer";
import type { Provider } from "@/types/provider";
import { addMs } from "@/utils/date";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";
import { agentNames, claimStatusMeta, riskFromScore } from "@/utils/status";

export interface ClaimContext {
  claim: ClaimRecord;
  patient: Patient;
  provider: Provider;
  payer: Payer;
  policy: Policy;
}

/** Which business rule drove the final decision. Used to pick matching RAG evidence. */
export type OutcomeScenario =
  | "APPROVED"
  | "DENIED_INELIGIBLE"
  | "DENIED_NOT_COVERED"
  | "REQUEST_INFO_AUTHORIZATION"
  | "REQUEST_INFO_DOCUMENTS"
  | "FRAUD_DUPLICATE"
  | "FRAUD_PATTERN";

export interface ClaimOutcome {
  scenario: OutcomeScenario;
  steps: PipelineStep[];
  agents: AgentResult[];
  decision: ClaimDecision;
  riskLevel: RiskLevel;
  fraudScore: number;
}

interface StepDefinition {
  key: PipelineStepKey;
  label: string;
  description: string;
  agent: AgentType | null;
}

export const pipelineStepDefinitions: StepDefinition[] = [
  {
    key: "CLAIM_RECEIVED",
    label: "Claim Received",
    description: "Claim document stored and queued for processing.",
    agent: null,
  },
  {
    key: "DOCUMENT_EXTRACTION",
    label: "Document Extraction",
    description: "Document Agent extracts structured fields from the claim PDF.",
    agent: "DOCUMENT",
  },
  {
    key: "POLICY_VALIDATION",
    label: "Policy Validation",
    description: "Policy Agent checks eligibility, coverage and authorization rules.",
    agent: "POLICY",
  },
  {
    key: "MEDICAL_CODING",
    label: "Medical Coding",
    description: "Coding Agent validates ICD-10 and CPT codes.",
    agent: "CODING",
  },
  {
    key: "FRAUD_DETECTION",
    label: "Fraud Detection",
    description: "Fraud Agent scores the claim against fraud, waste and abuse rules.",
    agent: "FRAUD",
  },
  {
    key: "ENTERPRISE_VERIFICATION",
    label: "Enterprise Verification",
    description: "Cross-checks the claim with EHR, payer, provider and coding systems.",
    agent: null,
  },
  {
    key: "DECISION",
    label: "Decision",
    description: "Decision Agent combines all findings into a final decision.",
    agent: "DECISION",
  },
];

export function createPendingSteps(): PipelineStep[] {
  return pipelineStepDefinitions.map((definition) => ({
    ...definition,
    status: "PENDING",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    summary: "Waiting to start.",
  }));
}

/** Typical agent run times for the analytics and AI Processing pages. */
export const agentPerformance: AgentPerformance[] = [
  { agent: "DOCUMENT", name: agentNames.DOCUMENT, averageDurationMs: 3200, successRate: 0.992, runsToday: 64 },
  { agent: "POLICY", name: agentNames.POLICY, averageDurationMs: 1800, successRate: 0.996, runsToday: 64 },
  { agent: "CODING", name: agentNames.CODING, averageDurationMs: 1200, successRate: 0.998, runsToday: 63 },
  { agent: "FRAUD", name: agentNames.FRAUD, averageDurationMs: 2400, successRate: 0.989, runsToday: 63 },
  { agent: "DECISION", name: agentNames.DECISION, averageDurationMs: 900, successRate: 0.999, runsToday: 62 },
];

interface FraudOverride {
  score: number;
  checks: FraudCheck[];
  matchingClaimId: string | null;
}

interface ScenarioOverride {
  missingFields?: string[];
  fraud?: FraudOverride;
}

/** Claim-specific findings that cannot be derived from policy rules alone. */
const scenarioOverrides: Record<string, ScenarioOverride> = {
  CLM10006: {
    missingFields: ["attendingPhysician", "providerSignature", "itemizedBill"],
  },
  CLM10007: {
    fraud: {
      score: 0.94,
      matchingClaimId: "CLM09001",
      checks: [
        {
          name: "Duplicate Claim",
          result: "FAILED",
          detail:
            "Matches CLM09001: same patient, provider, procedure (99223), date of service (14 Aug 2026) and amount (₹42,000).",
        },
        { name: "High Amount", result: "PASSED", detail: "Billed amount is within the expected range for CPT 99223." },
        { name: "Patient History", result: "PASSED", detail: "2 prior claims in the last 12 months." },
        { name: "Provider Pattern", result: "PASSED", detail: "ABC Hospital billing pattern is consistent with peers." },
      ],
    },
  },
  CLM10008: {
    fraud: {
      score: 0.81,
      matchingClaimId: null,
      checks: [
        { name: "Duplicate Claim", result: "PASSED", detail: "No matching claim found." },
        {
          name: "High Amount",
          result: "FAILED",
          detail: "₹1,85,000 is about 27x the patient's previous CPT 97110 claims (₹6,500 to ₹7,200).",
        },
        { name: "Patient History", result: "WARNING", detail: "3 physiotherapy claims in the last 90 days." },
        {
          name: "Provider Pattern",
          result: "FAILED",
          detail: "Demo Clinic billed CPT 97110 at 4.8x the peer average this month.",
        },
      ],
    },
  },
};

/** Small deterministic hash so generated values are stable between renders. */
function stableFraction(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

const stepDurationsMs: Record<PipelineStepKey, number> = {
  CLAIM_RECEIVED: 320,
  DOCUMENT_EXTRACTION: 3200,
  POLICY_VALIDATION: 1800,
  MEDICAL_CODING: 1200,
  FRAUD_DETECTION: 2400,
  ENTERPRISE_VERIFICATION: 950,
  DECISION: 900,
};

function buildExtractedFields(ctx: ClaimContext, missing: string[]): ExtractedField[] {
  const { claim, patient, provider, payer } = ctx;
  const fields: [string, string, string][] = [
    ["patientId", "Patient ID", claim.patientId],
    ["patientName", "Patient Name", patient.name],
    ["dateOfBirth", "Date of Birth", formatDate(patient.dateOfBirth)],
    ["policyId", "Policy ID", claim.policyId],
    ["payerName", "Payer", payer.name],
    ["providerId", "Provider ID", claim.providerId],
    ["providerName", "Provider Name", provider.name],
    ["attendingPhysician", "Attending Physician", provider.attendingPhysician],
    ["diagnosisCode", "Diagnosis (ICD-10)", claim.diagnosisCode],
    ["procedureCode", "Procedure (CPT)", claim.procedureCode],
    ["amount", "Billed Amount", formatCurrency(claim.amount)],
    ["dateOfService", "Date of Service", formatDate(claim.dateOfService)],
    ["providerSignature", "Provider Signature", "Present"],
    ["itemizedBill", "Itemized Bill", "Attached"],
  ];
  return fields.map(([key, label, value]) => {
    const isMissing = missing.includes(key);
    return {
      key,
      label,
      value: isMissing ? null : value,
      confidence: isMissing ? 0 : Number((0.94 + stableFraction(claim.id + key) * 0.05).toFixed(2)),
    };
  });
}

function buildFraudChecks(ctx: ClaimContext): FraudCheck[] {
  const { claim, patient, provider } = ctx;
  const priorClaims = patient.claimHistory.length;
  return [
    {
      name: "Duplicate Claim",
      result: "PASSED",
      detail: "No other claim found for the same patient, provider, procedure and date of service.",
    },
    claim.amount > 200000
      ? {
          name: "High Amount",
          result: "WARNING",
          detail: `${formatCurrency(claim.amount)} is high but within the expected range for CPT ${claim.procedureCode}.`,
        }
      : {
          name: "High Amount",
          result: "PASSED",
          detail: `Billed amount is within the expected range for CPT ${claim.procedureCode}.`,
        },
    {
      name: "Patient History",
      result: "PASSED",
      detail:
        priorClaims > 0
          ? `${priorClaims} prior claim${priorClaims > 1 ? "s" : ""} in the last 12 months with no anomalies.`
          : "No prior claims on record.",
    },
    {
      name: "Provider Pattern",
      result: "PASSED",
      detail: `${provider.name} billing pattern is consistent with peer providers.`,
    },
  ];
}

const fraudRecommendations: Record<RiskLevel, string> = {
  LOW: "No fraud indicators. Continue automated processing.",
  MEDIUM: "Continue processing and include in post-payment audit sampling.",
  HIGH: "Hold payment and route to the Special Investigations Unit.",
};

interface DecisionTemplate {
  status: FinalDecisionStatus;
  confidence: number;
  reason: string;
  nextSteps: string[];
}

function buildDecision(ctx: ClaimContext, scenario: OutcomeScenario, matchingClaimId: string | null): DecisionTemplate {
  const { claim, policy } = ctx;
  switch (scenario) {
    case "DENIED_INELIGIBLE":
      return {
        status: "DENIED",
        confidence: 0.97,
        reason: `Member eligibility is inactive. Policy ${policy.id} ended on ${formatDate(policy.effectiveTo)}, before the date of service (${formatDate(claim.dateOfService)}).`,
        nextSteps: ["Send denial letter to member and provider.", "Advise member to contact the payer to reinstate coverage."],
      };
    case "DENIED_NOT_COVERED":
      return {
        status: "DENIED",
        confidence: 0.95,
        reason: `CPT ${claim.procedureCode} (${claim.procedureDescription}) is excluded from coverage under ${policy.id} as a cosmetic procedure.`,
        nextSteps: ["Send denial letter citing the policy exclusion.", "Provider may bill the member directly."],
      };
    case "FRAUD_DUPLICATE":
      return {
        status: "FRAUD_REVIEW",
        confidence: 0.91,
        reason: `This claim duplicates ${matchingClaimId ?? "a previously paid claim"} (same patient, provider, procedure, date of service and amount). Payment is on hold pending manual review.`,
        nextSteps: ["Assign to the Special Investigations Unit.", `Compare documents with ${matchingClaimId ?? "the matching claim"}.`],
      };
    case "FRAUD_PATTERN":
      return {
        status: "FRAUD_REVIEW",
        confidence: 0.88,
        reason: `The billed amount is far above the expected range for CPT ${claim.procedureCode} and the provider shows an unusual billing pattern. Payment is on hold pending manual review.`,
        nextSteps: ["Assign to the Special Investigations Unit.", "Request treatment notes and attendance records from the provider."],
      };
    case "REQUEST_INFO_DOCUMENTS":
      return {
        status: "REQUEST_INFORMATION",
        confidence: 0.89,
        reason: "The claim document is incomplete: attending physician, provider signature and itemized bill are missing. These are required before the claim can be adjudicated.",
        nextSteps: ["Request a signed claim form and itemized bill from the provider.", "Re-run AI processing when documents are received."],
      };
    case "REQUEST_INFO_AUTHORIZATION":
      return {
        status: "REQUEST_INFORMATION",
        confidence: 0.9,
        reason: `CPT ${claim.procedureCode} requires prior authorization under ${policy.id}, but no authorization reference was found in the claim document or payer records.`,
        nextSteps: ["Request the prior authorization number from the provider.", "Re-run AI processing when the authorization is received."],
      };
    case "APPROVED":
      return {
        status: "APPROVED",
        confidence: 0.94,
        reason:
          "Member eligibility is active, the procedure is covered, coding is valid and no significant fraud indicators were detected.",
        nextSteps: [
          `Release payment of ${formatCurrency(Math.round((claim.amount * policy.coveragePercent) / 100))} (${policy.coveragePercent}% coverage).`,
          "Send explanation of benefits to the member.",
        ],
      };
  }
}

/**
 * Derives every agent's findings for a claim from the policy rules and the claim data.
 * This is the mock equivalent of the multi-agent pipeline running on Bedrock / AgentCore.
 */
export function buildClaimOutcome(ctx: ClaimContext, startedAt: string): ClaimOutcome {
  const { claim, patient, provider, policy } = ctx;
  const override = scenarioOverrides[claim.id] ?? {};

  // Document Agent
  const missingFields = override.missingFields ?? [];
  const fields = buildExtractedFields(ctx, missingFields);
  const fieldsExtracted = fields.filter((field) => field.value !== null).length;

  // Policy Agent
  const eligibility = policy.status;
  const coverage = policy.excludedProcedures.includes(claim.procedureCode) ? "NOT_COVERED" : "COVERED";
  const authorization = policy.authorizationRequired.includes(claim.procedureCode) ? "REQUIRED" : "NOT_REQUIRED";
  const authorizationEvidence = authorization === "REQUIRED" ? "MISSING" : "NOT_APPLICABLE";

  // Fraud Agent
  const fraudScore = override.fraud?.score ?? claim.fraudScore ?? Number((0.03 + stableFraction(claim.id) * 0.09).toFixed(2));
  const riskLevel = riskFromScore(fraudScore);
  const matchingClaimId = override.fraud?.matchingClaimId ?? null;

  // Decision rules, in priority order
  let scenario: OutcomeScenario = "APPROVED";
  if (eligibility === "INACTIVE") scenario = "DENIED_INELIGIBLE";
  else if (coverage === "NOT_COVERED") scenario = "DENIED_NOT_COVERED";
  else if (riskLevel === "HIGH") scenario = matchingClaimId ? "FRAUD_DUPLICATE" : "FRAUD_PATTERN";
  else if (missingFields.length > 0) scenario = "REQUEST_INFO_DOCUMENTS";
  else if (authorizationEvidence === "MISSING") scenario = "REQUEST_INFO_AUTHORIZATION";

  const decisionTemplate = buildDecision(ctx, scenario, matchingClaimId);

  let policyReasoning = `Member is active and CPT ${claim.procedureCode} is covered under the synthetic ${claim.claimType.toLowerCase()} policy.`;
  if (eligibility === "INACTIVE") {
    policyReasoning = `Member eligibility is inactive: policy ${policy.id} ended on ${formatDate(policy.effectiveTo)}, before the date of service.`;
  } else if (coverage === "NOT_COVERED") {
    policyReasoning = `Member is active, but CPT ${claim.procedureCode} is excluded from coverage under ${policy.id} as a cosmetic procedure.`;
  } else if (authorization === "REQUIRED") {
    policyReasoning = `Member is active and CPT ${claim.procedureCode} is covered under ${policy.id}, but prior authorization is required and no authorization reference was found.`;
  }

  // Timeline
  const steps: PipelineStep[] = [];
  let cursor = startedAt;
  const timing: Partial<Record<PipelineStepKey, { startedAt: string; completedAt: string; durationMs: number }>> = {};
  for (const definition of pipelineStepDefinitions) {
    const durationMs =
      definition.key === "DOCUMENT_EXTRACTION"
        ? 2000 + claim.document.pageCount * 200
        : definition.key === "FRAUD_DETECTION" && override.fraud
          ? 3100
          : stepDurationsMs[definition.key];
    const stepStart = cursor;
    const stepEnd = addMs(stepStart, durationMs);
    timing[definition.key] = { startedAt: stepStart, completedAt: stepEnd, durationMs };
    cursor = addMs(stepEnd, 60);
  }
  const timingFor = (key: PipelineStepKey) => timing[key] ?? { startedAt, completedAt: startedAt, durationMs: 0 };

  const documentResult: DocumentAgentResult = {
    agent: "DOCUMENT",
    name: agentNames.DOCUMENT,
    status: "COMPLETED",
    ...timingFor("DOCUMENT_EXTRACTION"),
    confidence: missingFields.length > 0 ? 0.78 : 0.97,
    summary:
      missingFields.length > 0
        ? `Extracted ${fieldsExtracted} of ${fields.length} fields. ${missingFields.length} required fields are missing.`
        : `Extracted ${fieldsExtracted} of ${fields.length} fields from ${claim.document.pageCount} pages.`,
    extraction: {
      fields,
      fieldsExtracted,
      fieldsExpected: fields.length,
      pagesProcessed: claim.document.pageCount,
      missingFields: fields.filter((field) => field.value === null).map((field) => field.label),
    },
  };

  const policyResult: PolicyAgentResult = {
    agent: "POLICY",
    name: agentNames.POLICY,
    status: "COMPLETED",
    ...timingFor("POLICY_VALIDATION"),
    confidence: eligibility === "INACTIVE" ? 0.97 : authorization === "REQUIRED" ? 0.91 : 0.94,
    summary: [
      eligibility === "ACTIVE" ? "Eligibility active" : "Eligibility inactive",
      coverage === "COVERED" ? `Covered at ${policy.coveragePercent}%` : "Procedure not covered",
      authorization === "REQUIRED" ? "Authorization required (missing)" : "Authorization not required",
    ].join(" · "),
    validation: {
      policyId: policy.id,
      eligibility,
      coverage,
      authorization,
      authorizationEvidence,
      coveragePercent: policy.coveragePercent,
      reasoning: policyReasoning,
    },
  };

  const codingResult: CodingAgentResult = {
    agent: "CODING",
    name: agentNames.CODING,
    status: "COMPLETED",
    ...timingFor("MEDICAL_CODING"),
    confidence: 0.98,
    summary: `ICD-10 ${claim.diagnosisCode} and CPT ${claim.procedureCode} are valid and consistent.`,
    codes: [
      {
        codeType: "ICD10",
        code: claim.diagnosisCode,
        description: claim.diagnosisDescription,
        valid: true,
        note: "Valid billable ICD-10-CM code.",
      },
      {
        codeType: "CPT",
        code: claim.procedureCode,
        description: claim.procedureDescription,
        valid: true,
        note: "Valid CPT code, clinically consistent with the diagnosis.",
      },
    ],
  };

  const fraudChecks = override.fraud?.checks ?? buildFraudChecks(ctx);
  const fraudResult: FraudAgentResult = {
    agent: "FRAUD",
    name: agentNames.FRAUD,
    status: "COMPLETED",
    ...timingFor("FRAUD_DETECTION"),
    confidence: riskLevel === "HIGH" ? 0.92 : 0.95,
    summary: `Fraud risk ${riskLevel.toLowerCase()} (score ${fraudScore.toFixed(2)}). ${fraudChecks.filter((check) => check.result === "PASSED").length} of ${fraudChecks.length} checks passed.`,
    analysis: {
      riskLevel,
      score: fraudScore,
      checks: fraudChecks,
      matchingClaimId,
      historicalClaims: patient.claimHistory,
      recommendation: fraudRecommendations[riskLevel],
    },
  };

  const decisionTiming = timingFor("DECISION");
  const decisionResult: DecisionAgentResult = {
    agent: "DECISION",
    name: agentNames.DECISION,
    status: "COMPLETED",
    ...decisionTiming,
    confidence: decisionTemplate.confidence,
    summary: `Final decision: ${claimStatusMeta[decisionTemplate.status].label} (${formatPercent(decisionTemplate.confidence)} confidence).`,
    decision: {
      status: decisionTemplate.status,
      reason: decisionTemplate.reason,
      nextSteps: decisionTemplate.nextSteps,
    },
  };

  const agentsByType: Record<AgentType, AgentResult> = {
    DOCUMENT: documentResult,
    POLICY: policyResult,
    CODING: codingResult,
    FRAUD: fraudResult,
    DECISION: decisionResult,
  };

  const systemSummaries: Partial<Record<PipelineStepKey, string>> = {
    CLAIM_RECEIVED: `Received ${claim.document.fileName} (${claim.document.pageCount} pages) for ${provider.name}.`,
    ENTERPRISE_VERIFICATION: "Verified with Mock EHR, Mock Payer, Mock Provider and Mock Coding API (9 API calls).",
  };

  for (const definition of pipelineStepDefinitions) {
    const stepTiming = timingFor(definition.key);
    steps.push({
      ...definition,
      status: "COMPLETED",
      ...stepTiming,
      summary: definition.agent ? agentsByType[definition.agent].summary : (systemSummaries[definition.key] ?? ""),
    });
  }

  return {
    scenario,
    steps,
    agents: [documentResult, policyResult, codingResult, fraudResult, decisionResult],
    decision: {
      status: decisionTemplate.status,
      reason: decisionTemplate.reason,
      confidence: decisionTemplate.confidence,
      decidedAt: decisionTiming.completedAt,
    },
    riskLevel,
    fraudScore,
  };
}
