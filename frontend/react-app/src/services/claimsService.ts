import { appConfig } from "@/lib/config";
import type { AgentPerformance, ProcessingRun } from "@/types/agent";
import type { AnalyticsData } from "@/types/analytics";
import type { Claim, ClaimDetail, ClaimFilters, DashboardMetrics } from "@/types/claim";
import type {
  ApiClaim,
  ApiClaimList,
  ClaimUploadDetails,
  ClaimUploadResult,
  CreateClaimPayload,
  ListClaimsParams,
} from "@/types/claimApi";
import type { EvaluationSummary } from "@/types/evaluation";
import type { EnterpriseStatus } from "@/types/integration";
import type { AppNotification } from "@/types/notification";
import type { Patient } from "@/types/patient";
import type { Payer, Policy } from "@/types/payer";
import type { Provider } from "@/types/provider";
import type { RAGEvidence } from "@/types/rag";
import type { AppSettings } from "@/types/settings";

import { apiClient } from "./apiClient";
import { mockClaimService } from "./mockClaimService";

/** Claim endpoints served by the FastAPI backend (always real HTTP calls, never mocked). */
export const claimsApi = {
  async createClaim(payload: CreateClaimPayload): Promise<ApiClaim> {
    const response = await apiClient.post<ApiClaim>("/claims", payload);
    return response.data;
  },

  /** POST /claims/upload: creates a claim and stores the PDF in S3 (multipart/form-data). */
  async uploadClaimDocument(
    file: File,
    details: ClaimUploadDetails = {},
    onProgress?: (percent: number) => void,
  ): Promise<ClaimUploadResult> {
    const form = new FormData();
    form.append("file", file);
    for (const [name, value] of Object.entries(details)) {
      if (value) form.append(name, value);
    }
    const response = await apiClient.post<ClaimUploadResult>("/claims/upload", form, {
      // Overrides the client's JSON default; the browser adds the multipart boundary.
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return response.data;
  },

  async listClaims(params: ListClaimsParams = {}): Promise<ApiClaimList> {
    const response = await apiClient.get<ApiClaimList>("/claims", { params });
    return response.data;
  },

  async getClaim(claimId: string): Promise<ApiClaim> {
    const response = await apiClient.get<ApiClaim>(`/claims/${encodeURIComponent(claimId)}`);
    return response.data;
  },
};

export interface ReferenceData {
  patients: Patient[];
  providers: Provider[];
  payers: Payer[];
  policies: Policy[];
}

export type ProcessingListener = (run: ProcessingRun) => void;

/**
 * Data for the screens that the backend does not serve yet.
 * Pages only talk to this interface, so the mock implementation can be replaced by one that
 * calls FastAPI (through apiClient) without UI changes. Claim creation already uses `claimsApi`.
 */
export interface ClaimsService {
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getClaims(filters?: Partial<ClaimFilters>): Promise<Claim[]>;
  getClaimById(claimId: string): Promise<ClaimDetail>;
  getReferenceData(): Promise<ReferenceData>;
  processClaim(claimId: string): Promise<ProcessingRun>;
  subscribeToProcessing(claimId: string, listener: ProcessingListener): () => void;
  getAgentResults(claimId: string): Promise<ProcessingRun>;
  getAgentPerformance(): Promise<AgentPerformance[]>;
  getRAGEvidence(claimId: string): Promise<RAGEvidence | null>;
  getEnterpriseStatus(claimId?: string): Promise<EnterpriseStatus>;
  getAnalytics(): Promise<AnalyticsData>;
  getEvaluationSummary(): Promise<EvaluationSummary>;
  runEvaluation(onProgress?: (completed: number, total: number) => void): Promise<EvaluationSummary>;
  getSettings(): Promise<AppSettings>;
  getNotifications(): Promise<AppNotification[]>;
}

function createClaimsService(): ClaimsService {
  if (!appConfig.useMockApi) {
    console.warn("VITE_USE_MOCK_API is false, but only claim creation (claimsApi) uses FastAPI so far. Other pages use mock services.");
  }
  return mockClaimService;
}

export const claimsService: ClaimsService = createClaimsService();
