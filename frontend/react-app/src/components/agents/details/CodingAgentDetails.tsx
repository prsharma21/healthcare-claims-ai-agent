import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import type { CodingAgentResult } from "@/types/agent";

import { CodeValidationCard } from "../CodeValidationCard";

export function CodingAgentDetails({ result }: { result: CodingAgentResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {result.codes.map((code) => (
          <CodeValidationCard key={code.codeType} code={code} />
        ))}
      </div>
      <ConfidenceMeter label="Coding confidence" value={result.confidence} className="max-w-sm" />
    </div>
  );
}
