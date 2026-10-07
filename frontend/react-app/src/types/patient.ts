import type { HistoricalClaim } from "./claim";

export type Gender = "M" | "F";

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  payerId: string;
  policyId: string;
  city: string;
  phone: string;
  medicalHistory: string[];
  medications: Medication[];
  allergies: string[];
  claimHistory: HistoricalClaim[];
}
