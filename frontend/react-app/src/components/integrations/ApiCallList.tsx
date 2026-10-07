import { cn } from "@/lib/utils";
import type { ApiCall } from "@/types/integration";
import { formatLatency, formatTime } from "@/utils/format";

/** Request log showing method, path, response status and latency. */
export function ApiCallList({ calls, title = "API requests" }: { calls: ApiCall[]; title?: string }) {
  if (calls.length === 0) {
    return <p className="text-sm text-muted-foreground">No requests recorded for this claim.</p>;
  }

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="divide-y overflow-hidden rounded-md border bg-slate-950 font-mono text-xs text-slate-100">
        {calls.map((call) => (
          <li key={`${call.method}-${call.path}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
            <span
              className={cn(
                "w-11 rounded-sm px-1 py-0.5 text-center text-[10px] font-bold",
                call.method === "GET" ? "bg-blue-500/20 text-blue-300" : "bg-violet-500/20 text-violet-300",
              )}
            >
              {call.method}
            </span>
            <span className="min-w-0 flex-1 break-all">{call.path}</span>
            <span className={cn("font-semibold", call.statusCode < 300 ? "text-green-400" : "text-red-400")}>
              {call.statusCode} {call.statusText}
            </span>
            <span className="text-slate-400">{formatLatency(call.latencyMs)}</span>
            <span className="hidden text-slate-500 sm:inline">{formatTime(call.timestamp)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
