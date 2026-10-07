import { agentPerformance, buildClaimOutcome, createPendingSteps } from "@/data/agents";
import type { ClaimContext, ClaimOutcome } from "@/data/agents";
import { dashboardMetrics, getAnalyticsData } from "@/data/analytics";
import { claimRecords } from "@/data/claims";
import { buildClaimIntegrationData, getEnterpriseSystems } from "@/data/enterpriseSystems";
import { evaluationDatasetName, evaluationFramework, evaluationMetrics, evaluationTests } from "@/data/evaluation";
import { getNotificationData } from "@/data/notifications";
import { patients } from "@/data/patients";
import { payers, policies } from "@/data/payers";
import { providers } from "@/data/providers";
import { buildRagEvidence } from "@/data/ragEvidence";
import { getAppSettings } from "@/data/settings";
import type { AgentResult, PipelineStepKey, ProcessingRun } from "@/types/agent";
import type { AuditEvent, Claim, ClaimDetail, ClaimFilters, ClaimRecord } from "@/types/claim";
import type { EvaluationSummary } from "@/types/evaluation";
import type { ClaimIntegrationData } from "@/types/integration";
import type { RAGEvidence } from "@/types/rag";
import { applyClaimFilters } from "@/utils/claimFilters";
import { addMs, minutesAgo } from "@/utils/date";
import { agentNames, claimStatusMeta } from "@/utils/status";

import { ApiError } from "./apiClient";
import type { ClaimsService, ProcessingListener } from "./claimsService";

/** Tests set delayScale to 0 to skip the simulated network latency. */
export const mockSettings = {
  delayScale: 1,
};

/** How long each pipeline step takes in the live simulation (ms). */
const liveStepDelaysMs: Record<PipelineStepKey, number> = {
  CLAIM_RECEIVED: 500,
  DOCUMENT_EXTRACTION: 1300,
  POLICY_VALIDATION: 1000,
  MEDICAL_CODING: 800,
  FRAUD_DETECTION: 1000,
  ENTERPRISE_VERIFICATION: 900,
  DECISION: 700,
};

function delay(ms: number): Promise<void> {
  const scaled = ms * mockSettings.delayScale;
  return new Promise((resolve) => setTimeout(resolve, scaled));
}

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// In-memory "database". Resets when the page is reloaded.
// ---------------------------------------------------------------------------

const store = {
  claims: structuredClone(claimRecords),
  runs: new Map<string, ProcessingRun>(),
  ragEvidence: new Map<string, RAGEvidence>(),
  integrations: new Map<string, ClaimIntegrationData>(),
  listeners: new Map<string, Set<ProcessingListener>>(),
  activeRuns: new Set<string>(),
  evaluationRunNumber: 7,
  evaluation: null as EvaluationSummary | null,
};

function findRecord(claimId: string): ClaimRecord {
  const record = store.claims.find((claim) => claim.id.toLowerCase() === claimId.toLowerCase());
  if (!record) throw new ApiError(`Claim ${claimId} was not found.`, 404);
  return record;
}

function resolveContext(claim: ClaimRecord): ClaimContext {
  const patient = patients.find((item) => item.id === claim.patientId);
  const provider = providers.find((item) => item.id === claim.providerId);
  const payer = payers.find((item) => item.id === claim.payerId);
  const policy = policies.find((item) => item.id === claim.policyId);
  if (!patient || !provider || !payer || !policy) {
    throw new ApiError(`Reference data for claim ${claim.id} is incomplete.`, 500);
  }
  return { claim, patient, provider, payer, policy };
}

function toClaim(record: ClaimRecord): Claim {
  return {
    ...record,
    patientName: patients.find((item) => item.id === record.patientId)?.name ?? record.patientId,
    providerName: providers.find((item) => item.id === record.providerId)?.name ?? record.providerId,
    payerName: payers.find((item) => item.id === record.payerId)?.name ?? record.payerId,
  };
}

function notStartedRun(claimId: string): ProcessingRun {
  return {
    claimId,
    status: "NOT_STARTED",
    progress: 0,
    startedAt: null,
    completedAt: null,
    steps: createPendingSteps(),
    agents: [],
  };
}

function findAgent<T extends AgentResult["agent"]>(agents: AgentResult[], type: T): Extract<AgentResult, { agent: T }> {
  const result = agents.find((agent): agent is Extract<AgentResult, { agent: T }> => agent.agent === type);
  if (!result) throw new ApiError(`${type} agent result is missing.`, 500);
  return result;
}

