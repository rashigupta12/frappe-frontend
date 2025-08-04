/* eslint-disable @typescript-eslint/no-explicit-any */
// TodoPage.tsx
import { format } from "date-fns";
import {
  CalendarIcon,
  ClipboardList,
  Edit,
  FileText,
  // Filter,
  MapPin,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPriorityColor, getStatusColor } from "../../helpers/helper";
import { useAssignStore } from "../../store/assign";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
import InspectionDialog from "./InspectionDialogEdit";

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
  // const [selectedStatus, setSelectedStatus] = useState("All");
  // const [selectedPriority, setSelectedPriority] = useState("All");
  // const [selectedInspector, setSelectedInspector] = useState("All");
  // const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  console.log("Todos:", todos);

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

  // Filter todos based on search and filters
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.inquiry_data?.lead_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      todo.reference_name?.toLowerCase().includes(searchTerm.toLowerCase()) || todo.allocated_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.priority?.toLowerCase().includes(searchTerm.toLowerCase());

    // const matchesStatus =
    //   selectedStatus === "All" ||
    //   (selectedStatus === "Open" && todo.status === "Open") ||
    //   (selectedStatus === "Completed" && todo.status === "Completed")||
    //   (selectedStatus === "Cancelled" && todo.status === "Cancelled");

    // const matchesPriority =
    //   selectedPriority === "All" || todo.priority === selectedPriority;

    // const matchesInspector =
    //   selectedInspector === "All" ||
    //   todo.allocated_to
    //     ?.toLowerCase()
    //     .includes(selectedInspector.toLowerCase());

    return (
      matchesSearch 
    );
  });

  return (
    <div className="w-full pb-20">
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
              {/* <div className="flex items-center gap-2 flex-[2]">
                <Select
                  value={selectedPriority}
                  onValueChange={setSelectedPriority}
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="All">All Priorities</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
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

              {/* <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>

              {showMobileFilters && (
                <div className="space-y-2 mt-2 p-2 bg-gray-50 rounded-lg">
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300">
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPriority}
                    onValueChange={setSelectedPriority}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300">
                      <SelectItem value="All">All Priorities</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedInspector}
                    onValueChange={setSelectedInspector}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Inspector" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-300">
                      <SelectItem value="All">All Inspectors</SelectItem>
                      {Array.from(
                        new Set(todos.map((todo) => todo.allocated_to))
                      ).map((inspector) => (
                        <SelectItem key={inspector} value={inspector}>
                          {inspector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} */}
            </div>
          </div>
        </div>
      </div>

      {/* Inspection List */}
      <div className="">
        {todosLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredTodos.length === 0 ? (
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
            {/* <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("All");
                setSelectedPriority("All");
                setSelectedInspector("All");
                setShowMobileFilters(false);
              }}
              className="mt-1 md:mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-sm md:text-base"
              size="sm"
            >
              Clear Filters
            </Button> */}
          </div>
        ) : (
          <div className="space-y-3 p-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            {filteredTodos.map((todo) => (
              <div
                key={todo.name}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 border border-gray-100 shadow-xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300"
              >
                <div className="flex justify-between items-start gap-2">
                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 w-full">
                      {/* Lead name with truncation */}
                      <h4 className="font-semibold text-sm text-gray-800 truncate flex-1 mb-2">
                        {todo.inquiry_data?.lead_name || todo.reference_name}
                      </h4>

                      {/* Priority and Status badges aligned to right */}
                      <div className="flex items-center gap-1 ml-2">
                        <Badge
                          style={{
                            backgroundColor: getPriorityColor(todo.priority).bg,
                            color: getPriorityColor(todo.priority).text,
                            borderColor: getPriorityColor(todo.priority).border,
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          {todo.priority}
                        </Badge>
                        <Badge
                          style={{
                            backgroundColor: getStatusColor(todo.status).bg,
                            color: getStatusColor(todo.status).text,
                            borderColor: getStatusColor(todo.status).border,
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          {todo.status}
                        </Badge>
                      </div>
                    </div>
                   <div className="flex items-center gap-2 text-xs">
  <CalendarIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
  <span className="text-gray-600">
    Due:{" "}
    <span className="font-medium">
      {todo.date
        ? format(new Date(todo.date), "dd/MM/yyyy")
        : "Not specified"}
    </span>
  </span>
</div>

                    {/* Additional details below */}
                    <div className=" space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">
                          Inspector:{" "}
                          <span className="font-medium">
                            {todo.allocated_to}
                          </span>
                        </span>
                      </div>

                      
                      {todo.inquiry_data?.custom_property_area && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600">
                            <span className="font-medium">
                              {todo.inquiry_data.custom_property_area}
                            </span>
                          </span>
                        </div>
                      )}

                      {todo.description && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 leading-tight line-clamp-2">
                            {todo.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Button - moved to bottom right */}
                {todo.status !== "Closed" && (
                  <div className="flex justify-end ">
                    <Button
                      onClick={() => handleEditInspection(todo)}
                      variant="outline"
                      size="sm"
                      className="h-6 flex items-center gap-1 text-xs  border-emerald-900 text-emerald-800 hover:bg-emerald-900 hover:border-emerald-900 hover:text-emerald-900 transition-all duration-200"
                    >
                      <Edit className="h-3 w-3 text-emerald-900" />
                      {/* <span className="hidden sm:inline">Edit</span> */}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspection Dialog */}
      {isDialogOpen && selectedTodo && (
        <InspectionDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          todoData={selectedTodo}
          mode="edit"
        />
      )}
    </div>
  );
}
