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

// Define the AvailabilitySlot type
type AvailabilitySlot = {
  start: string;
  end: string;
  duration_hours?: number;
};

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

interface InspectorDetails {
  name: string;
  email: string;
  full_name: string;
}

const InspectionDialog: React.FC<InspectionDialogProps> = ({
  open,
  onClose,
  data,
  mode,
}) => {
  const { user } = useAuth();
  const {
    createTodo,
    updateTodo,
    // fetchInspectors,
    // inspectors,
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
  const [originalInspectorEmail, setOriginalInspectorEmail] = useState("");
  const [originalStartTime, setOriginalStartTime] = useState(""); // Add this state
  const [calendarOpen, setCalendarOpen] = useState(false);
  // const [inspectorAvailabilityData, setInspectorAvailabilityData] = useState<InspectorAvailability[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentInspectorDetails, setCurrentInspectorDetails] =
    useState<InspectorDetails | null>(null);
  const [isLoadingInspectorDetails, setIsLoadingInspectorDetails] =
    useState(false);

  const getInquiryData = () => {
    if (mode === "edit" && data?.inquiry_data) {
      return data.inquiry_data;
    }
    return data;
  };

  const inquiryData = getInquiryData();

  // Fetch inspector availability for edit mode
  const fetchInspectorAvailability = async (
    inspectorEmail: string,
    dateStr: string
  ) => {
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.inspector_availability.get_employee_availability?date=${dateStr}`
      );

      if (response.message && response.message.status === "success") {
        const availabilityData = response.message.data;
        // setInspectorAvailabilityData(availabilityData);

        // Find the specific inspector's availability
        const inspectorData = availabilityData.find(
          (insp: InspectorAvailability) => insp.email === inspectorEmail
        );
        if (inspectorData) {
          setSelectedInspector(inspectorData);
        }
      }
    } catch (error) {
      console.error("Error fetching inspector availability:", error);
    }
  };

  const findEmployeeByEmail = async (email: string): Promise<string> => {
    try {
      const employeeResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Employee?filters=[["user_id","=","${email}"]]`
      );

      if (employeeResponse?.data?.length > 0) {
        return employeeResponse.data[0].name;
      } else {
        throw new Error(`Could not find employee record for ${email}`);
      }
    } catch (error) {
      console.error("Error finding employee:", error);
      throw error;
    }
  };

  const deleteExistingDWA = async (
    inspectorEmail: string,
    todoDate: string, // Format: "YYYY-MM-DD"
    startTime: string // Format: "HH:mm"
  ) => {
    try {
      console.log(
        `Attempting to delete DWA for ${inspectorEmail} on ${todoDate} at ${startTime}`
      );

      if (!inspectorEmail || !todoDate || !startTime) {
        throw new Error("Missing required parameters for DWA deletion");
      }

      const employeeName = await findEmployeeByEmail(inspectorEmail);
      if (!employeeName) {
        throw new Error("Employee not found for the given email");
      }
      console.log(`Found employee name: ${employeeName}`);

      // Convert date to DD-MM-YYYY format
      const [year, month, day] = todoDate.split("-");
      const formattedDate = `${day}-${month}-${year}`;

      // Format time as HH:mm:ss
      const formattedTime = startTime.includes(":")
        ? `${startTime}:00`
        : `${startTime.slice(0, 2)}:${startTime.slice(2)}:00`;

      // Build filters
      const filters = [
        ["custom_user", "=", inspectorEmail],
        ["date", "=", formattedDate],
        ["Work", "expected_start_date", "=", formattedTime],
      ];

      // Make GET request to find existing DWA
      const dwaResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Daily Work Allocation?filters=${encodeURIComponent(
          JSON.stringify(filters)
        )}`
      );

      console.log("DWA search response:", dwaResponse);

      // Check response structure and extract DWA name
      if (dwaResponse?.data?.length > 0) {
        const dwaName = dwaResponse.data[0].name;
        console.log(`Found existing DWA: ${dwaName}`);

        // Delete the found DWA
        await frappeAPI.makeAuthenticatedRequest(
          "DELETE",
          `/api/resource/Daily Work Allocation/${dwaName}`
        );

        console.log(`Successfully deleted DWA: ${dwaName}`);
        return true;
      }

      console.log("No existing DWA found to delete");
      return false;
    } catch (error) {
      console.error("Error in deleteExistingDWA:", error);
      throw error;
    }
  };

  const createNewDWA = async (
    inspectorEmail: string,
    todoDate: string,
    startTime: string,
    durationHours: number,
    jobType: string,
    propertyArea: string
  ) => {
    try {
      const employeeName = await findEmployeeByEmail(inspectorEmail);

      const dwaPayload = {
        employee_name: employeeName,
        date: todoDate,
        custom_work_allocation: [
          {
            work_title: jobType || "Site Inspection",
            work_description: propertyArea || "Property Inspection",
            expected_start_date: startTime,
            expected_time_in_hours: durationHours,
          },
        ],
      };

      console.log("Creating new DWA with payload:", dwaPayload);

      await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/Daily Work Allocation",
        dwaPayload
      );

      console.log("Successfully created new DWA");
    } catch (error) {
      console.error("Error creating new DWA:", error);
      throw error;
    }
  };

  const getInspectorName = async (email: string): Promise<InspectorDetails> => {
    try {
      const userDetailsResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/User/${email}`
      );

      const userDetails = userDetailsResponse.data;
      console.log(`Fetched details for user ${email}:`, userDetails);

      return {
        name: userDetails.name || userDetails.email,
        email: userDetails.email,
        full_name:
          userDetails.full_name || userDetails.name || userDetails.email,
      };
    } catch (error) {
      console.error("Error fetching inspector details:", error);
      return {
        name: email,
        email,
        full_name: email,
      };
    }
  };

  // Function to load inspector details for edit mode
  const loadInspectorDetails = async (inspectorEmail: string) => {
    if (!inspectorEmail) return;

    setIsLoadingInspectorDetails(true);
    try {
      const details = await getInspectorName(inspectorEmail);
      setCurrentInspectorDetails(details);
    } catch (error) {
      console.error("Failed to load inspector details:", error);
      setCurrentInspectorDetails({
        name: inspectorEmail,
        email: inspectorEmail,
        full_name: inspectorEmail,
      });
    } finally {
      setIsLoadingInspectorDetails(false);
    }
  };

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
      setOriginalInspectorEmail("");
      setOriginalStartTime(""); // Reset original start time
      setCalendarOpen(false);
      setCurrentInspectorDetails(null);
      setIsLoadingInspectorDetails(false);
      // setInspectorAvailabilityData([]);
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      const inquiryData = mode === "edit" ? data.inquiry_data : data;

      if (mode === "create") {
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
        if (data?.description) {
          setDescription(data.description);
        }
        if (data?.date) {
          const selectedDate = new Date(data.date);
          setDate(selectedDate);

          // Fetch availability for edit mode
          if (data.allocated_to) {
            fetchInspectorAvailability(data.allocated_to, data.date);
          }
        }
        if (data?.custom_start_time) {
          const startTime = data.custom_start_time.split(" ")[1].slice(0, 5);
          setRequestedTime(startTime);
          setOriginalStartTime(startTime); // Store the original start time
        }
        if (data?.priority) {
          setPriority(data.priority);
        }

        if (data?.allocated_to) {
          setOriginalInspectorEmail(data.allocated_to);
          console.log("Setting original inspector email:", data.allocated_to);

          // Load inspector details for edit mode
          loadInspectorDetails(data.allocated_to);

          // Set the selected slot for the current allocation
          if (data.custom_start_time && data.custom_end_time) {
            setSelectedSlot({
              start: data.custom_start_time.split(" ")[1].slice(0, 5),
              end: data.custom_end_time.split(" ")[1].slice(0, 5),
            });
          }
        }

        if (data.custom_duration) {
          setDuration(data.custom_duration.toString());
        } else if (data.custom_start_time && data.custom_end_time) {
          const start = new Date(data.custom_start_time);
          const end = new Date(data.custom_end_time);
          const durationHours =
            (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          setDuration(durationHours.toFixed(1));
        }
      }
    }
  }, [data, mode]);

  // useEffect(() => {
  //   fetchInspectors();
  // }, [fetchInspectors]);

  const validateRequiredFields = (inquiryData: any) => {
  const requiredFields = [
    'custom_property_area', // Property Address
    'lead_name', // Name
    'mobile_no', // Phone Number
    'custom_job_type', // Job Type
    'custom_project_urgency' // Urgency
  ];

  const missingFields = requiredFields.filter(field => !inquiryData?.[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setSelectedInspector(null);
    setSelectedSlot(null);

    // Close the calendar popover first
    setCalendarOpen(false);

    if (selectedDate && mode === "create") {
      // Use a longer delay to ensure popover is fully closed
      setTimeout(() => {
        setShowAvailabilityModal(true);
      }, 500);
    }

    // For edit mode, fetch availability when date changes
    if (selectedDate && mode === "edit" && data?.allocated_to) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      fetchInspectorAvailability(data.allocated_to, dateStr);
    }
  };

  const handleInspectorSelect = (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: AvailabilitySlot[]
  ) => {
    const inspector = availabilityData.find(
      (inspector) => inspector.email === email
    );
    if (inspector) {
      // Create a new inspector object with the modified slots
      const modifiedInspector = {
        ...inspector,
        availability: {
          ...inspector.availability,
          free_slots: modifiedSlots,
        },
      };
      setSelectedInspector(modifiedInspector);

      if (modifiedSlots.length > 0) {
        const firstSlot = modifiedSlots[0];
        setSelectedSlot({
          start: firstSlot.start,
          end: firstSlot.end,
        });
        setRequestedTime(firstSlot.start);
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
  // First validate required fields in create mode
  if (mode === "create") {
    const validation = validateRequiredFields(inquiryData);
    if (!validation.isValid) {
      const missingFieldNames = validation.missingFields.map(field => {
        switch(field) {
          case 'custom_property_area': return 'Property Address';
          case 'lead_name': return 'Customer Name';
          case 'mobile_no': return 'Phone Number';
          case 'custom_job_type': return 'Job Type';
          case 'custom_project_urgency': return 'Urgency';
          default: return field;
        }
      }).join(', ');
      
      toast.error(`Please complete the following information: ${missingFieldNames}`);
      return;
    }
  }

  // Proceed with existing checks
  if (mode === "create") {
    setShowConfirmation(true);
  } else {
    await proceedWithAssignment();
  }
};

  const proceedWithAssignment = async () => {
    setShowConfirmation(false);
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
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;

      console.log("Original Inspector:", originalInspectorEmail);
      const currentInspectorEmail =
        selectedInspector?.email || data.allocated_to;
      console.log("Current Inspector:", currentInspectorEmail);
      const inspectorChanged =
        originalInspectorEmail &&
        originalInspectorEmail !== currentInspectorEmail;
      console.log("Inspector Changed:", inspectorChanged);

      if (mode === "create") {
        await createTodo({
          assigned_by: user?.username || "sales_rep@eits.com",
          inquiry_id: data.name,
          inspector_email: selectedInspector!.email,
          description: description,
          priority: priority,
          preferred_date: preferredDate,
          custom_start_time: startDateTime,
          custom_end_time: endDateTime,
        });

        await createNewDWA(
          selectedInspector!.email,
          preferredDate,
          requestedTime,
          parseFloat(duration),
          data.custom_job_type || "Site Inspection",
          data.custom_property_area || "Property Inspection"
        );

        toast.success("Inspector assigned successfully!");
        onClose();
        navigate("/sales?tab=assign");
      } else {
        console.log("Updating todo with ID:", data.name);
        console.log("Original Start Time:", originalStartTime);
        console.log("New Start Time:", requestedTime);

        // For the original inspector (when changed)
        if (inspectorChanged) {
          console.log(
            `Inspector changed from ${originalInspectorEmail} to ${currentInspectorEmail}`
          );
          await deleteExistingDWA(
            originalInspectorEmail,
            preferredDate,
            originalStartTime // Use original start time, not new one
          );
        }

        // For the current inspector - delete old allocation if time changed or same inspector
        if (
          currentInspectorEmail &&
          (!inspectorChanged || originalStartTime !== requestedTime)
        ) {
          await deleteExistingDWA(
            currentInspectorEmail,
            preferredDate,
            originalStartTime // Use original start time, not new one
          );
        }

        const updateData = {
          description,
          priority,
          date: preferredDate,
          custom_start_time: startDateTime,
          custom_end_time: endDateTime,
          allocated_to: currentInspectorEmail,
        };

        await updateTodo(data.name, updateData);

        if (currentInspectorEmail) {
          await createNewDWA(
            currentInspectorEmail,
            preferredDate,
            requestedTime, // Use new start time for creating new DWA
            parseFloat(duration),
            inquiryData?.custom_job_type || "Site Inspection",
            inquiryData?.custom_property_area || "Property Inspection"
          );
        }

        onClose();
      }
    } catch (error) {
      console.error("Error during process:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[95vh] overflow-y-auto">
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

        <div className="p-4 space-y-3">
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

          {mode === "edit" &&
            data?.custom_start_time &&
            data?.custom_end_time && (
              <div className="bg-gray-50 px-4 py-2 rounded-lg">
                <Label className="text-black text-md font-medium">
                  Current Allocation
                </Label>
                <div className="inline-flex items-center px-1 py-1.5 rounded-md text-sm font-medium">
                  {data.custom_start_time.split(" ")[1].slice(0, 5)} -{" "}
                  {data.custom_end_time.split(" ")[1].slice(0, 5)}
                  <span className="ml-2 text-sm">
                    {isLoadingInspectorDetails ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      `(${
                        currentInspectorDetails?.full_name ||
                        originalInspectorEmail
                      })`
                    )}
                  </span>
                </div>
              </div>
            )}
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

          <div className="space-y-2 px-4 rounded-lg">
            <Label className="text-gray-700 text-sm font-medium">
              Select Inspection Date <span className="text-red-500">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm h-9" +
                    (!date && " text-muted-foreground")
                  }
                  disabled={isProcessing}
                  onClick={() => setCalendarOpen(true)}
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
                      {/* <div className="font-medium text-sm">
                        {inspectors.find((i) => i.email === data.allocated_to)
                          ?.full_name || data.allocated_to}
                      </div> */}
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

          {/* Show current allocated slot in edit mode */}

          {/* Show available slots */}
          {selectedInspector &&
            selectedInspector.availability.free_slots.length > 0 && (
              <div className="space-y-2 px-5 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label className="text-gray-700 text-sm font-medium">
                  {mode === "edit"
                    ? "Available Time Slots (for rescheduling)"
                    : "Available Time Slots"}
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
                            ({slot.duration_hours.toFixed(1)}h)
                          </span>
                        )}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Time and Duration Settings */}
          {(mode === "create" ? selectedSlot : true) && (
            <div className="space-y-3 px-4 py-2 ">
              <Label className="text-gray-700 text-sm font-medium">
                {mode === "edit"
                  ? "Update Time & Duration"
                  : "Finalize Time & Duration"}
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

      {showAvailabilityModal && (
        <UserAvailability
          date={date || new Date()}
          onClose={() => setShowAvailabilityModal(false)}
          onSelectInspector={handleInspectorSelect}
        />
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Assignment</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 text-gray-700">
              After assignment, you won't be able to edit the customer
              information.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={proceedWithAssignment}
                disabled={isProcessing}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Confirm Assignment"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDialog;
