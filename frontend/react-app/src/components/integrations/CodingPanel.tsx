import { Code2 } from "lucide-react";

import { CodeValidationCard } from "@/components/agents/CodeValidationCard";
import { ExpandablePanel } from "@/components/common/ExpandablePanel";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { CodeValidation } from "@/types/agent";
import type { ApiCall } from "@/types/integration";

import { ApiCallList } from "./ApiCallList";

export function CodingPanel({ codes, calls }: { codes: CodeValidation[]; calls: ApiCall[] }) {
  const allValid = codes.every((code) => code.valid);
  return (
    <ExpandablePanel
      title="Mock Coding API"
      subtitle={codes.map((code) => code.code).join(" · ")}
      icon={<Code2 className="size-4" aria-hidden="true" />}
      aside={<StatusBadge label={allValid ? "All codes valid" : "Invalid codes"} tone={allValid ? "success" : "danger"} />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {codes.map((code) => (
          <CodeValidationCard key={code.codeType} code={code} />
        ))}
      </div>
      <div className="mt-5">
        <ApiCallList calls={calls} />
      </div>
    </ExpandablePanel>
  );
}
