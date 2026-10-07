import { useId, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/utils/format";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Returns an error message, or null when the file can be uploaded. */
export function validateClaimFile(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are accepted.";
  if (file.size > MAX_FILE_SIZE_BYTES) return `File is ${formatFileSize(file.size)}. The maximum size is 10 MB.`;
  if (file.size === 0) return "The selected file is empty.";
  return null;
}

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string | null;
  onError: (message: string | null) => void;
  /** Upload progress (0-100). Shown when defined. */
  progress?: number;
  disabled?: boolean;
}

export function FileDropzone({ file, onFileChange, error, onError, progress, disabled = false }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const descriptionId = useId();
  const errorId = useId();

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    const message = validateClaimFile(selected);
    onError(message);
    if (!message) onFileChange(selected);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-2">
      {file ? (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">PDF document · {formatFileSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                onFileChange(null);
                onError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          {progress !== undefined && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Uploading</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} aria-label={`Upload progress ${progress}%`} />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
            isDragging ? "border-primary bg-blue-50" : "border-slate-300 bg-slate-50/60",
            error && "border-red-300",
            disabled && "opacity-60",
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <UploadCloud className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Drag and drop the claim PDF here</p>
            <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">
              Accepted format: PDF · Maximum size: 10 MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
          >
            Browse File
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
