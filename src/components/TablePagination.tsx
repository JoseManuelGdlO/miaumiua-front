import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
};

function pageItems(current: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const windowSize = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const items: Array<number | "ellipsis"> = [];
  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("ellipsis");
  }
  for (let next = start; next <= end; next += 1) {
    if (items[items.length - 1] !== next) items.push(next);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) items.push("ellipsis");
    if (items[items.length - 1] !== totalPages) items.push(totalPages);
  }
  return items;
}

export function TablePagination({ page, pageSize, total, label, onPageChange }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(safePage * pageSize, total);
  const items = pageItems(safePage, totalPages);

  return (
    <div className="space-y-3 pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          Mostrando {start} a {end} de {total} {label}
        </p>
        <Pagination className="mx-0 ml-auto w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                aria-label="Página anterior"
                size="icon"
                className={safePage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                onClick={() => onPageChange(Math.max(1, safePage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
            {items.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === safePage}
                    onClick={() => onPageChange(item)}
                    className={
                      item === safePage
                        ? "cursor-pointer border-transparent bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                        : "cursor-pointer"
                    }
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationLink
                aria-label="Página siguiente"
                size="icon"
                className={safePage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Página {safePage} de {totalPages}</span>
        <span>Total {label}: {total}</span>
      </div>
    </div>
  );
}
