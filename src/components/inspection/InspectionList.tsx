import { useEffect, useState } from "react";
import { useInspectionStore } from "../../store/inspectionStore";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface InspectionListProps {
  userEmail: string;
}

interface InquiryData {
  custom_job_type?: string;
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
}

const priorityFilters = [
  { id: "all", label: "All" },
  { id: "High", label: "High" },
  { id: "Medium", label: "Med" },
  { id: "Low", label: "Low" },
];

const MobileInspectionList = ({ userEmail }: InspectionListProps) => {
  const {
    todos,
    loading,
    error,
    fetchTodos,
  } = useInspectionStore() as {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    fetchTodos: (email: string) => void;
  };
  
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userEmail) {
      fetchTodos(userEmail);
    }
  }, [userEmail, fetchTodos]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-500 text-white";
      case "Low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

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
    const matchesPriority = selectedPriority === "all" || todo.priority === selectedPriority;
    const matchesSearch = searchTerm === "" || 
      (todo.inquiry_data?.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       todo.inquiry_data?.custom_job_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       todo.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
        <div className="px-3 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Open Inspections</h1>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                {openTodosCount} Open
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                {todos.length} Total
              </span>
            </div>
          </div>
          
          {/* Compact Search */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search inspections..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Priority Filter Pills */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {priorityFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedPriority(filter.id)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
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

      {/* Content */}
      <div className="px-3 py-2">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No open inspections</h3>
            <p className="text-xs text-gray-500">Try adjusting your search or priority filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodos.map((todo) => (
              <div
                key={todo.name}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {getPriorityIcon(todo.priority || "")}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {todo.inquiry_data?.custom_job_type || "Inspection"}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>
                        {todo.date && new Date(todo.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        {todo.inquiry_data?.custom_project_urgency || "Normal"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-7 ml-2 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      navigate(`/inspector?tab=details`, { state: { todo } });
                    }}
                  >
                    Create
                  </Button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
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
                      {todo.inquiry_data?.mobile_no || todo.inquiry_data?.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-400">💰</span>
                    <span className="text-gray-600 truncate">
                      {todo.inquiry_data?.custom_budget_range || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {todo.description && (
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {todo.description.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                )}

                {/* Assigned By */}
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">
                    {todo.assigned_by_full_name 
                      ? `By ${todo.assigned_by_full_name}`
                      : "No assignment info"
                    }
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(todo.priority || "")}`}>
                    {todo.priority || "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInspectionList;