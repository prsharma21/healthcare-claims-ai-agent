import { ConfidenceMeter } from "@/components/common/ConfidenceMeter";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DocumentAgentResult } from "@/types/agent";
import { formatPercent } from "@/utils/format";

export function DocumentAgentDetails({ result }: { result: DocumentAgentResult }) {
  const { extraction } = result;
  const complete = extraction.fieldsExtracted === extraction.fieldsExpected;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border p-3">
          <ConfidenceMeter value={result.confidence} />
        </div>
        <div className="rounded-md border p-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium uppercase tracking-wide text-muted-foreground">Fields extracted</span>
            <span className={cn("font-semibold tabular-nums", complete ? "text-slate-900" : "text-red-700")}>
              {extraction.fieldsExtracted} / {extraction.fieldsExpected}
            </span>
          </div>
          <Progress
            value={(extraction.fieldsExtracted / extraction.fieldsExpected) * 100}
            aria-label={`${extraction.fieldsExtracted} of ${extraction.fieldsExpected} fields extracted`}
            indicatorClassName={complete ? "bg-green-600" : "bg-amber-500"}
          />
        </div>
        <div className="rounded-md border p-3 text-xs">
          <p className="font-medium uppercase tracking-wide text-muted-foreground">Pages processed</p>
          <p className="mt-1 text-sm font-semibold">{extraction.pagesProcessed}</p>
        </div>
      </div>

      {extraction.missingFields.length > 0 && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="note">
          Missing required fields: {extraction.missingFields.join(", ")}.
        </p>
      )}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <caption className="sr-only">Fields extracted from the claim document</caption>
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-semibold">Field</th>
              <th scope="col" className="px-3 py-2 text-left font-semibold">Extracted value</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {extraction.fields.map((field) => (
              <tr key={field.key}>
                <th scope="row" className="whitespace-nowrap px-3 py-1.5 text-left font-medium text-muted-foreground">
                  {field.label}
                </th>
                <td className="px-3 py-1.5 font-medium">
                  {field.value ?? <span className="font-semibold text-red-700">Missing</span>}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                  {field.value ? formatPercent(field.confidence) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
