"use client";

import { useAccount } from "@starknet-react/core";
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { address } = useAccount();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnFilters,
      sorting,
    },
  });

  const currentPage = table.getState().pagination.pageIndex + 1;
  const isFirstRowOnFirstPage = React.useMemo(
    () => currentPage === 1,
    [currentPage],
  );

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      table.getColumn(searchKey!)?.setFilterValue(event.target.value);
    },
    [searchKey, table],
  );

  const renderHeaderCell = React.useCallback(
    (headerGroup: { headers: any[] }) =>
      headerGroup.headers.map((header, i) => (
        <TableHead key={header.id} className="p-0">
          <div
            className={cn(
              "flex h-full items-center justify-start border-t border-[#17876D]/50 bg-[#17876D]/20 px-8 text-left text-xs font-normal text-black",
              {
                "rounded-tl-lg border-l border-t border-[#17876D]/50": i === 0,
                "pl-10": i === 3,
                "justify-end rounded-tr-lg border-r border-t border-[#17876D]/50 pr-20":
                  i === headerGroup.headers.length - 1,
              },
            )}
          >
            <span className="shrink-0 text-sm">
              {!header.isPlaceholder &&
                flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          </div>
        </TableHead>
      )),
    [],
  );

  const renderRowCell = React.useCallback(
    (row: any, idx: number) =>
      row.getVisibleCells().map((cell: any, i: number) => {
        const isFirstCell = i === 0;
        const isLastCell = i === row.getVisibleCells().length - 1;
        const isLastRow = idx === table.getRowModel().rows.length - 1;

        return (
          <TableCell
            className={cn("px-8", {
              "pl-16": i === 2,
              "rounded-bl-lg": isFirstCell && isLastRow,
              "rounded-br-lg": isLastCell && isLastRow,
            })}
            key={cell.id}
          >
            <div className="sticky z-10">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
              {isFirstCell && isFirstRowOnFirstPage && address && idx === 0 && (
                <Badge className="absolute mb-1 ml-2 h-4 text-nowrap bg-[#16876D] text-[10px] leading-[1] text-white">
                  your rank
                </Badge>
              )}
            </div>
            {isFirstCell && isFirstRowOnFirstPage && address && idx === 0 && (
              <div className="absolute left-1/2 top-1/2 z-0 h-8 w-[98%] -translate-x-1/2 -translate-y-1/2 rounded-md bg-[#F4F2F2]" />
            )}
          </TableCell>
        );
      }),
    [isFirstRowOnFirstPage, table.getRowModel().rows.length, address],
  );

  return (
    <div>
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

      <div className="rounded-r-x rounded-l-xl">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b-0 hover:bg-inherit"
              >
                {renderHeaderCell(headerGroup)}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn("h-12 border-0 bg-white hover:bg-white", {
                    "bg-[#F5F9F8] hover:bg-[#F5F9F8]": (idx + 1) % 2 === 0,
                    "relative bg-white": idx === 0,
                  })}
                >
                  {renderRowCell(row, idx)}
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

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
