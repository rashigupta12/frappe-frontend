// TodoPage.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import { format } from "date-fns";
import {
  CalendarIcon,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Filter,
  Search,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAssignStore } from "../../store/assign";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedInspector, setSelectedInspector] = useState("All");
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

  const priorityVariant = {
    Low: "secondary",
    Medium: "default",
    High: "destructive",
  } as const;

  // Filter todos based on search and filters
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch =
      todo.inquiry_data?.lead_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      todo.reference_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Open" && todo.status === "Open") ||
      (selectedStatus === "Completed" && todo.status === "Completed");

    const matchesPriority =
      selectedPriority === "All" || todo.priority === selectedPriority;

    const matchesInspector =
      selectedInspector === "All" ||
      todo.allocated_to
        ?.toLowerCase()
        .includes(selectedInspector.toLowerCase());

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesInspector
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
                  placeholder="Search inspections..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 flex-[2]">
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
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex items-center gap-2 w-full">
              <div className="relative w-[70%]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-[30%] flex justify-end">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full px-2 bg-white border border-gray-300 justify-center">
                    <Filter className="h-4 w-4 text-gray-600" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-md w-[200px]">
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
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("All");
                setSelectedPriority("All");
                setSelectedInspector("All");
              }}
              className="mt-1 md:mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-sm md:text-base"
              size="sm"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4 p-2 md:p-4">
            {filteredTodos.map((todo) => (
              <div
                key={todo.name}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-100 shadow-xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2 md:gap-3">
                  <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="bg-emerald-100/50 text-emerald-800 rounded-md md:rounded-lg p-1.5 md:p-2 mt-0.5">
                      <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm md:text-base text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                        {todo.inquiry_data?.lead_name || todo.reference_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            priorityVariant[
                              todo.priority as "Low" | "Medium" | "High"
                            ]
                          }
                          className="text-xs"
                        >
                          {todo.priority}
                        </Badge>
                        <Badge
                          variant={
                            todo.status === "Open" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {todo.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-gray-500">Assigned to</p>
                      <p className="text-sm font-medium">{todo.allocated_to}</p>
                    </div>
                  </div>
                </div>

                {/* Additional details */}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      Inspector:{" "}
                      <span className="font-medium">{todo.allocated_to}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      Due Date:{" "}
                      <span className="font-medium">
                        {todo.inquiry_data?.custom_preferred_inspection_date
                          ? format(
                              new Date(
                                todo.inquiry_data.custom_preferred_inspection_date
                              ),
                              "PPP"
                            )
                          : "Not specified"}
                      </span>
                    </span>
                  </div>

                  {todo.inquiry_data?.custom_special_requirements && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-3.5 w-3.5 mt-0.5 text-gray-400" />
                      <span className="text-xs text-gray-600 leading-tight line-clamp-2">
                        {todo.inquiry_data.custom_special_requirements}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}