/** Stores the results of a completed run and updates the claim record. */
function saveOutcome(ctx: ClaimContext, outcome: ClaimOutcome, run: ProcessingRun): void {
  const record = ctx.claim;
  record.status = outcome.decision.status;
  record.decision = outcome.decision;
  record.riskLevel = outcome.riskLevel;
  record.fraudScore = outcome.fraudScore;

  const enterpriseStep = run.steps.find((step) => step.key === "ENTERPRISE_VERIFICATION");
  store.runs.set(record.id, run);
  store.ragEvidence.set(record.id, buildRagEvidence(ctx, outcome.scenario, outcome.decision.decidedAt));
  store.integrations.set(
    record.id,
    buildClaimIntegrationData(
      ctx,
      findAgent(run.agents, "POLICY"),
      findAgent(run.agents, "CODING"),
      enterpriseStep?.startedAt ?? outcome.decision.decidedAt,
    ),
  );
}

// Seed: claims that already have a decision get a completed processing history.
for (const record of store.claims) {
  if (record.status === "PENDING" || record.status === "PROCESSING") continue;
  const ctx = resolveContext(record);
  const outcome = buildClaimOutcome(ctx, addMs(record.submittedAt, 1500));
  const lastStep = outcome.steps[outcome.steps.length - 1];
  saveOutcome(ctx, outcome, {
    claimId: record.id,
    status: "COMPLETED",
    progress: 100,
    startedAt: outcome.steps[0]?.startedAt ?? record.submittedAt,
    completedAt: lastStep?.completedAt ?? record.submittedAt,
    steps: outcome.steps,
    agents: outcome.agents,
  });
}

function publish(run: ProcessingRun): void {
  store.runs.set(run.claimId, run);
  store.listeners.get(run.claimId)?.forEach((listener) => listener(run));
}

