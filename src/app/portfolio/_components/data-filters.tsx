import { X } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

import MultiSelect, { type Option } from "./multi-select";

const typeOptions: Option[] = [
  { value: "dex", label: "Dex" },
  { value: "lend", label: "Lend" },
];

const protocolOptions: Option[] = [
  { value: "ekubo", label: "Ekubo" },
  { value: "nostra", label: "Nostra" },
];

const DataFilters: React.FC = () => {
  const [selectedTypeOptions, setSelectedTypeOptions] = React.useState<
    Option[]
  >([]);
  const [filteredTypeOptions, setFilteredTypeOptions] =
    React.useState(typeOptions);

  const [selectedProtocolOptions, setSelectedProtocolOptions] = React.useState<
    Option[]
  >([]);
  const [filteredProtocolOptions, setFilteredProtocolOptions] =
    React.useState(protocolOptions);

  const handleRemoveTypeOption = (option: Option) => {
    setSelectedTypeOptions(selectedTypeOptions.filter((o) => o !== option));
    setFilteredTypeOptions([...filteredTypeOptions, option]);
  };

  const handleRemoveProtocolOption = (option: Option) => {
    setSelectedProtocolOptions(
      selectedProtocolOptions.filter((o) => o !== option),
    );
    setFilteredProtocolOptions([...filteredProtocolOptions, option]);
  };

  return (
    <div className="mt-10 flex w-full items-end justify-between">
      <div className="flex items-center gap-2">
        {selectedTypeOptions.length > 0 && (
          <div className="flex items-center gap-2">
            {selectedTypeOptions.map((option) => (
              <Button
                className="flex h-8 flex-wrap gap-2 border border-green-500 bg-[#E3EFEC]/70 px-2 py-0 text-xs text-black shadow-none hover:bg-[#E3EFEC]/70"
                onClick={() => handleRemoveTypeOption(option)}
                key={option.value}
              >
                <p className="flex items-center gap-2 rounded-full">
                  {option.label}
                  <X />
                </p>
              </Button>
            ))}
          </div>
        )}

        {selectedProtocolOptions.length > 0 && (
          <div className="flex items-center gap-2">
            {selectedProtocolOptions.map((option) => (
              <Button
                className="flex h-8 flex-wrap gap-2 border border-indigo-500 bg-[#E3EFEC]/70 px-2 py-0 text-xs text-black shadow-none hover:bg-[#E3EFEC]/70"
                onClick={() => handleRemoveProtocolOption(option)}
                key={option.value}
              >
                <p className="flex items-center gap-2 rounded-full">
                  {option.label}
                  <X />
                </p>
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <MultiSelect
          placeholder="Select type"
          options={typeOptions}
          selectedOptions={selectedTypeOptions}
          setSelectedOptions={setSelectedTypeOptions}
          filteredOptions={filteredTypeOptions}
          setFilteredOptions={setFilteredTypeOptions}
        />

        <MultiSelect
          placeholder="Select protocol"
          options={protocolOptions}
          selectedOptions={selectedProtocolOptions}
          setSelectedOptions={setSelectedProtocolOptions}
          filteredOptions={filteredProtocolOptions}
          setFilteredOptions={setFilteredProtocolOptions}
        />
      </div>
    </div>
  );
};

export default DataFilters;
