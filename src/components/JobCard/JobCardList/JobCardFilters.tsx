// components/JobCard/components/JobCardFilters.tsx
import { Search, Filter, Calendar } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../ui/button";

interface FilterState {
  fromDate: string;
  toDate: string;
  searchQuery: string;
  purposeFilter: "all" | "pressing" | "material" | "both" | "submitted";
}

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  clearFilters: () => void;
  isDefaultFilter: boolean;
}

const JobCardFilters: React.FC<Props> = ({
  filters,
  setFilters,
  clearFilters,
  isDefaultFilter
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleFromDateChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      fromDate: value,
      toDate: value > prev.toDate ? value : prev.toDate
    }));
  };

  const handleToDateChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      toDate: value,
      fromDate: value < prev.fromDate ? value : prev.fromDate
    }));
  };

  const DateInput = ({ 
    value, 
    onChange, 
    label, 
    inputIndex 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    label: string;
    inputIndex: number;
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          } as React.CSSProperties}
        />
        <div
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
          onClick={() => {
            const inputs = document.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
            const input = inputs[inputIndex];
            if (input) {
              input.focus();
              if ("showPicker" in input && typeof input.showPicker === "function") {
                input.showPicker();
              }
            }
          }}
        >
          <Calendar className="h-5 w-5" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white mb-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer name or work type..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded-md ${
            showFilters
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "border-gray-300"
          }`}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex gap-2 mt-2">
        <Button
          variant={filters.purposeFilter === "pressing" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters(prev => ({
              ...prev,
              purposeFilter: prev.purposeFilter === "pressing" ? "all" : "pressing"
            }))
          }
          className="h-8 px-3 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
        >
          P
        </Button>
        <Button
          variant={filters.purposeFilter === "material" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters(prev => ({
              ...prev,
              purposeFilter: prev.purposeFilter === "material" ? "all" : "material"
            }))
          }
          className="h-8 px-3 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
        >
          M
        </Button>
        <Button
          variant={filters.purposeFilter === "both" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters(prev => ({
              ...prev,
              purposeFilter: prev.purposeFilter === "both" ? "all" : "both"
            }))
          }
          className="h-8 px-3 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
        >
          P M
        </Button>
        <Button
          variant={filters.purposeFilter === "submitted" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters(prev => ({
              ...prev,
              purposeFilter: prev.purposeFilter === "submitted" ? "all" : "submitted"
            }))
          }
          className="h-8 px-3 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
        >
          Paid
        </Button>
      </div>

      {/* Active filters indicator */}
      {(filters.purposeFilter !== "all" || !isDefaultFilter) && (
        <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <span>Filters:</span>
          {!isDefaultFilter && (
            <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
              {formatDate(filters.fromDate)} to {formatDate(filters.toDate)}
            </span>
          )}
          {filters.purposeFilter === "pressing" && (
            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">P</span>
          )}
          {filters.purposeFilter === "material" && (
            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">M</span>
          )}
          {filters.purposeFilter === "both" && (
            <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">P M</span>
          )}
          {filters.purposeFilter === "submitted" && (
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Paid</span>
          )}
        </div>
      )}

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
              <DateInput
                value={filters.fromDate}
                onChange={handleFromDateChange}
                label="From Date"
                inputIndex={0}
              />
              <DateInput
                value={filters.toDate}
                onChange={handleToDateChange}
                label="To Date"
                inputIndex={1}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {isDefaultFilter
                ? "Showing today's job cards"
                : `Custom filter: ${formatDate(filters.fromDate)} to ${formatDate(filters.toDate)}`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs"
              >
                Reset to Today
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCardFilters;