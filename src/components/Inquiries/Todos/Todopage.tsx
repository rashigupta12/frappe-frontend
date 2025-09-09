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
      todo.allocated_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="w-full pb-20  ">
      {error && (
        <Alert variant="destructive" className="mb-4 rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 rounded-xl border-emerald-300">
          <AlertDescription>Inspector assigned successfully!</AlertDescription>
        </Alert>
      )}

      {/* Header & Search */}
      <div className="bg-white rounded-xl shadow-md py-3 px-6 mb-2 border border-gray-100">
        <h2 className="text-xl lg:text-2xl font-bold text-emerald-800 mb-4">
          Assigned Inspections
        </h2>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by customer, inspector, status..."
            className="pl-12 w-full bg-gray-50 border border-gray-200 rounded-lg h-12 text-base focus:border-emerald-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="inline-flex items-center justify-center bg-emerald-50 rounded-full p-4 mb-4">
              <ClipboardList className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No inspections found
            </h3>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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