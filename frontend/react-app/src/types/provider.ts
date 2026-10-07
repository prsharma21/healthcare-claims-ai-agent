export type ProviderType = "HOSPITAL" | "CLINIC";
export type NetworkStatus = "IN_NETWORK" | "OUT_OF_NETWORK";
export type LicenseStatus = "ACTIVE" | "SUSPENDED";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  city: string;
  state: string;
  registrationNumber: string;
  networkStatus: NetworkStatus;
  licenseStatus: LicenseStatus;
  attendingPhysician: string;
  specialties: string[];
  contactEmail: string;
}
