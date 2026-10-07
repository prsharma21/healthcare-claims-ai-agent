import { UserRound } from "lucide-react";

import { ExpandablePanel } from "@/components/common/ExpandablePanel";
import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ApiCall } from "@/types/integration";
import type { Patient } from "@/types/patient";
import { formatDate } from "@/utils/format";

import { ApiCallList } from "./ApiCallList";

export function EHRPanel({ patient, calls }: { patient: Patient; calls: ApiCall[] }) {
  const firstCall = calls[0];
  return (
    <ExpandablePanel
      title="Mock EHR"
      subtitle={`Patient ${patient.id} · ${patient.name}`}
      icon={<UserRound className="size-4" aria-hidden="true" />}
      aside={firstCall && <StatusBadge label={`${firstCall.statusCode} ${firstCall.statusText}`} tone="success" />}
      defaultOpen
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Demographics</h5>
          <InfoGrid className="grid-cols-1 sm:grid-cols-1">
            <InfoItem label="Patient" value={patient.name} hint={patient.id} />
            <InfoItem label="DOB" value={formatDate(patient.dateOfBirth)} />
            <InfoItem label="Gender" value={patient.gender} />
            <InfoItem label="City" value={patient.city} />
          </InfoGrid>
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Medical History</h5>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {patient.medicalHistory.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
          <h5 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-700">Allergies</h5>
          <p className="text-sm">{patient.allergies.length > 0 ? patient.allergies.join(", ") : "No known allergies"}</p>
        </div>
        <div>
          <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Medications</h5>
          {patient.medications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No current medications.</p>
          ) : (
            <ul className="space-y-2">
              {patient.medications.map((medication) => (
                <li key={medication.name} className="rounded-md border px-3 py-2 text-sm">
                  <span className="block font-medium">
                    {medication.name} {medication.dosage}
                  </span>
                  <span className="block text-xs text-muted-foreground">{medication.frequency}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-5">
        <ApiCallList calls={calls} />
      </div>
    </ExpandablePanel>
  );
}
