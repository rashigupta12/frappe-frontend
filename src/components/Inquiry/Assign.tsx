/* eslint-disable @typescript-eslint/no-unused-vars */
import { format } from "date-fns";
import {
  CalendarIcon,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { useAssignStore } from "../../store/assign";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

export default function TodoPage() {
  const location = useLocation();
  const {
    todos,
    todosLoading,
    availableInquiries,
    inquiriesLoading,
    inspectors,
    inspectorsLoading,
    fetchTodos,
    fetchAvailableInquiries,
    fetchInspectors,
    createTodo,
    createTodoLoading,
    showAssignForm,
    openAssignForm,
    closeAssignForm,
    selectedInquiry,
    selectInquiry,
    error,
    success,
    clearError,
    currentUserEmail,
    setCurrentUser,
  } = useAssignStore();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    inquiry_id: "",
    inspector_email: "",
    description: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });
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
      fetchAvailableInquiries();
      fetchInspectors();
    }
  }, [currentUserEmail, fetchTodos, fetchAvailableInquiries, fetchInspectors]);

  // Handle navigation state - when coming from another page
  useEffect(() => {
    if (location.state?.inquiry && availableInquiries.length > 0) {
      const inquiry = location.state.inquiry;

      // Open the assign form
      openAssignForm();

      // Set the form data with the inquiry
      setFormData((prev) => ({
        ...prev,
        inquiry_id: inquiry.name,
        description: inquiry.custom_special_requirements || "",
      }));

      // Select the inquiry in the store
      selectInquiry(inquiry);

      // Set the preferred date if available
      if (inquiry.custom_preferred_inspection_date) {
        setDate(new Date(inquiry.custom_preferred_inspection_date));
      }

      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, availableInquiries, openAssignForm, selectInquiry]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, clearError]);

  const handleCreateTodo = async () => {
    // Clear any previous errors
    clearError();

    // Validation with specific error messages
    if (!formData.inquiry_id) {
      // You'll need to add a setError function to your store or handle this differently
      alert("Please select an inquiry");
      return;
    }

    if (!formData.inspector_email) {
      alert("Please select an inspector");
      return;
    }

    if (!date) {
      alert("Please select an inspection date");
      return;
    }

    try {
      // Use the selected date instead of inquiry's preferred date
      const preferredDate = date
        ? format(date, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");

      await createTodo({
        ...formData,
        description:
          formData.description ||
          selectedInquiry?.custom_special_requirements ||
          "",
        preferred_date: preferredDate,
      });

      // Reset form and close dialog on success
      setFormData({
        inquiry_id: "",
        inspector_email: "",
        description: "",
        priority: "Medium",
      });
      setDate(new Date());

      // Refresh todos list
      fetchTodos();
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const priorityVariant = {
    Low: "secondary",
    Medium: "default",
    High: "destructive",
  } as const;

  const getJobTypeColor = (jobType: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        "AC Repair & Maintenance": {
          bg: "#DBEAFE", // Light blue
          text: "#1E40AF",
          border: "#3B82F6",
        },
        "Civil Repairing Work": {
          bg: "#FDE68A", // Light yellow
          text: "#92400E",
          border: "#F59E0B",
        },
        "Electrical Repair & Maintenance": {
          bg: "#FEF3C7", // Light amber
          text: "#92400E",
          border: "#F59E0B",
        },
        "Equipments Installation & Maintenance": {
          bg: "#FECACA", // Light red
          text: "#991B1B",
          border: "#EF4444",
        },
        "Joineries & Wood Work": {
          bg: "#D1FAE5", // Light green
          text: "#065F46",
          border: "#10B981",
        },
        "Painting & Interior Decoration": {
          bg: "#DDD6FE", // Light purple
          text: "#5B21B6",
          border: "#8B5CF6",
        },
        "Plumbing, Sanitary, Bathroom & Toilets": {
          bg: "#E9D5FF", // Light violet
          text: "#6B21A8",
          border: "#9333EA",
        },
        "Veneer Pressing": {
          bg: "#FFE4E6", // Light pink
          text: "#9D174D",
          border: "#EC4899",
        },
        Other: {
          bg: "#E5E7EB", // Neutral gray
          text: "#4B5563",
          border: "#9CA3AF",
        },
      };

    return colors[jobType as keyof typeof colors] || colors["Other"];
  };

 const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        "Emergency in  1 Hr": {
          bg: "#FECACA", // Light red
          text: "#991B1B", // Dark red
          border: "#EF4444", // Red
        },
        "Fast 1 day": {
          bg: "#FDE68A", // Light yellow
          text: "#92400E", // Amber brown
          border: "#F59E0B", // Amber
        },
        "Normal 1 to 7 days": {
          bg: "#BFDBFE", // Light blue
          text: "#1E40AF", // Dark blue
          border: "#3B82F6", // Blue
        },
        "Planned 1 month & above": {
          bg: "#DDD6FE", // Light violet
          text: "#5B21B6", // Indigo
          border: "#8B5CF6", // Violet
        },
        "Relaxed 1 to 2 weeks": {
          bg: "#D1FAE5", // Light green
          text: "#065F46", // Dark green
          border: "#10B981", // Green
        },
        "Urgent 1 to 4 hrs": {
          bg: "#FEF3C7", // Light amber
          text: "#92400E", // Dark amber
          border: "#F59E0B", // Amber
        },
      };

    return (
      colors[urgency as keyof typeof colors] || {
        bg: "#E5E7EB", // Neutral gray
        text: "#4B5563",
        border: "#9CA3AF",
      }
    );
  };

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
            <Button
              onClick={() => openAssignForm()}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Inspector
            </Button>
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

      {/* Assign Inspector Dialog - Mobile Optimized */}
      <Dialog open={showAssignForm} onOpenChange={closeAssignForm}>
        <DialogContent className="w-[95vw] max-w-[425px] sm:max-w-[650px] max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg py-2 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-emerald-800 text-lg sm:text-xl">
              Assign Inspector
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto">
            {/* Inquiry Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="inquiry"
                className="text-gray-700 text-sm font-medium"
              >
                Select Inquiry
              </Label>
              <Select
                value={formData.inquiry_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, inquiry_id: value });
                  const inquiry = availableInquiries.find(
                    (inq) => inq.name === value
                  );
                  if (inquiry) {
                    selectInquiry(inquiry);
                    if (inquiry.custom_preferred_inspection_date) {
                      setDate(
                        new Date(inquiry.custom_preferred_inspection_date)
                      );
                    }
                    setFormData((prev) => ({
                      ...prev,
                      description: inquiry.custom_special_requirements || "",
                    }));
                  }
                }}
                disabled={inquiriesLoading}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select an inquiry" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[200px]">
                  {availableInquiries.map((inquiry) => (
                    <SelectItem key={inquiry.name} value={inquiry.name}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{inquiry.lead_name}</span>
                        <span className="text-xs text-gray-500">
                          {inquiry.custom_job_type} ({inquiry.name})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Inquiry Preview - Compact Two Column Layout */}
            {selectedInquiry && (
              <Card className="border border-gray-200 shadow-none p-3">
                <div className="flex flex-wrap gap-1 ">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      backgroundColor:
                        getJobTypeColor(selectedInquiry.custom_job_type).bg +
                        "20",
                      color: getJobTypeColor(selectedInquiry.custom_job_type)
                        .text,
                      borderColor: getJobTypeColor(
                        selectedInquiry.custom_job_type
                      ).border,
                    }}
                  >
                    {selectedInquiry.custom_job_type}
                  </Badge>
                  {selectedInquiry.custom_project_urgency && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor:
                          getUrgencyColor(
                            selectedInquiry.custom_project_urgency
                          ).bg + "20",
                        color: getUrgencyColor(
                          selectedInquiry.custom_project_urgency
                        ).text,
                        borderColor: getUrgencyColor(
                          selectedInquiry.custom_project_urgency
                        ).border,
                      }}
                    >
                      {selectedInquiry.custom_project_urgency}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Property</p>
                    <p className="font-medium truncate">
                      {selectedInquiry.custom_property_type || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium truncate">
                      {selectedInquiry.custom_budget_range || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Preferred Date</p>
                    <p className="font-medium truncate">
                      {selectedInquiry.custom_preferred_inspection_date
                        ? format(
                            new Date(
                              selectedInquiry.custom_preferred_inspection_date
                            ),
                            "PP"
                          )
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Location</p>
                    <p className="font-medium truncate">
                      {selectedInquiry.custom_map_data || "-"}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Inspector Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="inspector"
                className="text-gray-700 text-sm font-medium"
              >
                Select Inspector
              </Label>
              <Select
                value={formData.inspector_email}
                onValueChange={(value) =>
                  setFormData({ ...formData, inspector_email: value })
                }
                disabled={inspectorsLoading}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select an inspector" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 max-h-[200px]">
                  {inspectors.map((inspector) => (
                    <SelectItem key={inspector.name} value={inspector.name}>
                      <div className="flex items-center gap-2">
                        <span>{inspector.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="text-gray-700 text-sm font-medium"
                >
                  Inspection Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PP") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-gray-700 text-sm font-medium"
                >
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as "Low" | "Medium" | "High",
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-gray-700 text-sm font-medium"
              >
                Special Requirements
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-white border border-gray-300 text-sm min-h-[80px]"
                placeholder="Special requirements"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeAssignForm}
              className="border-gray-300 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTodo}
              disabled={
                createTodoLoading ||
                !formData.inquiry_id ||
                !formData.inspector_email ||
                !date
              }
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white w-full sm:w-auto order-1 sm:order-2"
            >
              {createTodoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Inspector"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
