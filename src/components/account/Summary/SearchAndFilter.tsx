// src/components/common/SearchAndFilter.tsx
import { Filter, Search } from "lucide-react";
import React from "react";
import { Button } from "../../ui/button";

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  modeFilter: "all" | "cash" | "card" | "bank" | "credit";
  onModeFilterChange: (mode: "all" | "cash" | "card" | "bank" | "credit") => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  isDefaultFilter: boolean;
  onResetFilters: () => void;
  filterStatusText: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  modeFilter,
  onModeFilterChange,
  showFilters,
  onToggleFilters,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  // isDefaultFilter,
  onResetFilters,
  filterStatusText,
}) => {
  // const formatDate = (d: string) =>
  //   new Date(d).toLocaleDateString("en-GB", {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "2-digit",
  //   });

  return (
    <div className=" p-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className={`px-3 py-2 border rounded-md ${
            showFilters
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "border-gray-300"
          }`}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* quick mode filter buttons */}
      <div className="flex gap-2 mt-2">
        {(["cash", "card", "bank", "credit"] as const).map((m) => (
          <Button
            key={m}
            variant="outline"
            size="sm"
            onClick={() => {
              const newMode = modeFilter === m ? "all" : m;
              onModeFilterChange(newMode);
            }}
            className={`h-8 px-3 text-xs ${
              modeFilter === m
                ? "border-emerald-600 text-black"
                : "border-gray-200"
            }`}
          >
            {m === "card"
              ? "Credit Card"
              : m.charAt(0).toUpperCase() + m.slice(1)}
          </Button>
        ))}
      </div>

      {/* collapsible advanced filters */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                From Date
              </label>
               <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => onFromDateChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={
                      {
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      } as React.CSSProperties
                    }
                  />
                  {/* Custom Calendar Icon - Clickable */}
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                    onClick={() => {
                      // Focus and click the input to trigger date picker
                      const inputs = document.querySelectorAll(
                        'input[type="date"]'
                      ) as NodeListOf<HTMLInputElement>;
                      const fromInput = inputs[0]; // First date input (From Date)
                      if (fromInput) {
                        fromInput.focus();
                        if (
                          "showPicker" in fromInput &&
                          typeof fromInput.showPicker === "function"
                        ) {
                          fromInput.showPicker();
                        }
                      }
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                To Date
              </label>
              <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => onToDateChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={
                      {
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      } as React.CSSProperties
                    }
                  />
                  {/* Custom Calendar Icon - Clickable */}
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                    onClick={() => {
                      // Focus and click the input to trigger date picker
                      const inputs = document.querySelectorAll(
                        'input[type="date"]'
                      ) as NodeListOf<HTMLInputElement>;
                      const toInput = inputs[1]; // Second date input (To Date)
                      if (toInput) {
                        toInput.focus();
                        if (
                          "showPicker" in toInput &&
                          typeof toInput.showPicker === "function"
                        ) {
                          toInput.showPicker();
                        }
                      }
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-gray-500">{filterStatusText}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="px-3 py-1.5 text-xs"
            >
              Reset to Today
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;