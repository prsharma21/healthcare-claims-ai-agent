import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  itemLabel = "items",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(totalItems, page * pageSize);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-muted-foreground">
          Rows per page
          <NativeSelect
            className="h-8 w-[72px]"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              variant="outline"
              size="icon-sm"
              className={cn(pageNumber === page && "border-primary bg-blue-50 text-primary hover:bg-blue-50")}
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
