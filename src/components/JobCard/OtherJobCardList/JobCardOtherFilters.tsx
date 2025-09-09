// components/JobCardOther/components/JobCardOtherFilters.tsx
import { Search, Filter, Calendar } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../ui/button";

interface FilterState {
  fromDate: string;
  toDate: string;
  searchQuery: string;
  serviceTypeFilter: string;
  statusFilter: "all" | "submitted" | "draft";
}

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  clearFilters: () => void;
  isDefaultFilter: boolean;
  uniqueServiceTypes: string[];
}

const JobCardOtherFilters: React.FC<Props> = ({
  filters,
  setFilters,
  clearFilters,
  isDefaultFilter,
  uniqueServiceTypes
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
    label 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    label: string;
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
          } as React.CSSProperties}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
          <Calendar className="h-4 w-4" />
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
            placeholder="Search customer name, service type or description..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded-md ${
            showFilters
              ? "bg-gray-100 border-gray-300 text-gray-700"
              : "border-gray-300"
          }`}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex gap-2 mt-2">
        <Button
          variant={filters.statusFilter === "submitted" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters(prev => ({
              ...prev,
              statusFilter: prev.statusFilter === "submitted" ? "all" : "submitted"
            }))
          }
          className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 text-green-700"
        >
          Paid
        </Button>
      </div>

      {/* Active Filters Indicator */}
      {(filters.serviceTypeFilter !== "all" ||
        filters.statusFilter !== "all" ||
        !isDefaultFilter) && (
        <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
          <span>Filters:</span>
          {!isDefaultFilter && (
            <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
              {formatDate(filters.fromDate)} to {formatDate(filters.toDate)}
            </span>
          )}
          {filters.serviceTypeFilter !== "all" && (
            <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
              {filters.serviceTypeFilter}
            </span>
          )}
          {filters.statusFilter === "submitted" && (
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
              Submitted
            </span>
          )}
          {filters.statusFilter === "draft" && (
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
              Draft
            </span>
          )}
        </div>
      )}

      {/* Detailed Filters Panel */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
              <DateInput
                value={filters.fromDate}
                onChange={handleFromDateChange}
                label="From Date"
              />
              <DateInput
                value={filters.toDate}
                onChange={handleToDateChange}
                label="To Date"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Service Type
              </label>
              <select
                value={filters.serviceTypeFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, serviceTypeFilter: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="all">All Services</option>
                {uniqueServiceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {isDefaultFilter
                ? "Showing today's job cards by default"
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

export default JobCardOtherFilters;