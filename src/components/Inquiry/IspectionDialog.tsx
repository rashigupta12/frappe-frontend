/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import { CalendarIcon, Loader2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { frappeAPI } from "../../api/frappeClient";
import { useAuth } from "../../context/AuthContext";
import { timeToMinutes } from "../../lib/timeUtils";
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
type DialogMode = "create" | "edit";

interface InspectorAvailability {
  user_id: string;
  user_name: string;
  email: string;
  date: string;
  availability: {
    occupied_slots: Array<{ start: string; end: string }>;
    free_slots: Array<{ start: string; end: string; duration_hours?: number }>;
    is_completely_free: boolean;
    total_occupied_hours: number;
  };
}

interface InspectionDialogProps {
  open: boolean;
  onClose: () => void;
  data: any; // Can be inquiry (for create) or todo (for edit)
  mode: DialogMode;
}

const InspectionDialog: React.FC<InspectionDialogProps> = ({
  open,
  onClose,
  data,
  mode,
}) => {
  console.log("data", data);
  const { user } = useAuth();
  const {
    createTodo,
    updateTodo,
    fetchInspectors,
    inspectors,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();
  const navigate = useNavigate();

  // Form state
  const [selectedInspector, setSelectedInspector] =
    useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const getInquiryData = () => {
    // In edit mode, data contains inquiry_data
    if (mode === "edit" && data?.inquiry_data) {
      return data.inquiry_data;
    }
    // In create mode, data is the inquiry itself
    return data;
  };

  const inquiryData = getInquiryData();

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
      setIsProcessing(false);
    }
  }, [open]);

  // Set initial values based on mode and data
  useEffect(() => {
    if (data) {
      const inquiryData = mode === "edit" ? data.inquiry_data : data;

      if (mode === "create") {
        // Create mode - using inquiry data
        if (inquiryData?.custom_special_requirements) {
          setDescription(inquiryData.custom_special_requirements);
        }
        if (inquiryData?.custom_preferred_inspection_date) {
          setDate(new Date(inquiryData.custom_preferred_inspection_date));
        }
        if (inquiryData?.custom_preferred_inspection_time) {
          setRequestedTime(inquiryData.custom_preferred_inspection_time);
        }
        if (inquiryData?.custom_duration) {
          setDuration(inquiryData.custom_duration);
        }
      } else {
        // Edit mode - using todo data
        if (data?.description) {
          setDescription(data.description);
        }
        if (data?.date) {
          setDate(new Date(data.date));
        }
        if (data?.custom_start_time) {
          // Extract just the time part from the datetime string
          const startTime = data.custom_start_time.split(" ")[1].slice(0, 5);
          setRequestedTime(startTime);
        }
        if (data?.priority) {
          setPriority(data.priority);
        }
        // For edit mode, we might want to pre-select the inspector
        if (data?.allocated_to) {
          // Find the inspector in the inspectors list
          const inspector = inspectors.find(
            (insp) => insp.email === data.allocated_to
          );
          if (inspector) {
            // Create a minimal InspectorAvailability object
            setSelectedInspector({
              user_id: inspector.name,
              user_name: inspector.full_name ?? data.allocated_to_name ?? "",
              email: inspector.email ?? data.allocated_to,
              date: data.date || new Date().toISOString().split("T")[0],
              availability: {
                occupied_slots: [],
                free_slots: [
                  {
                    start: data.custom_start_time
                      ? data.custom_start_time.split(" ")[1].slice(0, 5)
                      : "09:00",
                    end: data.custom_end_time
                      ? data.custom_end_time.split(" ")[1].slice(0, 5)
                      : "17:00",
                    duration_hours: data.custom_duration || 1,
                  },
                ],
                is_completely_free: true,
                total_occupied_hours: 0,
              },
            });
            // Also set the selected slot
            setSelectedSlot({
              start: data.custom_start_time
                ? data.custom_start_time.split(" ")[1].slice(0, 5)
                : "09:00",
              end: data.custom_end_time
                ? data.custom_end_time.split(" ")[1].slice(0, 5)
                : "17:00",
            });
          }
        }
        // Set duration if available
        if (data.custom_duration) {
          setDuration(data.custom_duration.toString());
        } else if (data.custom_start_time && data.custom_end_time) {
          // Calculate duration from start and end times
          const start = new Date(data.custom_start_time);
          const end = new Date(data.custom_end_time);
          const durationHours =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          setDuration(durationHours.toFixed(1));
        }
      }
    }
  }, [data, mode, inspectors]);

  // Fetch inspectors when component mounts
  useEffect(() => {
    fetchInspectors();
  }, [fetchInspectors]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setSelectedInspector(null);
    setSelectedSlot(null);

    if (selectedDate && mode === "create") {
      setTimeout(() => {
        setShowAvailabilityModal(true);
      }, 300);
    }
  };

  const handleInspectorSelect = (
    email: string,
    availabilityData: InspectorAvailability[]
  ) => {
    const inspector = availabilityData.find(
      (inspector) => inspector.email === email
    );
    if (inspector) {
      setSelectedInspector(inspector);
      if (inspector.availability.free_slots.length > 0) {
        const firstSlot = inspector.availability.free_slots[0];
        setSelectedSlot({
          start: firstSlot.start,
          end: firstSlot.end,
        });
        setRequestedTime(firstSlot.start);
        toast.success(
          `Selected ${inspector.user_name} - Time slot auto-selected`
        );
      } else {
        toast.success(`Selected ${inspector.user_name}`);
      }
    }
    setShowAvailabilityModal(false);
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setRequestedTime(slot.start);
    toast.success(`Selected time slot: ${slot.start} - ${slot.end}`);
  };

  const validateRequestedTime = () => {
    if (!requestedTime) return false;

    if (mode === "create") {
      if (!selectedSlot) return false;

      const requestedMinutes = timeToMinutes(requestedTime);
      const slotStartMinutes = timeToMinutes(selectedSlot!.start);
      const slotEndMinutes = timeToMinutes(selectedSlot!.end);
      const durationMinutes = Math.round(parseFloat(duration) * 60);

      if (
        requestedMinutes < slotStartMinutes ||
        requestedMinutes >= slotEndMinutes
      ) {
        return false;
      }

      if (requestedMinutes + durationMinutes > slotEndMinutes) {
        return false;
      }
    }

    // In edit mode, we just need to ensure the time is valid
    return true;
  };
  const calculateEndTime = () => {
    if (!requestedTime || !duration) return "";

    const startMinutes = timeToMinutes(requestedTime);
    const durationMinutes = Math.round(parseFloat(duration) * 60);
    const endMinutes = startMinutes + durationMinutes;

    const hours = Math.floor(endMinutes / 60);
    const mins = endMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const validateTimeDuration = (durationValue: string) => {
    if (mode === "edit" || !selectedSlot || !requestedTime) return;

    const durationHours = parseFloat(durationValue);
    const durationMinutes = Math.round(durationHours * 60);
    const startMinutes = timeToMinutes(requestedTime);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);

    if (startMinutes + durationMinutes > slotEndMinutes) {
      const availableHours = (slotEndMinutes - startMinutes) / 60;
      toast.error(
        `Duration exceeds available time. Max ${availableHours.toFixed(
          1
        )} hours available in this slot.`
      );
    }
  };
  const handleAssign = async () => {
    // Common validation
    if (!date) {
      toast.error("Please select an inspection date");
      return;
    }

    if (!requestedTime) {
      toast.error("Please enter the requested inspection time");
      return;
    }

    if (mode === "create") {
      if (!selectedInspector) {
        toast.error("Please select an inspector");
        return;
      }

      if (!validateRequestedTime()) {
        toast.error(
          `Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`
        );
        return;
      }

      if (!data?.name) {
        toast.error("Invalid inquiry data");
        return;
      }
    }

    setIsProcessing(true);

    try {
      const preferredDate = format(date, "yyyy-MM-dd");
      const endTime = calculateEndTime();

      // Combine date and time for DATETIME fields
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;

      if (mode === "create") {
        // Create todo and DWA
        await createTodo({
          assigned_by: user?.username || "sales_rep@eits.com",
          inquiry_id: data.name,
          inspector_email: selectedInspector!.email,
          description: description,
          priority: priority,
          preferred_date: preferredDate,
          custom_start_time: startDateTime, // Changed: Now includes date
          custom_end_time: endDateTime, // Changed: Now includes date
        });

        // Get employee name for DWA
        let employeeName = "";
        const employeeResponse = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/resource/Employee?filters=[["user_id","=","${
            selectedInspector!.email
          }"]]`
        );

        if (employeeResponse?.data?.length > 0) {
          employeeName = employeeResponse.data[0].name;
        } else {
          throw new Error(
            `Could not find employee record for ${selectedInspector!.email}`
          );
        }

        // Create DWA
        const dwaPayload = {
          employee_name: employeeName,
          date: preferredDate,
          custom_work_allocation: [
            {
              work_title: data.custom_job_type || "Site Inspection",
              work_description: data.custom_property_area,
              expected_start_date: requestedTime,
              expected_time_in_hours: parseFloat(duration),
            },
          ],
        };

        await frappeAPI.makeAuthenticatedRequest(
          "POST",
          "/api/resource/Daily Work Allocation",
          dwaPayload
        );

        toast.success("Inspector assigned successfully!");
        onClose();
        navigate("/sales?tab=assign");
      } else {
        // Edit mode - just update the todo
        await updateTodo(data.name, {
          description,
          priority,
          date: preferredDate,
          custom_start_time: startDateTime, // Changed: Now includes date
          custom_end_time: endDateTime, // Changed: Now includes date
          allocated_to: selectedInspector?.email || data.allocated_to,
        });

        toast.success("Inspection updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error during process:", error);
      toast.error(
        `Failed to ${mode === "create" ? "assign" : "update"}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-emerald-600 p-3 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Assign Inspector" : "Edit Inspection"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Customer Details */}
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900">Customer Details</h3>
            <div className="text-sm">
              {inquiryData?.lead_name ||
              inquiryData?.mobile_no ||
              inquiryData?.email ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiryData.lead_name,
                      inquiryData.mobile_no,
                      inquiryData.email,
                    ]
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
                  {inquiryData?.custom_job_type || "N/A"}
                </span>
              </div>
              <div className="break-words text-sm">
                {inquiryData?.custom_project_urgency ||
                inquiryData?.custom_budget_range ? (
                  <span className="text-gray-900">
                    {[
                      inquiryData?.custom_project_urgency,
                      inquiryData?.custom_budget_range,
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
            <h3 className="font-medium text-gray-900">Property Information</h3>
            <div className="text-sm">
              <div className="break-words">
                <span className="font-medium text-gray-600">Address:</span>
                <span className="ml-2 text-gray-900">
                  {[
                    inquiryData?.custom_building_name,
                    inquiryData?.custom_property_area,
                  ]
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
              {inquiryData?.custom_preferred_inspection_date ||
              inquiryData?.custom_preferred_inspection_time ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiryData?.custom_preferred_inspection_date
                        ? format(
                            new Date(
                              inquiryData.custom_preferred_inspection_date
                            ),
                            "dd/MM/yyyy"
                          )
                        : null,
                      inquiryData?.custom_preferred_inspection_time,
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
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <div className="text-red-700 text-sm">{assignError}</div>
            </div>
          )}
          {assignSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2">
              <div className="text-emerald-700 text-sm">
                {mode === "create"
                  ? "Inspector assigned successfully!"
                  : "Inspection updated successfully!"}
              </div>
            </div>
          )}

          {/* Step 1: Date Selection */}
          <div className="space-y-2 px-4 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Select Inspection Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm h-9" +
                    (!date && " text-muted-foreground")
                  }
                  disabled={isProcessing}
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
                    return selectedDate < today || isProcessing;
                  }}
                  classNames={{
                    day_selected:
                      "bg-emerald-600 text-white hover:bg-emerald-700 focus:bg-emerald-600",
                    day_today: "bg-blue-100 text-blue-900 font-semibold",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Step 2: Inspector Selection */}
          {date && (
            <div className="space-y-2 px-4 py-2">
              <Label className="text-gray-700 text-sm font-medium">
                {mode === "create" ? "Inspector Selected" : "Inspector"}
              </Label>
              <div className="flex items-center justify-between">
                {selectedInspector ? (
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {selectedInspector.user_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedInspector.email}
                      </div>
                    </div>
                  </div>
                ) : mode === "edit" && data?.allocated_to ? (
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-sm">
                        {inspectors.find((i) => i.email === data.allocated_to)
                          ?.full_name || data.allocated_to}
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.allocated_to}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {mode === "create"
                      ? "Waiting for inspector selection..."
                      : "No inspector assigned"}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAvailabilityModal(true)}
                  disabled={isProcessing}
                >
                  {selectedInspector || (mode === "edit" && data?.allocated_to)
                    ? "Change"
                    : "Select"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Time Slot Selection (only for create mode) */}
          {mode === "create" &&
            selectedInspector &&
            selectedInspector.availability.free_slots.length > 0 && (
              <div className="space-y-2 px-5 py-2 bg-yellow-50 ">
                <Label className="text-gray-700 text-sm font-medium">
                  Available Time Slots
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedInspector.availability.free_slots.map(
                    (slot, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedSlot?.start === slot.start &&
                          selectedSlot?.end === slot.end
                            ? "outline"
                            : "default"
                        }
                        className="justify-center h-auto py-1.5 px-2 text-xs"
                        onClick={() =>
                          handleSlotSelect({ start: slot.start, end: slot.end })
                        }
                        disabled={isProcessing}
                      >
                        {slot.start} - {slot.end}
                        {slot.duration_hours && (
                          <span className="ml-1 text-xs opacity-70">
                            ({slot.duration_hours}h)
                          </span>
                        )}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Step 4: Time and Duration Input */}
          {(mode === "create" ? selectedSlot : true) && (
            <div className="space-y-3 px-4 py-2 ">
              <Label className="text-gray-700 text-sm font-medium">
                Finalize Time & Duration
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Start Time *</Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={requestedTime}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        if (mode === "create" && !selectedSlot) return;

                        if (mode === "create") {
                          // Validate the time is within the slot
                          const newMinutes = timeToMinutes(newTime);
                          const slotStart = timeToMinutes(selectedSlot!.start);
                          const slotEnd = timeToMinutes(selectedSlot!.end);

                          if (
                            newMinutes >= slotStart &&
                            newMinutes <= slotEnd
                          ) {
                            setRequestedTime(newTime);
                          } else {
                            toast.error(
                              `Time must be between ${
                                selectedSlot!.start
                              } and ${selectedSlot!.end}`
                            );
                          }
                        } else {
                          // Edit mode - no slot restrictions
                          setRequestedTime(newTime);
                        }
                      }}
                      min={mode === "create" ? selectedSlot?.start || "" : ""}
                      max={mode === "create" ? selectedSlot?.end || "" : ""}
                      className="text-sm h-8"
                      disabled={isProcessing}
                    />
                  </div>
                  {mode === "create" && selectedSlot && (
                    <div className="text-xs text-gray-500">
                      Between {selectedSlot.start || "--:--"} -{" "}
                      {selectedSlot.end || "--:--"}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">
                    Duration (hrs) *
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={duration}
                    onChange={(e) => {
                      const newDuration = e.target.value;
                      setDuration(newDuration);
                      if (mode === "create" && selectedSlot && requestedTime) {
                        validateTimeDuration(newDuration);
                      }
                    }}
                    placeholder="1.5"
                    className="text-sm h-8"
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">End Time</Label>
                  <Input
                    type="text"
                    value={calculateEndTime()}
                    className="text-sm h-8 bg-gray-100"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Priority and Description */}
          <div className="grid grid-cols-1 gap-3 px-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as PriorityLevel)}
                disabled={isProcessing}
              >
                <SelectTrigger className="w-full h-8 bg-white border border-gray-300 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full bg-white border border-gray-300">
                  <SelectItem value="Low">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="High">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      High
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Requirements</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Special requirements..."
                rows={2}
                className="text-sm border border-gray-300 rounded-md resize-none"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 text-sm h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={
                isProcessing ||
                !date ||
                !requestedTime ||
                (mode === "create" &&
                  (!selectedInspector || !validateRequestedTime()))
              }
              className="px-4 text-sm h-8 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {mode === "create" ? "Assigning..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Assign Inspector"
              ) : (
                "Update Inspection"
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

export default InspectionDialog;
