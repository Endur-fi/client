"use client";

import { ChevronDown } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { type DataFiltersProps } from "./data-filters";

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps extends DataFiltersProps {
  placeholder: string;
  options: Option[];
  selectedOptions: Option[];
  setSelectedOptions: React.Dispatch<React.SetStateAction<Option[]>>;
  filteredOptions: Option[];
  setFilteredOptions: React.Dispatch<React.SetStateAction<Option[]>>;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  placeholder,
  options,
  selectedOptions,
  setSelectedOptions,
  filteredOptions,
  setFilteredOptions,
  table,
}) => {
  const handleOptionSelect = (option: Option) => {
    setSelectedOptions([...selectedOptions, option]);

    if (!option.label) return;

    setFilteredOptions(filteredOptions.filter((o) => o !== option));

    table.setColumnFilters((prev) => {
      const dapps: any = prev?.find((filter) => filter?.id === "dapp")?.value;

      if (!dapps)
        return prev?.concat({
          id: "dapp",
          value: [option.value],
        });

      return prev.map((f) =>
        f.id === "dapp"
          ? {
              ...f,
              value: dapps?.concat(option.value),
            }
          : f,
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-fit rounded-xl border border-[#17876D]/20 bg-[#17876D]/10 hover:border-green-500 hover:bg-[#17876D]/10"
            disabled={selectedOptions?.length === options?.length}
          >
            <span>
              {selectedOptions.length > 0
                ? `${selectedOptions.length} selected`
                : placeholder}
            </span>
            <ChevronDown className="size-4 text-[#03624C]" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn("w-fit border border-[#17876D] p-0 shadow-xl", {
            hidden: selectedOptions.length === options?.length,
          })}
        >
          <div className="flex flex-col items-start">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                className="flex w-full items-center gap-2 px-4 py-1.5 font-poppins text-[#03624C] ease-linear hover:bg-[#17876D] hover:text-white"
                onClick={() => handleOptionSelect(option)}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MultiSelect;
