export type EligibilityStatus = "ACTIVE" | "INACTIVE";

export interface Payer {
  id: string;
  name: string;
  shortCode: string;
  claimsEmail: string;
  supportPhone: string;
}

export interface Policy {
  id: string;
  payerId: string;
  planName: string;
  status: EligibilityStatus;
  effectiveFrom: string;
  effectiveTo: string;
  coveragePercent: number;
  annualLimit: number;
  /** CPT codes that need prior authorization. */
  authorizationRequired: string[];
  /** CPT codes excluded from coverage (for example cosmetic procedures). */
  excludedProcedures: string[];
}
