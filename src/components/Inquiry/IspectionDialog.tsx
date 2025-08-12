

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CalendarIcon,
  Loader2,
  X,
  CalendarCheck,
  Clock,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { 
  doTimeRangesOverlap, 
  timeToMinutes,
  minutesToTime 
} from '../../lib/timeUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAssignStore } from "../../store/assign";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import UserAvailability from "../ui/UserAvailability";
import { Input } from "../ui/input";
import { frappeAPI } from "../../api/frappeClient";

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
  console.log("inquiry", inquiry);
  const { user } = useAuth();
  const {
    fetchInspectors,
    inspectors,
    inspectorsLoading,
    createTodo,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();

  // Form state
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [hasFetchedInspectors, setHasFetchedInspectors] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false); // Local loading state
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
      setTime("");
      setDuration("0.5");
      setShowAvailability(false);
      setIsAssigning(false); // Reset loading state
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
        setTime(inquiry.custom_preferred_inspection_time);
      }
      if (inquiry?.custom_duration) {
        setDuration(inquiry.custom_duration);
      }
    }
  }, [inquiry]);




  //check time 

  const checkInspectorAvailability = async (
  inspectorEmail: string,
  date: Date,
  startTime: string,
  duration: string
): Promise<{ valid: boolean; message?: string; nextAvailableSlot?: string }> => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const durationHours = parseFloat(duration);
    const durationMinutes = Math.round(durationHours * 60);
    
    // Convert start time to minutes
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    
    // Check if within working hours (9 AM to 6 PM)
    if (startMinutes < timeToMinutes('09:00') || endMinutes > timeToMinutes('18:00')) {
      return {
        valid: false,
        message: 'Time must be between 9:00 AM and 6:00 PM'
      };
    }
    
    // Fetch inspector's schedule for the day
    const response = await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/method/eits_app.inspector_availability.get_employee_availability?date=${formattedDate}&email=${inspectorEmail}`
    );
    
    if (response.message && response.message.status === 'success') {
      const inspectorData = response.message.data.find(
        (insp: any) => insp.email === inspectorEmail
      );
      
      if (!inspectorData) {
        return { valid: false, message: 'Inspector not found' };
      }
      
      const { occupied_slots } = inspectorData.availability;
      
      // Check against existing occupied slots
      for (const slot of occupied_slots) {
        if (doTimeRangesOverlap(
          startTime,
          minutesToTime(endMinutes),
          slot.start,
          slot.end
        )) {
          return {
            valid: false,
            message: `Overlaps with existing appointment (${slot.start} - ${slot.end})`
          };
        }
        
        // Check for 30-minute buffer before
        const bufferStart = timeToMinutes(slot.start) - 30;
        if (startMinutes < timeToMinutes(slot.start) && 
            endMinutes > bufferStart) {
          return {
            valid: false,
            message: `Must leave 30 minutes before existing appointment (${slot.start})`
          };
        }
        
        // Check for 30-minute buffer after
        const bufferEnd = timeToMinutes(slot.end) + 30;
        if (startMinutes < bufferEnd && 
            endMinutes > timeToMinutes(slot.end)) {
          return {
            valid: false,
            message: `Must leave 30 minutes after existing appointment (${slot.end})`
          };
        }
      }
      
      return { valid: true };
    }
    
    return { valid: false, message: 'Failed to check availability' };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { valid: false, message: 'Error checking availability' };
  }
};
  const handleAssign = async () => {
    // Validation
    if (!inspectorEmail) {
      toast.error("Please select an inspector");
      return;
    }

    if (!date) {
      toast.error("Please select an inspection date");
      return;
    }

    if (!time) {
      toast.error("Please select an inspection time");
      return;
    }

    if (!inquiry?.name) {
      toast.error("Invalid inquiry data");
      return;
    }

    // Set loading state
    setIsAssigning(true);
    
    let todoCreated = false;

    try {

       setIsAssigning(true);
    
    const availabilityCheck = await checkInspectorAvailability(
      inspectorEmail,
      date!,
      time,
      duration
    );
    
    if (!availabilityCheck.valid) {
      toast.error(availabilityCheck.message || 'Time slot not available');
      setIsAssigning(false);
      return;
    }
      const preferredDate = format(date, "yyyy-MM-dd");

      // Step 1: Create the todo
      console.log("Creating todo...");
      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiry.name,
        inspector_email: inspectorEmail,
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
        `/api/resource/Employee?filters=[["user_id","=","${inspectorEmail}"]]`
      );

      if (employeeResponse?.data?.length > 0) {
        employeeName = employeeResponse.data[0].name;
        console.log("Employee found:", employeeName);
      } else {
        throw new Error(`Could not find employee record for ${inspectorEmail}`);
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
            "expected_start_date": time,
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
      
      // If todo was created but DWA failed, we might want to rollback
      // However, since there's no rollback mechanism in your current setup,
      // we'll just show the error and let the user know the partial state
      
      let errorMessage = "Failed to assign inspector";
      
      if (error instanceof Error) {
        errorMessage = `Failed to assign inspector: ${error.message}`;
      } else {
        errorMessage = `Failed to assign inspector: ${String(error)}`;
      }

      // If todo was created but DWA failed, add additional context
      if (todoCreated) {
        errorMessage += ". Todo was created but work allocation failed. Please check manually.";
      }

      toast.error(errorMessage);
      
      // Don't close dialog or navigate on error
      // User can retry or close manually
      
    } finally {
      // Always reset loading state
      setIsAssigning(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-emerald-600  p-4 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Assign Inspector</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
              disabled={isAssigning} // Prevent closing during assignment
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 ">
          {/* Customer Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 ">Customer Details</h3>
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
                <div className="text-gray-500">
                  No customer details available
                </div>
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
                {inquiry?.custom_project_urgency ||
                  inquiry?.custom_budget_range ? (
                  <span className="text-gray-900">
                    {[
                      inquiry?.custom_project_urgency,
                      inquiry?.custom_budget_range,
                    ]
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
            <h3 className="font-medium text-gray-900 ">Property Information</h3>
            <div className="text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Address:</span>
                <span className="ml-2 text-gray-900">
                  {[
                    inquiry?.custom_building_name,
                    inquiry?.custom_property_area,
                  ]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Schedule */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 ">Inspection Schedule</h3>
            <div className="text-sm">
              {inquiry?.custom_preferred_inspection_date ||
                inquiry?.custom_preferred_inspection_time ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiry?.custom_preferred_inspection_date
                        ? format(
                          new Date(inquiry.custom_preferred_inspection_date),
                          "dd/MM/yyyy"
                        )
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

          {/* Inspector Selection */}
          <div className="space-y-2 p-4 py-2 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Select Inspector <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-10">
                <Select
                  value={inspectorEmail}
                  onValueChange={setInspectorEmail}
                  disabled={inspectorsLoading || isAssigning}
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
              <div className="col-span-2 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-8 rounded-md text-gray-600 hover:text-emerald-600 hover:bg-gray-100"
                  onClick={() => setShowAvailability(true)}
                  disabled={isAssigning}
                >
                  <CalendarCheck className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Availability Modal */}
          {showAvailability && (
            <UserAvailability
              date={date || new Date()}
              onClose={() => setShowAvailability(false)}
              onSelectInspector={(email) => {
                setInspectorEmail(email);
              }}
            />
          )}

          {/* Time and Duration */}
          <div className="grid grid-cols-12 gap-2 p-4 py-2 bg-gray-50 rounded-lg">

               <div className="col-span-5 space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Inspection Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={
                      "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm" +
                      (!date && " text-muted-foreground")
                    }
                    disabled={isAssigning}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {date ? (
                      format(date, "dd/MM/yyyy")
                    ) : (
                      <span>Select date</span>
                    )}
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
                    disabled={(date) => date < new Date() || isAssigning}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {/* Time */}
            <div className="col-span-4 space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
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
            </div>

            {/* Duration */}
            <div className="col-span-3 space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Duration(Hrs)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="w-full pr-8"
                  disabled={isAssigning}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 text-sm">
                  hrs
                </span>
              </div>
            </div>
          </div>

          {/* Date and Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 py-2 bg-gray-50 rounded-lg">
         

            <div className="space-y-2">
              <Label className="text-gray-700 text-sm font-medium">
                Priority
              </Label>
              <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Description/Special Requirements
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter any special requirements or notes for the inspector..."
              rows={3}
              className="w-full border border-gray-300 rounded-md"
              disabled={isAssigning}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex  justify-end gap-2 pt-4 border-t border-gray-200">
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
                inspectorsLoading ||
                !inspectorEmail ||
                !date ||
                !time
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
    </div>
  );
};

export default IspectionDialog;
