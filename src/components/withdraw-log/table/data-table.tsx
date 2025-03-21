"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface WithdrawDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  pageSize?: number;
}

export function WithdrawDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageSize = 6,
}: WithdrawDataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showPendingOnly, setShowPendingOnly] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnFilters,
      sorting,
    },
  });

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (searchKey) {
        table.getColumn(searchKey)?.setFilterValue(event.target.value);
      }
    },
    [searchKey, table],
  );

  const handlePendingToggle = React.useCallback((checked: boolean) => {
    setShowPendingOnly(checked);
  }, []);

  React.useEffect(() => {
    table.setPageSize(pageSize);
    const statusCol = table.getColumn("status");

    if (statusCol) {
      statusCol.setFilterValue(showPendingOnly ? "Pending" : "");
    }
  }, [data, showPendingOnly, table, pageSize]);

  const noResults = table.getRowModel().rows.length === 0;
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="relative">
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder="Search"
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={handleSearchChange}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="mb-2 mt-4 flex w-full items-center justify-end gap-1 px-4">
        <Checkbox
          id="show-pendings"
          checked={showPendingOnly}
          onCheckedChange={handlePendingToggle}
        />

        <Label htmlFor="show-pendings" className="text-xs font-normal">
          Show only pendings.
        </Label>
      </div>

      <div className="rounded-l-xl rounded-r-xl">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup, idx) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  idx === 0 &&
                    "border-none bg-gradient-to-t from-[#18a79b40] to-[#38EF7D00] hover:bg-gradient-to-t",
                )}
              >
                {headerGroup.headers.map((header, idx) => (
                  <TableHead
                    key={header.id}
                    className={cn("text-xs text-black", {
                      "pl-5": idx === 0,
                      "pr-5 text-right": idx === 2,
                    })}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {!noResults ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn({
                    "bg-[#E3EFEC80] hover:bg-[#E3EFEC80]": idx % 2 === 0,
                  })}
                >
                  {row.getVisibleCells().map((cell, idx) => (
                    <TableCell
                      key={cell.id}
                      className={cn({
                        "pl-5": idx === 0,
                        "pr-5 text-right": idx === 2,
                      })}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div
        className={cn(
          "absolute -bottom-[5.5rem] left-1/2 flex -translate-x-1/2 items-center justify-center space-x-2 py-4",
          {
            "-bottom-[15.3rem]": noResults,
          },
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((pageNumber) => (
            <Button
              key={pageNumber}
              variant="outline"
              size="sm"
              className={cn(
                "border-none bg-transparent text-sm font-normal text-[#8D9C9C] shadow-none transition-all hover:bg-[#17876D] hover:text-white",
                {
                  "bg-[#17876D] text-white": currentPage === pageNumber,
                },
              )}
              onClick={() => table.setPageIndex(pageNumber - 1)}
            >
              {pageNumber}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 border-none bg-transparent text-sm font-normal text-[#8D9C9C] shadow-none transition-all hover:bg-[#17876D] hover:text-white"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
