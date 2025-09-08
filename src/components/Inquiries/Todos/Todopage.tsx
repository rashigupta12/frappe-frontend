/* eslint-disable @typescript-eslint/no-explicit-any */
// TodoPage.tsx
import { ClipboardList, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useAssignStore } from "../../../store/assign";
import { Alert, AlertDescription } from "../../ui/alert";
import { Input } from "../../ui/input";
import TodoTable from "./TodoTable";
import TodoCard from "./TodoCard";
import InspectionDialog from "../IspectionDialog";

export default function TodoPage() {
  const {
    todos,
    todosLoading,
    fetchTodos,
    error,
    success,
    clearError,
    currentUserEmail,
    setCurrentUser,
  } = useAssignStore();

  const [searchTerm, setSearchTerm] = useState("");

  // State for inspection dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);

  const { user } = useAuth();

  // Set current user
  useEffect(() => {
    setCurrentUser(user?.username ?? "sales_rep@eits.com");
  }, [setCurrentUser, user]);

  // Fetch initial data
  useEffect(() => {
    if (currentUserEmail) {
      fetchTodos();
    }
  }, [currentUserEmail, fetchTodos]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, clearError]);

  // Handle edit button click
  const handleEditInspection = (todo: any) => {
    setSelectedTodo(todo);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTodo(null);
  };

  // Filter todos based on search
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.inquiry_data?.lead_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      todo.reference_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.allocated_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.priority?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Sort todos by due date (ascending - earliest first)
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : Number.MIN_SAFE_INTEGER;
    const dateB = b.date ? new Date(b.date).getTime() : Number.MIN_SAFE_INTEGER;
    return dateB - dateA; // Changed from dateA - dateB to dateB - dateA
  });

  return (
    <div className="w-full pb-20 p-2">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>Inspector assigned successfully!</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-emerald-800">
              Assigned Inspections
            </h2>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-md">
            <div className="hidden md:flex items-center gap-4 w-full">
              <div className="relative flex-[4]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by customer name, inspector, status..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by customer name, inspector, status..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <TodoTable
          todos={sortedTodos}
          loading={todosLoading}
          onEdit={handleEditInspection}
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {todosLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4 text-gray-500">
            <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-3 md:p-4 mb-2 md:mb-3">
              <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-700 mb-1">
              No inspections found
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-2">
            {sortedTodos.map((todo) => (
              <TodoCard
                key={todo.name}
                todo={todo}
                onEdit={handleEditInspection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inspection Dialog */}
      {isDialogOpen && selectedTodo && (
        <InspectionDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          data={selectedTodo}
          mode="edit"
        />
      )}
    </div>
  );
}
