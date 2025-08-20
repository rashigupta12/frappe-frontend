import { useEffect, useState } from "react";
import { useInspectionStore } from "../../store/inspectionStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { PasswordResetLoader } from "../../common/Loader";

interface InspectionListProps {
  userEmail: string;
}

interface JobType {
  job_type: string;
  // other properties if needed
}

interface InquiryData {
  custom_jobtype?: JobType[];
  custom_project_urgency?: string;
  lead_name?: string;
  custom_type_of_building?: string;
  mobile_no?: string;
  phone?: string;
  custom_budget_range?: string;
  custom_property_area?: string;
}

interface Todo {
  name: string;
  inquiry_data?: InquiryData;
  priority?: string;
  status?: string;
  date?: string;
  description?: string;
  assigned_by_full_name?: string;
  custom_start_time: string;
  custom_end_time: string;
}

const priorityFilters = [
  { id: "all", label: "All" },
  { id: "High", label: "High" },
  { id: "Medium", label: "Med" },
  { id: "Low", label: "Low" },
];

const MobileInspectionList = ({ userEmail }: InspectionListProps) => {
  const { todos, loading, error, fetchTodos } = useInspectionStore() as {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    fetchTodos: (email: string) => void;
  };

  console.log("Todos:", todos);

  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userEmail) {
      fetchTodos(userEmail);
    }
  }, [userEmail, fetchTodos]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return "🔴";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  // Filter to show only open todos and apply other filters
  const filteredTodos = todos.filter((todo) => {
    const isOpen = todo.status === "Open";
    const matchesPriority =
      selectedPriority === "all" || todo.priority === selectedPriority;

    // Extract job types from the array for search
    const jobTypes =
      todo.inquiry_data?.custom_jobtype
        ?.map((j) => j.job_type.toLowerCase())
        .join(" ") || "";

    const matchesSearch =
      searchTerm === "" ||
      todo.inquiry_data?.lead_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      jobTypes.includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return isOpen && matchesPriority && matchesSearch;
  });

  const openTodosCount = todos.filter((t) => t.status === "Open").length;

  if (!userEmail) {
    return (
      <div className="p-4 text-center text-gray-600">
        Please log in to view inspections.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <PasswordResetLoader />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy format
  };

  const formatTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";

    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-800 rounded-md mb-3 mx-3">
        <p className="font-medium text-sm">Error loading inspections</p>
        <button
          onClick={() => fetchTodos(userEmail)}
          className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-3 py-3   w-full lg:mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              To Do's
            </h1>
            <div className="flex items-center space-x-2 text-xs lg:text-sm">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                Open {openTodosCount}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                Total {todos.length}
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Priority Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:space-x-2 lg:space-y-2">
              {priorityFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedPriority(filter.id)}
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

      {/* Content */}
      <div className="px-3  py-2 w-full lg:mx-auto">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 lg:py-16">
            <div className="text-4xl lg:text-5xl mb-2">📋</div>
            <h3 className="text-sm lg:text-base font-medium text-gray-900 mb-1">
              No open inspections
            </h3>
          </div>
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-2 lg:space-y-0">
            {filteredTodos.map((todo) => (
              <div
                key={todo.name}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm  hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm ">
                        {getPriorityIcon(todo.priority || "")}
                      </span>
                      <span>{todo.date && formatDate(todo.date)}</span>
                      <span>•</span>
                      <span className="text-sm">
                        {todo.custom_start_time &&
                          formatTime(todo.custom_start_time)}
                      </span>
                      {todo.custom_end_time && (
                        <>
                          <span>-</span>
                          <span className="text-sm">
                            {formatTime(todo.custom_end_time)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                      
                      <span className="text-gray-600">
                        {todo.inquiry_data?.custom_jobtype
                          ?.map((j) => j.job_type)
                          .join(", ") || "N/A"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs lg:text-xs px-2 py-1 h-7 lg:h-8 ml-2 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      navigate(`/inspector?tab=details`, { state: { todo } });
                    }}
                  >
                    Create
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs lg:text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">👤</span>
                    <span className="text-gray-600 truncate">
                      {todo.inquiry_data?.lead_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">🏠</span>
                    <span className="text-gray-600 truncate">
                      {todo.inquiry_data?.custom_type_of_building || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">📞</span>
                    <span className="text-gray-600 truncate">
                      {todo.inquiry_data?.mobile_no ||
                        todo.inquiry_data?.phone ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">💰</span>
                    <span className="text-gray-600 truncate">
                      {todo.inquiry_data?.custom_budget_range || "N/A"}
                    </span>
                  </div>
                </div>

                {todo.inquiry_data?.custom_property_area && (
                  <div className="pt-1 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400">📍</span>
                      <span className="text-gray-600 truncate text-sm lg:text-base">
                        {todo.inquiry_data.custom_property_area}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {todo.description && (
                  <div className=" border-t border-gray-100 pt-1">
                    <p className="text-xs text-gray-600 line-clamp-2 lg:line-clamp-3">
                      {todo.description.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInspectionList;
