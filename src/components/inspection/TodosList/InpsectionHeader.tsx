import type { PriorityFilter } from "./type";


interface InspectionHeaderProps {
  openTodosCount: number;
  totalTodosCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  priorityFilters: PriorityFilter[];
}

const InspectionHeader = ({
  openTodosCount,
  totalTodosCount,
  searchTerm,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  priorityFilters,
}: InspectionHeaderProps) => {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
      <div className="px-3 py-3 w-full lg:mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">
            To Do's
          </h1>
          <div className="flex items-center space-x-2 text-xs lg:text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
              Open {openTodosCount}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              Total {totalTodosCount}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4">
          {/* Search Bar */}
          <div className="lg:flex-1 mb-3 lg:mb-0 relative">
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
              placeholder="Search by name, job type, or description"
              className="w-full pl-10 pr-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Priority Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:space-x-2 lg:space-y-2">
            {priorityFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onPriorityChange(filter.id)}
                className={`px-3 py-1 text-xs lg:text-sm rounded-full whitespace-nowrap transition-colors ${
                  selectedPriority === filter.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionHeader;