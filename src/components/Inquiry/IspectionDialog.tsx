/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { frappeAPI } from "../../api/frappeClient";
import { useAuth } from "../../context/AuthContext";
import {
  timeToMinutes
} from '../../lib/timeUtils';
import { useAssignStore } from "../../store/assign";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
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
import UserAvailability from "../ui/UserAvailability";

type PriorityLevel = "Low" | "Medium" | "High";


// Interface for UserAvailability data structure
interface InspectorAvailability {
  user_id: string;
  user_name: string;
  email: string;
  date: string;
  availability: {
    occupied_slots: Array<{start: string, end: string}>;
    free_slots: Array<{start: string, end: string, duration_hours?: number}>;
    is_completely_free: boolean;
    total_occupied_hours: number;
  };
}

interface IspectionDialogProps {
  open: boolean;
  onClose: () => void;
  inquiry: any;
}

const IspectionDialog: React.FC<IspectionDialogProps> = ({
  open,
  onClose,
  inquiry,
}) => {
  console.log("inquiry", inquiry);
  const { user } = useAuth();
  const {
    createTodo,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();

  // Form state
  const [selectedInspector, setSelectedInspector] = useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{start: string, end: string} | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const navigate = useNavigate();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedInspector(null);
      setSelectedSlot(null);
      setPriority("Medium");
      setDate(new Date());
      setDescription("");
      setRequestedTime("");
      setDuration("0.5");
      setShowAvailabilityModal(false);
      setIsAssigning(false);
    }
  }, [open]);

  // Set initial values from inquiry
  useEffect(() => {
    if (inquiry) {
      if (inquiry?.custom_special_requirements) {
        setDescription(inquiry.custom_special_requirements);
      }
      if (inquiry?.custom_preferred_inspection_date) {
        setDate(new Date(inquiry.custom_preferred_inspection_date));
      }
      if (inquiry?.custom_preferred_inspection_time) {
        setRequestedTime(inquiry.custom_preferred_inspection_time);
      }
      if (inquiry?.custom_duration) {
        setDuration(inquiry.custom_duration);
      }
    }
  }, [inquiry]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    // Reset inspector selection when date changes
    setSelectedInspector(null);
    setSelectedSlot(null);
  };

  const handleShowAvailability = () => {
    if (!date) {
      toast.error("Please select a date first");
      return;
    }
    setShowAvailabilityModal(true);
  };

  // Handle inspector selection from UserAvailability modal
  const handleInspectorSelect = (email: string, availabilityData: InspectorAvailability[]) => {
    const inspector = availabilityData.find(inspector => inspector.email === email);
    if (inspector) {
      setSelectedInspector(inspector);
      // Auto-select the first available slot if there's one
      if (inspector.availability.free_slots.length > 0) {
        const firstSlot = inspector.availability.free_slots[0];
        setSelectedSlot({
          start: firstSlot.start,
          end: firstSlot.end
        });
        toast.success(`Selected ${inspector.user_name} - Please select a specific time slot if needed`);
      } else {
        toast.success(`Selected ${inspector.user_name}`);
      }
    }
  };

  // Function to select a specific time slot from the selected inspector
  const handleSlotSelect = (slot: {start: string, end: string}) => {
    setSelectedSlot(slot);
    toast.success(`Selected time slot: ${slot.start} - ${slot.end}`);
  };

  const validateRequestedTime = () => {
    if (!requestedTime || !selectedSlot) return true;

    const requestedMinutes = timeToMinutes(requestedTime);
    const slotStartMinutes = timeToMinutes(selectedSlot.start);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);
    const durationMinutes = Math.round(parseFloat(duration) * 60);

    // Check if requested time is within the selected slot
    if (requestedMinutes < slotStartMinutes || requestedMinutes >= slotEndMinutes) {
      return false;
    }

    // Check if requested time + duration fits within the slot
    if (requestedMinutes + durationMinutes > slotEndMinutes) {
      return false;
    }

    return true;
  };

  const handleAssign = async () => {
    // Validation
    if (!selectedInspector) {
      toast.error("Please select an inspector");
      return;
    }

    if (!date) {
      toast.error("Please select an inspection date");
      return;
    }

    if (!requestedTime) {
      toast.error("Please enter the requested inspection time");
      return;
    }

    if (!validateRequestedTime()) {
      toast.error(`Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`);
      return;
    }

    if (!inquiry?.name) {
      toast.error("Invalid inquiry data");
      return;
    }

    setIsAssigning(true);
    let todoCreated = false;

    try {
      const preferredDate = format(date, "yyyy-MM-dd");

      // Step 1: Create the todo
      console.log("Creating todo...");
      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiry.name,
        inspector_email: selectedInspector.email,
        description: description,
        priority: priority,
        preferred_date: preferredDate,
      });

      todoCreated = true;
      console.log("Todo created successfully");

      // Step 2: Get employee name for DWA
      console.log("Looking up employee...");
      let employeeName = '';
      const employeeResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Employee?filters=[["user_id","=","${selectedInspector.email}"]]`
      );

      if (employeeResponse?.data?.length > 0) {
        employeeName = employeeResponse.data[0].name;
        console.log("Employee found:", employeeName);
      } else {
        throw new Error(`Could not find employee record for ${selectedInspector.email}`);
      }

      // Step 3: Create the Daily Work Allocation
      console.log("Creating Daily Work Allocation...");
      const dwaPayload = {
        "employee_name": employeeName,
        "date": preferredDate,
        "custom_work_allocation": [
          {
            "work_title": inquiry.custom_job_type || "Site Inspection",
            "work_description": inquiry.custom_property_area,
            "expected_start_date": requestedTime, // Use the customer's requested time
            "expected_time_in_hours": parseFloat(duration),
          }
        ]
      };

      await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/Daily Work Allocation",
        dwaPayload
      );

      console.log("Daily Work Allocation created successfully");

      // All operations successful
      toast.success("Inspector assigned successfully!");
      onClose();
      navigate("/sales?tab=assign");

    } catch (error) {
      console.error("Error during assignment process:", error);
      
      let errorMessage = "Failed to assign inspector";
      
      if (error instanceof Error) {
        errorMessage = `Failed to assign inspector: ${error.message}`;
      } else {
        errorMessage = `Failed to assign inspector: ${String(error)}`;
      }

      if (todoCreated) {
        errorMessage += ". Todo was created but work allocation failed. Please check manually.";
      }

      toast.error(errorMessage);
      
    } finally {
      setIsAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-emerald-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assign Inspector</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
              disabled={isAssigning}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Customer Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Customer Details</h3>
            <div className="text-sm">
              {inquiry?.lead_name || inquiry?.mobile_no || inquiry?.email ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[inquiry.lead_name, inquiry.mobile_no, inquiry.email]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">No customer details available</div>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Job Type:</span>
                <span className="ml-2 text-gray-900">
                  {inquiry?.custom_job_type || "N/A"}
                </span>
              </div>
              <div className="break-words text-sm">
                {inquiry?.custom_project_urgency || inquiry?.custom_budget_range ? (
                  <span className="text-gray-900">
                    {[inquiry?.custom_project_urgency, inquiry?.custom_budget_range]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Property Information</h3>
            <div className="text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Address:</span>
                <span className="ml-2 text-gray-900">
                  {[inquiry?.custom_building_name, inquiry?.custom_property_area]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Schedule */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Inspection Schedule</h3>
            <div className="text-sm">
              {inquiry?.custom_preferred_inspection_date || inquiry?.custom_preferred_inspection_time ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiry?.custom_preferred_inspection_date
                        ? format(new Date(inquiry.custom_preferred_inspection_date), "dd/MM/yyyy")
                        : null,
                      inquiry?.custom_preferred_inspection_time,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
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

          {/* Step 1: Date Selection */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Step 1: Select Inspection Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm" +
                    (!date && " text-muted-foreground")
                  }
                  disabled={isAssigning}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(checkDate) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(checkDate);
                    selectedDate.setHours(0, 0, 0, 0);
                    return selectedDate < today || isAssigning;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Step 2: Inspector Selection */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Step 2: Select Inspector <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start bg-white border border-gray-300 h-auto py-3"
              onClick={handleShowAvailability}
              disabled={!date || isAssigning}
            >
              <User className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="flex-1 text-left">
                {selectedInspector ? (
                  <div>
                    <div className="font-medium">{selectedInspector.user_name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedInspector.email}
                    </div>
                  </div>
                ) : (
                  <span>View Available Inspectors</span>
                )}
              </div>
            </Button>
            {selectedInspector && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <div className="text-emerald-800 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span><strong>Selected:</strong> {selectedInspector.user_name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Time Slot Selection (if inspector is selected) */}
          {selectedInspector && selectedInspector.availability.free_slots.length > 0 && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label className="text-gray-700 text-sm font-medium">
                Step 3: Select Available Time Slot <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedInspector.availability.free_slots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedSlot?.start === slot.start && selectedSlot?.end === slot.end ? "default" : "outline"}
                    className="justify-between h-auto py-2 px-3 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleSlotSelect({start: slot.start, end: slot.end})}
                    disabled={isAssigning}
                  >
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {slot.start} - {slot.end}
                      </div>
                      {slot.duration_hours && (
                        <div className="text-xs text-gray-500">
                          {slot.duration_hours}h available
                        </div>
                      )}
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Customer Requested Time and Duration */}
          {selectedInspector && selectedSlot && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <Label className="text-gray-700 text-sm font-medium">
                Step 4: Enter Customer's Requested Time & Duration
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Requested Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={requestedTime}
                      onChange={(e) => setRequestedTime(e.target.value)}
                      className="pl-2"
                      disabled={isAssigning}
                    />
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        if (isAssigning) return;
                        const input = document.querySelector(
                          'input[type="time"]'
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          if ("showPicker" in input && typeof input.showPicker === "function") {
                            input.showPicker();
                          }
                        }
                      }}
                    >
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Must be between {selectedSlot.start} and {selectedSlot.end}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Duration (Hours) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 1.5"
                      className="w-full pr-12"
                      disabled={isAssigning}
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-sm">
                      hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as PriorityLevel)}
              disabled={isAssigning}
            >
              <SelectTrigger className="w-full bg-white border border-gray-300">
                <SelectValue placeholder="Select priority" />
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

          {/* Description */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Description/Special Requirements
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter any special requirements or notes for the inspector..."
              rows={3}
              className="w-full border border-gray-300 rounded-md resize-none"
              disabled={isAssigning}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAssigning}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={
                isAssigning ||
                !selectedInspector ||
                !date ||
                !requestedTime ||
                !validateRequestedTime()
              }
              className="px-6 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
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

      {/* UserAvailability Modal */}
      {showAvailabilityModal && (
        <UserAvailability
          date={date || new Date()}
          onClose={() => setShowAvailabilityModal(false)}
          onSelectInspector={handleInspectorSelect}
        />
      )}
    </div>
  );
};

export default IspectionDialog;