function buildAuditTrail(record: ClaimRecord, run: ProcessingRun | undefined): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: `${record.id}-submitted`,
      timestamp: record.submittedAt,
      actor: "Claims Administrator",
      actorType: "USER",
      action: "Claim submitted",
      detail: `Claim ${record.id} submitted with document ${record.document.fileName}.`,
    },
    {
      id: `${record.id}-stored`,
      timestamp: addMs(record.submittedAt, 1200),
      actor: "Amazon S3 (mock)",
      actorType: "SYSTEM",
      action: "Document stored",
      detail: `Stored at ${record.document.storageKey}.`,
    },
  ];

  for (const step of run?.steps ?? []) {
    if (!step.completedAt) continue;
    const isGatewayStep = step.key === "ENTERPRISE_VERIFICATION";
    events.push({
      id: `${record.id}-${step.key}`,
      timestamp: step.completedAt,
      actor: step.agent ? agentNames[step.agent] : isGatewayStep ? "AgentCore Gateway (mock)" : "Claims Orchestrator",
      actorType: step.agent ? "AGENT" : isGatewayStep ? "INTEGRATION" : "SYSTEM",
      action: `${step.label} completed`,
      detail: step.summary,
    });
  }

  if (record.decision) {
    events.push({
      id: `${record.id}-status`,
      timestamp: addMs(record.decision.decidedAt, 200),
      actor: "Claims Orchestrator",
      actorType: "SYSTEM",
      action: "Status updated",
      detail: `Claim status set to ${claimStatusMeta[record.decision.status].label}.`,
    });
  } else if (record.status === "PENDING") {
    events.push({
      id: `${record.id}-awaiting`,
      timestamp: addMs(record.submittedAt, 1500),
      actor: "Claims Orchestrator",
      actorType: "SYSTEM",
      action: "Awaiting AI processing",
      detail: "The claim is queued and has not been processed yet.",
    });
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function initialEvaluation(): EvaluationSummary {
  return {
    runId: `EVAL-${String(store.evaluationRunNumber).padStart(4, "0")}`,
    lastRunAt: minutesAgo(95),
    datasetName: evaluationDatasetName,
    framework: evaluationFramework,
    metrics: evaluationMetrics.map((metric) => ({ ...metric })),
    tests: evaluationTests.map((test) => ({ ...test })),
  };
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export const mockClaimService: ClaimsService = {
  async getDashboardMetrics() {
    await delay(300);
    return { ...dashboardMetrics };
  },

  async getClaims(filters?: Partial<ClaimFilters>) {
    await delay(350);
    const claims = [...store.claims]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map(toClaim);
    return filters ? applyClaimFilters(claims, filters) : claims;
  },

  async getClaimById(claimId: string): Promise<ClaimDetail> {
    await delay(300);
    const record = findRecord(claimId);
    const ctx = resolveContext(record);
    return {
      claim: toClaim(record),
      patient: ctx.patient,
      provider: ctx.provider,
      payer: ctx.payer,
      policy: ctx.policy,
      auditTrail: buildAuditTrail(record, store.runs.get(record.id)),
    };
  },

  async getReferenceData() {
    await delay(200);
    return { patients, providers, payers, policies };
  },

  async processClaim(claimId: string) {
    const record = findRecord(claimId);
    if (store.activeRuns.has(record.id)) {
      throw new ApiError(`Claim ${record.id} is already being processed.`, 409);
    }
    const ctx = resolveContext(record);
    store.activeRuns.add(record.id);

    try {
      const startedAt = nowIso();
      const planned = buildClaimOutcome(ctx, startedAt);

      record.status = "PROCESSING";
      record.decision = null;
      record.riskLevel = null;
      record.fraudScore = null;
      store.ragEvidence.delete(record.id);
      store.integrations.delete(record.id);

      let run: ProcessingRun = { ...notStartedRun(record.id), status: "RUNNING", startedAt };
      publish(run);

      for (let index = 0; index < planned.steps.length; index += 1) {
        const plannedStep = planned.steps[index];
        const stepStartedAt = nowIso();
        run = {
          ...run,
          steps: run.steps.map((step, i) =>
            i === index ? { ...step, status: "RUNNING", startedAt: stepStartedAt, summary: "In progress..." } : step,
          ),
        };
        publish(run);

        await delay(liveStepDelaysMs[plannedStep.key]);

        const completedAt = nowIso();
        const durationMs = new Date(completedAt).getTime() - new Date(stepStartedAt).getTime();
        const timing = { startedAt: stepStartedAt, completedAt, durationMs };
        const plannedAgent = plannedStep.agent ? planned.agents.find((agent) => agent.agent === plannedStep.agent) : undefined;

        run = {
          ...run,
          progress: Math.round(((index + 1) / planned.steps.length) * 100),
          steps: run.steps.map((step, i) => (i === index ? { ...plannedStep, ...timing } : step)),
          agents: plannedAgent ? [...run.agents, { ...plannedAgent, ...timing }] : run.agents,
        };
        publish(run);
      }

      const decisionStep = run.steps[run.steps.length - 1];
      const completedAt = decisionStep?.completedAt ?? nowIso();
      run = { ...run, status: "COMPLETED", progress: 100, completedAt };
      saveOutcome(ctx, { ...planned, decision: { ...planned.decision, decidedAt: completedAt } }, run);
      publish(run);
      return run;
    } catch (error) {
      const failed: ProcessingRun = { ...(store.runs.get(record.id) ?? notStartedRun(record.id)), status: "FAILED" };
      record.status = "PENDING";
      publish(failed);
      throw error;
    } finally {
      store.activeRuns.delete(record.id);
    }
  },

  subscribeToProcessing(claimId: string, listener: ProcessingListener) {
    const key = claimId.toUpperCase();
    const listeners = store.listeners.get(key) ?? new Set<ProcessingListener>();
    listeners.add(listener);
    store.listeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
    };
  },

  async getAgentResults(claimId: string) {
    await delay(250);
    const record = findRecord(claimId);
    return store.runs.get(record.id) ?? notStartedRun(record.id);
  },

  async getAgentPerformance() {
    await delay(250);
    return agentPerformance.map((item) => ({ ...item }));
  },

  async getRAGEvidence(claimId: string) {
    await delay(400);
    const record = findRecord(claimId);
    return store.ragEvidence.get(record.id) ?? null;
  },

  async getEnterpriseStatus(claimId?: string) {
    await delay(350);
    const record = claimId ? findRecord(claimId) : undefined;
    return {
      systems: getEnterpriseSystems(),
      claimData: record ? (store.integrations.get(record.id) ?? null) : null,
    };
  },

  async getAnalytics() {
    await delay(400);
    return getAnalyticsData();
  },

  async getEvaluationSummary() {
    await delay(350);
    store.evaluation ??= initialEvaluation();
    return structuredClone(store.evaluation);
  },

  async runEvaluation(onProgress?: (completed: number, total: number) => void) {
    const current = store.evaluation ?? initialEvaluation();
    const total = current.tests.length;
    for (let index = 0; index < total; index += 1) {
      await delay(280);
      onProgress?.(index + 1, total);
    }

    const tests = current.tests.map((test) => ({
      ...test,
      latencyMs: Math.round(test.latencyMs * (0.92 + Math.random() * 0.16)),
    }));
    const averageLatencySeconds = Number(
      (tests.reduce((sum, test) => sum + test.latencyMs, 0) / tests.length / 1000).toFixed(1),
    );

    store.evaluationRunNumber += 1;
    store.evaluation = {
      ...current,
      runId: `EVAL-${String(store.evaluationRunNumber).padStart(4, "0")}`,
      lastRunAt: nowIso(),
      tests,
      metrics: current.metrics.map((metric) =>
        metric.key === "average_latency" ? { ...metric, value: averageLatencySeconds } : metric,
      ),
    };
    return structuredClone(store.evaluation);
  },

  async getSettings() {
    await delay(200);
    return getAppSettings();
  },

  async getNotifications() {
    await delay(200);
    return getNotificationData();
  },
};
