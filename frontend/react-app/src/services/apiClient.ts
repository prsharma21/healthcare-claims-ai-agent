import axios, { isAxiosError } from "axios";

import { appConfig } from "@/lib/config";

/** Shared Axios instance for the FastAPI backend. Errors are converted to ApiError. */
export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

export class ApiError extends Error {
  readonly status: number | undefined;
  /** Validation messages by request field name, for example { patient_id: "must look like PAT10001" }. */
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status?: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ValidationErrorItem {
  loc?: (string | number)[];
  msg?: string;
}

function parseValidationErrors(detail: unknown): Record<string, string> {
  if (!Array.isArray(detail)) return {};
  const fieldErrors: Record<string, string> = {};
  for (const item of detail as ValidationErrorItem[]) {
    const field = item.loc?.at(-1);
    if (field === undefined || !item.msg || String(field) in fieldErrors) continue;
    fieldErrors[String(field)] = item.msg.replace(/^Value error, /, "");
  }
  return fieldErrors;
}

/** Converts any error from an API call into an ApiError with a message that is safe to show to users. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!isAxiosError<{ detail?: unknown }>(error)) {
    return new ApiError("Something went wrong. Please try again.");
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new ApiError("The claims API took too long to respond. Please try again.");
    }
    return new ApiError(
      `Cannot reach the claims API at ${appConfig.apiBaseUrl}. Make sure the backend is running.`,
    );
  }

  const { status, data } = error.response;
  const detail = typeof data?.detail === "string" ? data.detail : undefined;

  if (status === 422) {
    return new ApiError("Some fields need correction.", status, parseValidationErrors(data?.detail));
  }
  if (status === 400) return new ApiError(detail ?? "The request was rejected. Please check the entered values.", status);
  if (status === 404) return new ApiError(detail ?? "The requested resource was not found.", status);
  if (status >= 500) return new ApiError("The claims service ran into a problem. Please try again later.", status);
  return new ApiError(detail ?? `The request failed (HTTP ${status}).`, status);
}

apiClient.interceptors.response.use(undefined, (error: unknown) => Promise.reject(toApiError(error)));

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
