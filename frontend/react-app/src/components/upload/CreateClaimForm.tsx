import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import type { UploadedClaim } from "@/components/claims/CreatedClaimCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { toApiError, type ApiError } from "@/services/apiClient";
import { claimsApi } from "@/services/claimsService";
import { API_CLAIM_TYPES, type ApiClaimType } from "@/types/claimApi";
import { apiClaimTypeLabels } from "@/utils/status";

import { FileDropzone } from "./FileDropzone";

type FieldName = "patient_id" | "provider_id" | "payer_id" | "claim_type";
type FormValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const emptyValues: FormValues = { patient_id: "", provider_id: "", payer_id: "", claim_type: "" };

const fieldLabels: Record<FieldName, string> = {
  patient_id: "Patient ID",
  provider_id: "Provider ID",
  payer_id: "Payer ID",
  claim_type: "Claim Type",
};

const fieldOrder = Object.keys(fieldLabels) as FieldName[];

const UPLOAD_FAILED_MESSAGE = "Unable to upload claim document. Please try again.";

function isFieldName(value: string): value is FieldName {
  return value in fieldLabels;
}

function asSentence(message: string): string {
  return /[.!?]$/.test(message) ? message : `${message}.`;
}

/** Turns an API validation message ("must look like PAT10001") into a sentence for the field. */
function describeFieldError(label: string, message: string): string {
  if (message === "Field required") return `${label} is required.`;
  return asSentence(/^[a-z]/.test(message) ? `${label} ${message}` : message);
}

/** Message for errors that are not tied to a form field. Server errors never show backend details. */
function uploadErrorMessage(error: ApiError): string {
  if (error.status !== undefined && error.status >= 500) return UPLOAD_FAILED_MESSAGE;
  return asSentence(error.message);
}

function focusField(field: FieldName) {
  document.getElementById(`claim-${field}`)?.focus();
}

export function CreateClaimForm({ onCreated }: { onCreated: (claim: UploadedClaim) => void }) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const showValidationErrors = (errors: FieldErrors, documentError: string | null) => {
    setFieldErrors(errors);
    setFileError(documentError);
    const invalid = fieldOrder.filter((field) => errors[field]).map((field) => fieldLabels[field]);
    if (documentError) invalid.push("Claim PDF");
    toast.error("Please correct the highlighted fields.", { description: invalid.join(", ") });
    const firstField = fieldOrder.find((field) => errors[field]);
    if (firstField) focusField(firstField);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const missing: FieldErrors = {};
    for (const field of fieldOrder) {
      if (!values[field].trim()) missing[field] = `${fieldLabels[field]} is required.`;
    }
    const missingFile = file ? null : "Select the claim PDF to upload.";
    if (Object.keys(missing).length > 0 || !file) {
      showValidationErrors(missing, missingFile);
      return;
    }

    const details = { ...values, claim_type: values.claim_type as ApiClaimType };
    setIsSubmitting(true);
    setProgress(0);
    try {
      const upload = await claimsApi.uploadClaimDocument(file, details, setProgress);
      toast.success("Claim document uploaded.", { description: `${upload.claim_id} · Status ${upload.status}` });
      onCreated({ upload, details });
    } catch (error) {
      const apiError = toApiError(error);
      const serverFieldErrors: FieldErrors = {};
      let serverFileError: string | null = null;
      for (const [field, message] of Object.entries(apiError.fieldErrors)) {
        if (isFieldName(field)) serverFieldErrors[field] = describeFieldError(fieldLabels[field], message);
        if (field === "file") serverFileError = describeFieldError("Claim PDF", message);
      }
      if (Object.keys(serverFieldErrors).length > 0 || serverFileError) {
        showValidationErrors(serverFieldErrors, serverFileError);
      } else {
        const message = uploadErrorMessage(apiError);
        setFormError(message);
        toast.error("Claim document was not uploaded.", { description: message });
      }
    } finally {
      setIsSubmitting(false);
      setProgress(undefined);
    }
  };

  const reset = () => {
    setValues(emptyValues);
    setFieldErrors({});
    setFormError(null);
    setFile(null);
    setFileError(null);
  };

  const inputProps = (field: FieldName) => ({
    id: `claim-${field}`,
    "aria-invalid": Boolean(fieldErrors[field]),
    "aria-describedby": fieldErrors[field] ? `claim-${field}-error` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-5">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-slate-900 sm:col-span-2">1. Claim Information</legend>
        <FormField field="patient_id" error={fieldErrors.patient_id}>
          <Input
            {...inputProps("patient_id")}
            value={values.patient_id}
            onChange={(event) => updateField("patient_id", event.target.value)}
            placeholder="PAT10001"
            autoComplete="off"
          />
        </FormField>
        <FormField field="provider_id" error={fieldErrors.provider_id}>
          <Input
            {...inputProps("provider_id")}
            value={values.provider_id}
            onChange={(event) => updateField("provider_id", event.target.value)}
            placeholder="PRV10001"
            autoComplete="off"
          />
        </FormField>
        <FormField field="payer_id" error={fieldErrors.payer_id}>
          <Input
            {...inputProps("payer_id")}
            value={values.payer_id}
            onChange={(event) => updateField("payer_id", event.target.value)}
            placeholder="PAY10001"
            autoComplete="off"
          />
        </FormField>
        <FormField field="claim_type" error={fieldErrors.claim_type}>
          <NativeSelect
            {...inputProps("claim_type")}
            value={values.claim_type}
            onChange={(event) => updateField("claim_type", event.target.value)}
          >
            <option value="">Select claim type</option>
            {API_CLAIM_TYPES.map((type) => (
              <option key={type} value={type}>
                {apiClaimTypeLabels[type]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </fieldset>

      <fieldset disabled={isSubmitting} className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-slate-900">2. Claim Document</legend>
        <FileDropzone
          file={file}
          onFileChange={setFile}
          error={fileError}
          onError={setFileError}
          progress={progress}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          The PDF is stored privately in Amazon S3 under <span className="font-mono">incoming/&lt;claim ID&gt;/</span>.
        </p>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={reset} disabled={isSubmitting}>
          Clear
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> Uploading claim...
            </>
          ) : (
            <>
              <UploadCloud aria-hidden="true" /> Upload Claim
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function FormField({ field, error, children }: { field: FieldName; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`claim-${field}`}>{fieldLabels[field]}</Label>
      {children}
      {error && (
        <p id={`claim-${field}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
