import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { apiClient } from "@/services/apiClient";
import type { ApiClaim, CreateClaimPayload } from "@/types/claimApi";

type Reply = { status: number; data?: unknown } | "network-error";

/** Answers requests made through apiClient without a network (replaces the Axios adapter). */
export function mockApi(handler: (config: InternalAxiosRequestConfig) => Reply) {
  const requests: InternalAxiosRequestConfig[] = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push(config);
    const reply = handler(config);
    if (reply === "network-error") throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    const response: AxiosResponse = {
      data: reply.data,
      status: reply.status,
      statusText: String(reply.status),
      headers: new AxiosHeaders(),
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(`Request failed with status code ${reply.status}`, AxiosError.ERR_BAD_REQUEST, config, undefined, response);
    }
    return response;
  };
  return requests;
}

export const FAKE_BUCKET = "claims-test-bucket";

function formValue(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" && value ? value : null;
}

/** In-memory stand-in for the FastAPI claims endpoints. */
export function mockClaimsBackend() {
  const claims: ApiClaim[] = [];
  let nextNumber = 10001;
  const requests = mockApi((config) => {
    if (config.method === "post" && config.url === "/claims") {
      const payload = JSON.parse(String(config.data)) as CreateClaimPayload;
      const claim: ApiClaim = {
        ...payload,
        claim_id: `CLM${nextNumber++}`,
        status: "RECEIVED",
        created_at: new Date().toISOString(),
        s3_bucket: null,
        s3_object_key: null,
      };
      claims.unshift(claim);
      return { status: 201, data: claim };
    }
    if (config.method === "post" && config.url === "/claims/upload") {
      const form = config.data as FormData;
      const file = form.get("file");
      if (!(file instanceof File)) return { status: 422, data: { detail: [{ loc: ["body", "file"], msg: "Field required" }] } };
      if (file.type !== "application/pdf") return { status: 400, data: { detail: "Only PDF files are supported" } };
      const claimId = `CLM${nextNumber++}`;
      const key = `incoming/${claimId}/${file.name}`;
      claims.unshift({
        claim_id: claimId,
        patient_id: formValue(form, "patient_id"),
        provider_id: formValue(form, "provider_id"),
        payer_id: formValue(form, "payer_id"),
        claim_type: formValue(form, "claim_type") as ApiClaim["claim_type"],
        document_name: file.name,
        status: "UPLOADED",
        created_at: new Date().toISOString(),
        s3_bucket: FAKE_BUCKET,
        s3_object_key: key,
      });
      return {
        status: 201,
        data: { claim_id: claimId, filename: file.name, s3_bucket: FAKE_BUCKET, s3_object_key: key, status: "UPLOADED" },
      };
    }
    if (config.method === "get" && config.url === "/claims") {
      return { status: 200, data: { claims, total: claims.length } };
    }
    return { status: 404, data: { detail: "Not Found" } };
  });
  return { claims, requests };
}
