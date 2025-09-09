import { useEffect, useState } from "react";
import { useInspectionStore } from "../../../store/inspectionStore";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../common/Loader";

import { priorityFilters, type Todo } from "./type";
import MobileInspectionCard from "./TodoCard";
import InspectionHeader from "./TodoHeader";
import InspectionTable from "./TodoTable";


interface InspectionListProps {
  userEmail: string;
}



const TodosList = ({ userEmail }: InspectionListProps) => {
  const { todos, loading, error, fetchTodos } = useInspectionStore() as {
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

  const handleEditTodo = (todo: Todo) => {
    navigate(`/inspector?tab=details`, { state: { todo } });
  };

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
        <Loader />
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
      {/* Header */}
      <InspectionHeader
        openTodosCount={openTodosCount}
        totalTodosCount={todos.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        priorityFilters={priorityFilters}
      />

      {/* Content */}
      <div className="px-3 py-2 w-full lg:mx-auto">
        {/* Mobile View */}
        <div className="lg:hidden">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No open inspections
              </h3>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <MobileInspectionCard
                  key={todo.name}
                  todo={todo}
                  onEdit={handleEditTodo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <InspectionTable
            todos={filteredTodos}
            loading={loading}
            onEdit={handleEditTodo}
          />
        </div>
      </div>
    </div>
  );
};

export default TodosList;