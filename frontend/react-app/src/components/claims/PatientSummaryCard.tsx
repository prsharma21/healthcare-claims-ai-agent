import { UserRound } from "lucide-react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { SectionCard } from "@/components/common/SectionCard";
import type { Patient } from "@/types/patient";
import { formatDate } from "@/utils/format";

export function PatientSummaryCard({ patient }: { patient: Patient }) {
  return (
    <SectionCard title="Patient Information" icon={UserRound}>
      <InfoGrid>
        <InfoItem label="Patient" value={patient.name} hint={patient.id} />
        <InfoItem label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
        <InfoItem label="Gender" value={patient.gender === "M" ? "Male" : "Female"} />
        <InfoItem label="City" value={patient.city} />
        <InfoItem label="Policy" value={patient.policyId} mono />
        <InfoItem label="Medical History" value={patient.medicalHistory.join(", ") || "None recorded"} />
      </InfoGrid>
    </SectionCard>
  );
}
