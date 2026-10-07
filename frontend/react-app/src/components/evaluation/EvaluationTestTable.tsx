import { CheckCircle2, XCircle } from "lucide-react";

import { ClaimStatusBadge } from "@/components/claims/ClaimStatusBadge";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { EvaluationTestCase } from "@/types/evaluation";
import { formatLatency } from "@/utils/format";

const columns: DataTableColumn<EvaluationTestCase>[] = [
  {
    id: "test",
    header: "Test ID",
    cell: (test) => <span className="font-mono text-[13px] font-semibold">{test.testId}</span>,
  },
  {
    id: "claim",
    header: "Claim ID",
    cell: (test) => <span className="font-mono text-[13px]">{test.claimId}</span>,
  },
  { id: "scenario", header: "Scenario", cell: (test) => test.scenario, className: "min-w-[220px]" },
  { id: "expected", header: "Expected Decision", cell: (test) => <ClaimStatusBadge status={test.expectedDecision} /> },
  { id: "actual", header: "Actual Decision", cell: (test) => <ClaimStatusBadge status={test.actualDecision} /> },
  {
    id: "result",
    header: "Result",
    cell: (test) =>
      test.result === "PASS" ? (
        <StatusBadge label="Pass" tone="success" icon={<CheckCircle2 aria-hidden="true" />} />
      ) : (
        <StatusBadge label="Fail" tone="danger" icon={<XCircle aria-hidden="true" />} />
      ),
  },
  {
    id: "latency",
    header: "Latency",
    align: "right",
    cell: (test) => <span className="tabular-nums">{formatLatency(test.latencyMs)}</span>,
  },
];

export function EvaluationTestTable({ tests }: { tests: EvaluationTestCase[] }) {
  return (
    <DataTable
      caption="Evaluation test cases"
      columns={columns}
      rows={tests}
      getRowId={(test) => test.testId}
      isRowHighlighted={(test) => test.result === "FAIL"}
      emptyState={<EmptyState title="No test cases." description="Run an evaluation to see results." />}
    />
  );
}
