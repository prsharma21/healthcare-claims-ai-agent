/** Types for the FastAPI claims endpoints (snake_case, as sent over the wire). */

export type ApiClaimStatus =
  | "RECEIVED"
  | "UPLOADED"
  | "PROCESSING"
  | "APPROVED"
  | "DENIED"
  | "REQUEST_INFORMATION"
  | "FRAUD_REVIEW"
  | "FAILED";

export const API_CLAIM_TYPES = ["INPATIENT", "OUTPATIENT", "EMERGENCY", "PHARMACY"] as const;

export type ApiClaimType = (typeof API_CLAIM_TYPES)[number];

/** Body of POST /claims (claim registered without a document upload). */
export interface CreateClaimPayload {
  patient_id: string;
  provider_id: string;
  payer_id: string;
  claim_type: ApiClaimType;
  document_name: string;
}

/** Optional form fields sent with the PDF to POST /claims/upload. */
export interface ClaimUploadDetails {
  patient_id?: string;
  provider_id?: string;
  payer_id?: string;
  claim_type?: ApiClaimType;
}

/** Response of POST /claims/upload. */
export interface ClaimUploadResult {
  claim_id: string;
  filename: string;
  s3_bucket: string;
  s3_object_key: string;
  status: ApiClaimStatus;
}

export interface ApiClaim {
  claim_id: string;
  /** Null for claims uploaded without details. */
  patient_id: string | null;
  provider_id: string | null;
  payer_id: string | null;
  claim_type: ApiClaimType | null;
  document_name: string;
  status: ApiClaimStatus;
  /** ISO 8601 timestamp */
  created_at: string;
  s3_bucket: string | null;
  s3_object_key: string | null;
}

export interface ApiClaimList {
  claims: ApiClaim[];
  total: number;
}

export interface ListClaimsParams {
  status?: ApiClaimStatus;
  limit?: number;
  offset?: number;
}
