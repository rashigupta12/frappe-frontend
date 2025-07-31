/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  // Calendar as CalendarIcon,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
// import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { useAssignStore } from "../../store/assign";
import { useAuth } from "../../context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
// import { cn } from "../../lib/utils";

type PriorityLevel = "Low" | "Medium" | "High";

interface IspectionDialogProps {
  open: boolean;
  onClose: () => void;
  inquiry: any; // Replace 'any' with a more specific type if available
}

const IspectionDialog: React.FC<IspectionDialogProps> = ({
  open,
  onClose,
  inquiry,
}) => {
  const { user } = useAuth();
  const {
    fetchInspectors,
    inspectors,
    inspectorsLoading,
    createTodo,
    createTodoLoading,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();

  // Form state
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [hasFetchedInspectors, setHasFetchedInspectors] = useState(false);
  const [showPropertyInfo, setShowPropertyInfo] = useState(false);
  const navigate = useNavigate();

  // Fetch inspectors when dialog opens
  useEffect(() => {
    if (open && !hasFetchedInspectors) {
      fetchInspectors();
      setHasFetchedInspectors(true);
    }
  }, [open, hasFetchedInspectors, fetchInspectors]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setInspectorEmail("");
      setPriority("Medium");
      setDate(new Date());
      setDescription("");
      setShowPropertyInfo(false);
    }
  }, [open]);

  // Set initial description from inquiry
  useEffect(() => {
    if (inquiry?.custom_special_requirements) {
      setDescription(inquiry.custom_special_requirements);
    }
  }, [inquiry]);

  const handleAssign = async () => {
    if (!inspectorEmail) {
      alert("Please select an inspector");
      return;
    }

    if (!date) {
      alert("Please select an inspection date");
      return;
    }

    if (!inquiry?.name) {
      alert("Invalid inquiry data");
      return;
    }

    try {
      const preferredDate = format(date, "yyyy-MM-dd");

      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiry.name,
        inspector_email: inspectorEmail,
        description: description,
        priority: priority,
        preferred_date: preferredDate,
      });

      
      onClose();
      navigate("/sales?tab=assign")
    } catch (error) {
      console.error("Error assigning inspector:", error);
      alert("Failed to assign inspector. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assign Inspector</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Basic Inquiry Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">
                  {inquiry?.lead_name || "N/A"}
                </span>
              </div>
              <div className="break-words">
                <span className="font-medium text-gray-600">Phone:</span>
                <span className="ml-2 text-gray-900">
                  {inquiry?.mobile_no || "N/A"}
                </span>
              </div>
              <div className="break-words">
                <span className="font-medium text-gray-600">Job Type:</span>
                <span className="ml-2 text-gray-900">
                  {inquiry?.custom_job_type || "N/A"}
                </span>
              </div>
            </div>
            <div className="break-words">
              <span className="font-medium text-gray-600">Budget Range:</span>
              <span className="ml-2 text-gray-900">
                {inquiry?.custom_budget_range || "N/A"}
              </span>
            </div>
          </div>

          {/* Expandable Property Information */}
          <div className="bg-gray-50 rounded-lg">
            <button
              onClick={() => setShowPropertyInfo(!showPropertyInfo)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              <h3 className="font-medium text-gray-900">
                Property & Project Details
              </h3>
              {showPropertyInfo ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>

            {showPropertyInfo && (
              <div className="px-4 pb-4 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-3 text-sm mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Property Type:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_property_type || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Building Type:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_type_of_building || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Budget Range:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_budget_range || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Project Urgency:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_project_urgency || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Location:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_property_area || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Preferred Date:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_preferred_inspection_date || "N/A"}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Preferred Time:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry?.custom_preferred_inspection_time || "N/A"}
                      </span>
                    </div>
                  </div>

                  {inquiry?.custom_building_name && (
                    <div className="break-words">
                      <span className="font-medium text-gray-600">
                        Building Name:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {inquiry.custom_building_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {assignError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-700 text-sm">{assignError}</div>
            </div>
          )}
          {assignSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
              <div className="text-emerald-700 text-sm">
                Inspector assigned successfully!
              </div>
            </div>
          )}

          {/* Inspector Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              Select Inspector <span className="text-red-500">*</span>
            </Label>
            <Select
              value={inspectorEmail}
              onValueChange={setInspectorEmail}
              disabled={inspectorsLoading}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue
                  placeholder={
                    inspectorsLoading
                      ? "Loading inspectors..."
                      : "Select an inspector"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 max-h-[200px] overflow-y-auto">
                {inspectors.map((inspector) => (
                  <SelectItem
                    key={inspector.name}
                    value={inspector.name}
                    className="break-words"
                  >
                    <div className="flex items-center gap-2">
                      <span>{inspector.full_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Inspection Date <span className="text-red-500">*</span>
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
                    onSelect={(selectedDate: Date | undefined) =>
                      setDate(selectedDate)
                    }
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div> */}

            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as PriorityLevel)}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  <SelectItem value="Low">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="High">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-gray-700 text-sm font-medium">
              Description/Special Requirements
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter any special requirements or notes for the inspector..."
              rows={3}
              className="w-full border border-gray-300 rounded-md"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createTodoLoading}
              className="px-6 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={
                createTodoLoading ||
                inspectorsLoading ||
                !inspectorEmail ||
                !date
              }
              className="px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 w-full sm:w-auto"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default IspectionDialog;
