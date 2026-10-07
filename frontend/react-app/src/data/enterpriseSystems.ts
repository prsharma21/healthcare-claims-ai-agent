import type { CodingAgentResult, PolicyAgentResult } from "@/types/agent";
import type { ApiCall, ClaimIntegrationData, EnterpriseSystem } from "@/types/integration";
import { addMs, minutesAgo } from "@/utils/date";

import type { ClaimContext } from "./agents";

export function getEnterpriseSystems(): EnterpriseSystem[] {
  return [
    {
      id: "EHR",
      name: "Mock EHR",
      description: "Patient demographics, medical history and medications.",
      baseUrl: "http://localhost:8101",
      status: "CONNECTED",
      responseTimeMs: 142,
      lastRequestAt: minutesAgo(2),
      operations: [
        { name: "Patient Lookup", available: true },
        { name: "Medical History", available: true },
        { name: "Medication History", available: true },
      ],
    },
    {
      id: "PAYER",
      name: "Mock Payer",
      description: "Member eligibility, policy coverage and claim submission.",
      baseUrl: "http://localhost:8102",
      status: "CONNECTED",
      responseTimeMs: 186,
      lastRequestAt: minutesAgo(2),
      operations: [
        { name: "Eligibility", available: true },
        { name: "Coverage", available: true },
        { name: "Claim Status", available: true },
        { name: "Claim Submission", available: true },
      ],
    },
    {
      id: "PROVIDER",
      name: "Mock Provider",
      description: "Provider directory, network status and credentials.",
      baseUrl: "http://localhost:8103",
      status: "CONNECTED",
      responseTimeMs: 98,
      lastRequestAt: minutesAgo(3),
      operations: [
        { name: "Provider Lookup", available: true },
        { name: "Network Status", available: true },
        { name: "Credential Verification", available: true },
      ],
    },
    {
      id: "CODING",
      name: "Mock Coding API",
      description: "ICD-10 and CPT code validation.",
      baseUrl: "http://localhost:8104",
      status: "CONNECTED",
      responseTimeMs: 64,
      lastRequestAt: minutesAgo(2),
      operations: [
        { name: "ICD-10 Validation", available: true },
        { name: "CPT Validation", available: true },
      ],
    },
  ];
}

function call(method: ApiCall["method"], path: string, latencyMs: number, at: string, statusCode = 200): ApiCall {
  return {
    method,
    path,
    statusCode,
    statusText: statusCode === 201 ? "Created" : "OK",
    latencyMs,
    timestamp: at,
  };
}

/** The API calls and responses recorded for a claim during the Enterprise Verification step. */
export function buildClaimIntegrationData(
  ctx: ClaimContext,
  policyResult: PolicyAgentResult,
  codingResult: CodingAgentResult,
  verifiedAt: string,
): ClaimIntegrationData {
  const { claim, patient, provider, payer, policy } = ctx;
  const at = (offsetMs: number) => addMs(verifiedAt, offsetMs);

  return {
    claimId: claim.id,
    calls: {
      EHR: [
        call("GET", `/patients/${patient.id}`, 142, at(0)),
        call("GET", `/patients/${patient.id}/history`, 118, at(150)),
        call("GET", `/patients/${patient.id}/medications`, 96, at(280)),
      ],
      PAYER: [
        call("GET", `/eligibility/${patient.id}`, 186, at(20)),
        call("GET", `/coverage/${policy.id}/${claim.procedureCode}`, 164, at(220)),
        call("POST", "/claims", 231, at(420), 201),
      ],
      PROVIDER: [call("GET", `/providers/${provider.id}`, 98, at(40))],
      CODING: [
        call("GET", `/icd10/${claim.diagnosisCode}`, 64, at(60)),
        call("GET", `/cpt/${claim.procedureCode}`, 58, at(130)),
      ],
    },
    ehr: patient,
    payer: {
      payerName: payer.name,
      policyId: policy.id,
      eligibility: policyResult.validation.eligibility,
      procedureCode: claim.procedureCode,
      coverage: policyResult.validation.coverage,
      authorization: policyResult.validation.authorization,
      coveragePercent: policyResult.validation.coveragePercent,
    },
    provider,
    coding: codingResult.codes,
  };
}
