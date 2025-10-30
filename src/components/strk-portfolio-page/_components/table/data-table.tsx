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
  type Table as TableType,
} from "@tanstack/react-table";
import * as React from "react";

import { type ProtocolConfig } from "@/components/defi";
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
import { cn, formatNumberWithCommas } from "@/lib/utils";

import DataFilters from "../data-filters";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  getPortfolioDAppAction,
  getPortfolioDAppAPY,
  getPortfolioDAppAsset,
} from "./columns";

interface DefiInformationProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
}

export function DefiInformation<TData, TValue>({
  columns,
  data,
  searchKey,
}: DefiInformationProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const isMobile = useIsMobile();

  const defiCards = data as ProtocolConfig[];

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

  React.useEffect(() => {
    table.setPageSize(10);
  }, [data, table]);

  return (
    <div className="w-full">
      <div>
        <div className="mb-4 w-full">
          <DataFilters
            table={table as unknown as TableType<ProtocolConfig[]>}
          />
        </div>

        {searchKey && (
          <div className="flex items-center py-4">
            <Input
              placeholder="Search"
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
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
                  {headerGroup.headers.map((header, i) => {
                    return (
                      <TableHead key={header.id} className="p-0">
                        <div
                          className={cn(
                            "flex h-full items-center justify-start border-t border-[#17876D]/50 bg-[#17876D]/20 px-8 text-left text-xs font-normal text-black",
                            {
                              "rounded-tl-2xl border-l border-t border-[#17876D]/50":
                                i === 0,
                              "pl-10": i === 3,
                              "justify-end rounded-tr-2xl border-r border-t border-[#17876D]/50 pr-20":
                                i === headerGroup.headers.length - 1,
                            },
                          )}
                        >
                          <span className="shrink-0">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn("border-0 bg-white hover:bg-white", {
                      "bg-[#F5F9F8] hover:bg-[#dbe7e4]": (idx + 1) % 2 === 0,
                    })}
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <TableCell
                        className={cn("px-8", {
                          "pl-16": i === 2,
                        })}
                        key={cell.id}
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

      {isMobile &&
        //   TODO: move to [DefiInformation] => separate DefiCards component - SOLVED
        defiCards.map((card, idx) => <DefiCard card={card} key={idx} />)}
    </div>
  );
}

const DefiCard: React.FC<{
  card: ProtocolConfig;
}> = ({ card }) => {
  return (
    <div
      className={cn(
        "float-left mt-2 w-full border-0 bg-white p-[10px] hover:bg-white",
      )}
    >
      <div className="justify flex justify-between">
        <div className="flex items-center gap-2">
          <span className="w-[25px]">{card.protocolIcon}</span>
          <span>{card.protocolName}</span>
        </div>
        <div>{getPortfolioDAppAction({ original: card })}</div>
      </div>
      <div className="mt-2 text-[12px] text-[#939494]">{card.description}</div>
      <div className="justify flex w-full justify-between">
        <div className="max-w-[60%]">
          {getPortfolioDAppAsset({
            original: { ...card, description: "" },
          })}
        </div>
        <div className="py-3">{getPortfolioDAppAPY({ original: card })}</div>
      </div>
      <div>
        <span className="text-[12px] text-[#03624C]">
          <b>Your Holding:</b>
        </span>
        <span className="flex">
          {formatNumberWithCommas(
            card.tokens[
              card.tokens.findIndex((t) => t.name === "xSTRK")
            ].holding?.toEtherToFixedDecimals(2) ?? "0.00",
          )}{" "}
          xSTRK
        </span>
      </div>
    </div>
  );
};
