import type { AuthorizationRequirement, CodeValidation, CoverageStatus } from "./agent";
import type { Patient } from "./patient";
import type { EligibilityStatus } from "./payer";
import type { Provider } from "./provider";

export type IntegrationSystemId = "EHR" | "PAYER" | "PROVIDER" | "CODING";

export type IntegrationStatus = "CONNECTED" | "DEGRADED" | "DISCONNECTED";

export type HttpMethod = "GET" | "POST";

export interface ApiCall {
  method: HttpMethod;
  path: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  timestamp: string;
}

export interface IntegrationOperation {
  name: string;
  available: boolean;
}

export interface EnterpriseSystem {
  id: IntegrationSystemId;
  name: string;
  description: string;
  baseUrl: string;
  status: IntegrationStatus;
  responseTimeMs: number;
  lastRequestAt: string;
  operations: IntegrationOperation[];
}

export interface PayerVerification {
  payerName: string;
  policyId: string;
  eligibility: EligibilityStatus;
  procedureCode: string;
  coverage: CoverageStatus;
  authorization: AuthorizationRequirement;
  coveragePercent: number;
}

/** What each enterprise system returned while processing a specific claim. */
export interface ClaimIntegrationData {
  claimId: string;
  calls: Record<IntegrationSystemId, ApiCall[]>;
  ehr: Patient;
  payer: PayerVerification;
  provider: Provider;
  coding: CodeValidation[];
}

export interface EnterpriseStatus {
  systems: EnterpriseSystem[];
  /** Null until the claim has been processed. */
  claimData: ClaimIntegrationData | null;
}
