// SearchAndFilters.tsx

import { statusFilters, type SearchAndFiltersProps } from "./types";

export const SearchAndFilters = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
}: SearchAndFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4">
      <div className="lg:flex-1 lg:mb-0 relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="search by name, job type, or description"
          className="w-full pl-10 pr-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex space-x-2 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:space-x-2 lg:space-y-2 pt-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onStatusChange(filter.id)}
            className={`px-3 py-1 text-xs lg:text-sm rounded-full whitespace-nowrap transition-colors ${
              selectedStatus === filter.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};
