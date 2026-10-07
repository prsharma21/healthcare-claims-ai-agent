import type { KeyboardEvent, ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** Use for cells with buttons so clicking them does not trigger the row click. */
  interactive?: boolean;
  /** Keeps the column pinned to the right edge when the table scrolls horizontally. */
  stickyRight?: boolean;
}

const stickyRightClasses = "sticky right-0 z-10 bg-inherit shadow-[inset_1px_0_0_var(--color-border)]";

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Accessible description of the table. */
  caption: string;
  onRowClick?: (row: T) => void;
  getRowLabel?: (row: T) => string;
  isRowHighlighted?: (row: T) => boolean;
  emptyState?: ReactNode;
  className?: string;
}

const alignClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  onRowClick,
  getRowLabel,
  isRowHighlighted,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <Table className={className}>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              className={cn(
                alignClasses[column.align ?? "left"],
                column.stickyRight && cn(stickyRightClasses, "bg-slate-50"),
                column.className,
              )}
            >
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={getRowId(row)}
            className={cn(
              "bg-card",
              onRowClick && "cursor-pointer focus-visible:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2",
              isRowHighlighted?.(row) && "bg-orange-50 hover:bg-orange-100/60",
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (event) => handleKeyDown(event, row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            aria-label={onRowClick && getRowLabel ? getRowLabel(row) : undefined}
          >
            {columns.map((column) => (
              <TableCell
                key={column.id}
                className={cn(alignClasses[column.align ?? "left"], column.stickyRight && stickyRightClasses, column.className)}
              >
                {column.interactive ? (
                  <div
                    className={cn("inline-flex items-center gap-1.5", column.align === "right" && "justify-end")}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    role="presentation"
                  >
                    {column.cell(row)}
                  </div>
                ) : (
                  column.cell(row)
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
