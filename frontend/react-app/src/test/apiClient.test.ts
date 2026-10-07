import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { ApiError, toApiError } from "@/services/apiClient";

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown) {
  const response: AxiosResponse = { status, data, statusText: "", headers: new AxiosHeaders(), config };
  return new AxiosError("Request failed", AxiosError.ERR_BAD_REQUEST, config, undefined, response);
}

describe("toApiError", () => {
  it("maps 422 validation details to field errors", () => {
    const error = toApiError(
      httpError(422, {
        detail: [
          { loc: ["body", "patient_id"], msg: "Value error, must look like PAT10001" },
          { loc: ["body", "claim_type"], msg: "Input should be 'INPATIENT' or 'OUTPATIENT'" },
        ],
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({
      patient_id: "must look like PAT10001",
      claim_type: "Input should be 'INPATIENT' or 'OUTPATIENT'",
    });
  });

  it("uses the API detail for 400 and 404", () => {
    expect(toApiError(httpError(400, { detail: "Invalid payer." })).message).toBe("Invalid payer.");
    expect(toApiError(httpError(404, { detail: "Claim CLM10001 not found" })).message).toBe("Claim CLM10001 not found");
    expect(toApiError(httpError(404, {})).message).toBe("The requested resource was not found.");
  });

  it("never exposes server error details", () => {
    const error = toApiError(httpError(500, { detail: "KeyError: 'claim_id' at line 42" }));
    expect(error.status).toBe(500);
    expect(error.message).toBe("The claims service ran into a problem. Please try again later.");
  });

  it("explains network errors and timeouts", () => {
    expect(toApiError(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config)).message).toMatch(
      /^Cannot reach the claims API at http:\/\/localhost:8000/,
    );
    expect(toApiError(new AxiosError("timeout", AxiosError.ECONNABORTED, config)).message).toBe(
      "The claims API took too long to respond. Please try again.",
    );
  });
});
