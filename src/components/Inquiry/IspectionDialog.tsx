/* eslint-disable @typescript-eslint/no-explicit-any */
import { format } from "date-fns";
import { CalendarIcon, Loader2, UserPen, UserPlus, X } from "lucide-react";
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
import type { Lead } from "../../context/LeadContext";
import { RestrictedTimeClock } from "./ResticritedtimeSlot";

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
    // error: assignError,
    // success: assignSuccess,
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
  const [originalStartTime, setOriginalStartTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentInspectorDetails, setCurrentInspectorDetails] =
    useState<InspectorDetails | null>(null);
  const [isLoadingInspectorDetails, setIsLoadingInspectorDetails] =
    useState(false);
  // New state for available inspectors on date change
  const [availableInspectors, setAvailableInspectors] = useState<InspectorAvailability[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  console.log("inquiry", data);

  // Helper function to check if selected date is today
  const isSelectedDateToday = () => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helper function to get current time
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Helper function to filter future slots based on current time
  const filterFutureSlots = (slots: AvailabilitySlot[]): AvailabilitySlot[] => {
    // If it's not today, return all slots
    if (!isSelectedDateToday()) {
      return slots;
    }

    const currentTime = getCurrentTime();
    const currentMinutes = timeToMinutes(currentTime);

    return slots.reduce<AvailabilitySlot[]>((filteredSlots, slot) => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      if (slotEnd <= currentMinutes) {
        // Slot has already ended - exclude it
        return filteredSlots;
      }

      if (slotStart > currentMinutes) {
        // Slot is in the future - include as-is
        filteredSlots.push(slot);
      } else {
        // Current time is within this slot - create a modified slot from current time to end time
        const minutesToEnd = slotEnd - currentMinutes;
        filteredSlots.push({
          start: currentTime,
          end: slot.end,
          duration_hours: minutesToEnd / 60,
        });
      }

      return filteredSlots;
    }, []);
  };

  const getInquiryData = () => {
    if (mode === "edit" && data?.inquiry_data) {
      return data.inquiry_data;
    }
    return data;
  };

  const inquiryData = getInquiryData();

  const getMaxAllowedDuration = (): number => {
    if (!requestedTime) return 8; // Default max duration

    if (selectedInspector) {
      const timeMinutes = timeToMinutes(requestedTime);
      let maxDuration = 8; // Default fallback

      // Find the slot that contains the requested time
      const containingSlot = selectedInspector.availability.free_slots.find(
        (slot) => {
          const slotStart = timeToMinutes(slot.start);
          const slotEnd = timeToMinutes(slot.end);
          return timeMinutes >= slotStart && timeMinutes < slotEnd;
        }
      );

      if (containingSlot) {
        const slotEnd = timeToMinutes(containingSlot.end);
        const availableMinutes = slotEnd - timeMinutes;
        maxDuration = availableMinutes / 60;
      }

      return Math.max(0.5, maxDuration); // Minimum 0.5 hours
    }

    if (mode === "create" && selectedSlot) {
      const timeMinutes = timeToMinutes(requestedTime);
      const slotEnd = timeToMinutes(selectedSlot.end);
      const availableMinutes = slotEnd - timeMinutes;
      return Math.max(0.5, availableMinutes / 60);
    }

    return 8; // Default max duration
  };

  // New function to fetch all inspectors' availability for a date
  const fetchAllInspectorsAvailability = async (dateStr: string) => {
    setIsLoadingAvailability(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.inspector_availability.get_employee_availability?date=${dateStr}`
      );

      if (response.message && response.message.status === "success") {
        const availabilityData = response.message.data;
        
        // Filter and process inspectors with available slots
        const inspectorsWithSlots = availabilityData
          .filter((inspector: InspectorAvailability) => 
            inspector.availability.free_slots && inspector.availability.free_slots.length > 0
          )
          .map((inspector: InspectorAvailability) => {
            const isToday = isSelectedDateToday();
            const slotsToUse = isToday
              ? filterFutureSlots(inspector.availability.free_slots)
              : inspector.availability.free_slots;

            return {
              ...inspector,
              availability: {
                ...inspector.availability,
                free_slots: slotsToUse,
              },
            };
          })
          .filter((inspector: InspectorAvailability) => 
            inspector.availability.free_slots.length > 0
          );

        setAvailableInspectors(inspectorsWithSlots);

        // Auto-select first inspector with available slots in create mode
        if (mode === "create" && inspectorsWithSlots.length > 0) {
          const firstInspector = inspectorsWithSlots[0];
          setSelectedInspector(firstInspector);
          
          // Auto-select first slot and set time
          if (firstInspector.availability.free_slots.length > 0) {
            const firstSlot = firstInspector.availability.free_slots[0];
            setSelectedSlot({
              start: firstSlot.start,
              end: firstSlot.end,
            });
            setRequestedTime(firstSlot.start);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching inspectors availability:", error);
      setAvailableInspectors([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

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

      // Find the specific inspector's availability
      const inspectorData = availabilityData.find(
        (insp: InspectorAvailability) => insp.email === inspectorEmail
      );
      if (inspectorData) {
        // Only apply time filtering if the selected date is today
        const selectedDate = new Date(dateStr);
        const today = new Date();
        const isToday =
          selectedDate.getDate() === today.getDate() &&
          selectedDate.getMonth() === today.getMonth() &&
          selectedDate.getFullYear() === today.getFullYear();

        const slotsToUse = isToday
          ? filterFutureSlots(inspectorData.availability.free_slots)
          : inspectorData.availability.free_slots;

        // Create modified inspector data with appropriate slots
        const modifiedInspector = {
          ...inspectorData,
          availability: {
            ...inspectorData.availability,
            free_slots: slotsToUse,
          },
        };

        setSelectedInspector(modifiedInspector);

        // Auto-select first slot and set time in edit mode
        if (mode === "edit" && slotsToUse.length > 0) {
          const firstSlot = slotsToUse[0];
          setSelectedSlot({
            start: firstSlot.start,
            end: firstSlot.end,
          });
          setRequestedTime(firstSlot.start);
        }
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
    lead: Lead, // Pass the entire lead object
    propertyArea: string
  ) => {
    try {
      const employeeName = await findEmployeeByEmail(inspectorEmail);
      const jobTypes = getJobTypes(lead); // Use the helper function

      const dwaPayload = {
        employee_name: employeeName,
        date: todoDate,
        custom_work_allocation: [
          {
            work_title: jobTypes, // Use the comma-separated job types
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
      setOriginalStartTime("");
      setCalendarOpen(false);
      setCurrentInspectorDetails(null);
      setIsLoadingInspectorDetails(false);
      setAvailableInspectors([]);
      setIsLoadingAvailability(false);
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
        }
        if (data?.custom_start_time) {
          const startTime = data.custom_start_time.split(" ")[1].slice(0, 5);
          setRequestedTime(startTime);
          setOriginalStartTime(startTime);
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

  const validateRequiredFields = (inquiryData: any) => {
    const hasJobType =
      (inquiryData?.custom_jobtype && inquiryData.custom_jobtype.length > 0) ||
      inquiryData?.custom_job_type;

    const requiredFields = [
      "custom_property_area", // Property Address
      "lead_name", // Name
      "mobile_no", // Phone Number
      "custom_project_urgency", // Urgency
    ];

    const missingFields = requiredFields.filter(
      (field) => !inquiryData?.[field]
    );
    if (!hasJobType) missingFields.push("Job Type");

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  const getJobTypes = (lead: Lead): string => {
    if (lead.custom_jobtype && lead.custom_jobtype.length > 0) {
      // Extract job_type from each item and join with commas
      return lead.custom_jobtype.map((job) => job.job_type).join(", ");
    }
    return lead.custom_job_type || "Site Inspection"; // Fallback to custom_job_type or default
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setSelectedInspector(null);
    setSelectedSlot(null);
    setRequestedTime("");
    setAvailableInspectors([]);

    // Close the calendar popover first
    setCalendarOpen(false);

    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      if (mode === "create") {
        // Fetch all inspectors' availability for create mode
        fetchAllInspectorsAvailability(dateStr);
      } else if (mode === "edit" && data?.allocated_to) {
        // Fetch specific inspector's availability for edit mode
        fetchInspectorAvailability(data.allocated_to, dateStr);
      }
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
      // Only apply time filtering if the selected date is today
      const isToday = isSelectedDateToday();
      const slotsToUse = isToday
        ? filterFutureSlots(modifiedSlots)
        : modifiedSlots;

      // Create a new inspector object with the appropriate slots
      const modifiedInspector = {
        ...inspector,
        availability: {
          ...inspector.availability,
          free_slots: slotsToUse,
        },
      };
      setSelectedInspector(modifiedInspector);

      if (slotsToUse.length > 0) {
        const firstSlot = slotsToUse[0];
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
  };

  // Update the validateRequestedTime function
  const validateRequestedTime = () => {
    if (!requestedTime) return false;

    if (mode === "create") {
      if (!selectedSlot) return false;

      const requestedMinutes = timeToMinutes(requestedTime);
      const slotStartMinutes = timeToMinutes(selectedSlot!.start);
      const slotEndMinutes = timeToMinutes(selectedSlot!.end);
      const durationMinutes = Math.round(parseFloat(duration) * 60);

      // Check if requested time is within the selected slot
      if (
        requestedMinutes < slotStartMinutes ||
        requestedMinutes >= slotEndMinutes
      ) {
        return false;
      }

      // Check if end time exceeds the selected slot's end time
      if (requestedMinutes + durationMinutes > slotEndMinutes) {
        return false;
      }
    }

    return true;
  };

  const validateTimeAgainstSlot = (
    time: string,
    durationValue: string,
    showToast: boolean = true
  ): boolean => {
    // For both create and edit modes, if we have selectedInspector, validate against their slots
    if (selectedInspector) {
      const timeMinutes = timeToMinutes(time);
      const durationMinutes = Math.round(parseFloat(durationValue) * 60);
      const endTimeMinutes = timeMinutes + durationMinutes;

      // Check if the time falls within any available slot
      const isWithinAvailableSlot =
        selectedInspector.availability.free_slots.some((slot) => {
          const slotStart = timeToMinutes(slot.start);
          const slotEnd = timeToMinutes(slot.end);

          return timeMinutes >= slotStart && endTimeMinutes <= slotEnd;
        });

      if (!isWithinAvailableSlot && showToast) {
        toast.error("Selected time must be within inspector's available slots");
      }

      return isWithinAvailableSlot;
    }

    // For create mode with selectedSlot (fallback)
    if (mode === "create" && selectedSlot) {
      const timeMinutes = timeToMinutes(time);
      const slotStart = timeToMinutes(selectedSlot.start);
      const slotEnd = timeToMinutes(selectedSlot.end);
      const durationMinutes = Math.round(parseFloat(durationValue) * 60);
      const endTimeMinutes = timeMinutes + durationMinutes;

      // Check if time is within slot boundaries
      if (timeMinutes < slotStart || timeMinutes >= slotEnd) {
        if (showToast) {
          toast.error(
            `Time must be between ${selectedSlot.start} and ${selectedSlot.end}`
          );
        }
        return false;
      }

      // Check if end time exceeds slot end time
      if (endTimeMinutes > slotEnd) {
        if (showToast) {
          toast.error(
            `End time (${Math.floor(endTimeMinutes / 60)
              .toString()
              .padStart(2, "0")}:${(endTimeMinutes % 60)
              .toString()
              .padStart(2, "0")}) exceeds the selected slot's end time (${
              selectedSlot.end
            })`
          );
        }
        return false;
      }

      return true;
    }

    return true;
  };

  const calculateEndTime = () => {
    if (!requestedTime || !duration) return null;

    const startMinutes = timeToMinutes(requestedTime);
    const durationMinutes = Math.round(parseFloat(duration) * 60);
    const endMinutes = startMinutes + durationMinutes;

    // Check if end time is valid
    if (endMinutes > 24 * 60) return null; // Beyond midnight

    const hours = Math.floor(endMinutes / 60);
    const mins = endMinutes % 60;

    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Get time constraints for RestrictedTimeClock
  const getTimeConstraints = () => {
    if (mode === "create" && selectedSlot) {
      return {
        minTime: selectedSlot.start,
        maxTime: selectedSlot.end,
      };
    } else if (mode === "edit") {
      if (isSelectedDateToday()) {
        return {
          minTime: getCurrentTime(),
          maxTime: "18:00", // 6 PM
        };
      } else {
        return {
          minTime: "09:00", // 9 AM
          maxTime: "18:00", // 6 PM
        };
      }
    }
    return {
      minTime: "09:00",
      maxTime: "18:00",
    };
  };

  const handleTimeChange = (newTime: string) => {
    if (mode === "create") {
      if (!selectedSlot) return;

      // Validate the new time against the selected slot (without showing toast)
      if (!validateTimeAgainstSlot(newTime, duration, false)) {
        return;
      }

      setRequestedTime(newTime);

      // Adjust duration if current duration exceeds the new time limit
      const maxDuration = getMaxAllowedDuration();
      if (parseFloat(duration) > maxDuration) {
        setDuration(maxDuration.toFixed(1));
      }
    } else {
      // In edit mode, validate against current time if it's today
      if (isSelectedDateToday()) {
        const currentTime = getCurrentTime();
        const currentMinutes = timeToMinutes(currentTime);
        const newMinutes = timeToMinutes(newTime);

        if (newMinutes < currentMinutes) {
          toast.error(
            `Time cannot be in the past. Current time is ${currentTime}`
          );
          return;
        }
      }

      // Add validation for edit mode against available slots (without showing toast initially)
      if (
        selectedInspector &&
        !validateTimeAgainstSlot(newTime, duration, false)
      ) {
        return;
      }

      setRequestedTime(newTime);

      // Adjust duration if current duration exceeds the new time limit
      const maxDuration = getMaxAllowedDuration();
      if (parseFloat(duration) > maxDuration) {
        setDuration(maxDuration.toFixed(1));
      }
    }
  };

  const checkAssignmentConflict = async (
    inspectorEmail: string,
    startDateTime: string,
    endDateTime: string,
    excludeTodoId?: string
  ): Promise<boolean> => {
    try {
      // Get all todos for the inspector on this date
      const filters = [
        ["allocated_to", "=", inspectorEmail],
        ["date", "=", format(date!, "yyyy-MM-dd")],
      ];

      // Exclude current todo in edit mode
      if (excludeTodoId) {
        filters.push(["name", "!=", excludeTodoId]);
      }

      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/ToDo?filters=${encodeURIComponent(
          JSON.stringify(filters)
        )}`
      );

      if (response?.data?.length > 0) {
        const requestedStart = new Date(startDateTime);
        const requestedEnd = new Date(endDateTime);

        for (const todo of response.data) {
          if (todo.custom_start_time && todo.custom_end_time) {
            const existingStart = new Date(todo.custom_start_time);
            const existingEnd = new Date(todo.custom_end_time);

            // Check for time overlap
            if (
              (requestedStart >= existingStart &&
                requestedStart < existingEnd) ||
              (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
              (requestedStart <= existingStart && requestedEnd >= existingEnd)
            ) {
              const startTime = existingStart.toTimeString().slice(0, 5);
              const endTime = existingEnd.toTimeString().slice(0, 5);
              toast.error(
                `Time slot ${startTime} - ${endTime} is already assigned to this inspector`
              );
              return true; // Conflict found
            }
          }
        }
      }

      return false; // No conflict
    } catch (error) {
      console.error("Error checking assignment conflict:", error);
      toast.error("Failed to check existing assignments");
      return true; // Assume conflict to be safe
    }
  };

  const handleAssign = async () => {
    // First validate required fields in create mode
    if (mode === "create") {
      const validation = validateRequiredFields(inquiryData);
      if (!validation.isValid) {
        const missingFieldNames = validation.missingFields
          .map((field) => {
            switch (field) {
              case "custom_property_area":
                return "Property Address";
              case "lead_name":
                return "Customer Name";
              case "mobile_no":
                return "Phone Number";
              case "custom_job_type":
                return "Job Type";
              case "custom_project_urgency":
                return "Urgency";
              default:
                return field;
            }
          })
          .join(", ");

        toast.error(`Please complete the information: ${missingFieldNames}`);
        return;
      }
    }

    // Check if time-related fields have been modified in edit mode
    const timeFieldsModified =
      mode === "edit"
        ? requestedTime !== originalStartTime ||
          (date && format(date, "yyyy-MM-dd") !== data.date) ||
          selectedInspector?.email !== originalInspectorEmail
        : true; // Always validate in create mode

    // Only validate time against slot if time fields were actually modified
    if (timeFieldsModified && requestedTime && duration) {
      if (!validateTimeAgainstSlot(requestedTime, duration, true)) {
        return; // Stop if validation fails
      }
    }

    if (mode === "create") {
      if (!selectedInspector) {
        toast.error("Please select an inspector");
        return;
      }

      if (!validateRequestedTime()) {
        // Show specific error message based on the issue
        const requestedMinutes = timeToMinutes(requestedTime);
        const slotStart = timeToMinutes(selectedSlot!.start);
        const slotEnd = timeToMinutes(selectedSlot!.end);
        const durationMinutes = Math.round(parseFloat(duration) * 60);

        if (requestedMinutes < slotStart || requestedMinutes >= slotEnd) {
          toast.error(
            `Requested time must be within the selected slot (${
              selectedSlot!.start
            } - ${selectedSlot!.end})`
          );
        } else if (requestedMinutes + durationMinutes > slotEnd) {
          toast.error(
            `End time exceeds the selected slot's end time (${
              selectedSlot!.end
            }). Reduce duration or choose a different time.`
          );
        }
        return;
      }

      if (!data?.name) {
        toast.error("Invalid inquiry data");
        return;
      }
    }

    // Check for assignment conflicts before proceeding - only if time fields were modified
    if (timeFieldsModified) {
      if (!date || !requestedTime) {
        toast.error("Please select date and time");
        return;
      }

      const preferredDate = format(date, "yyyy-MM-dd");
      const endTime = calculateEndTime();
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;

      const currentInspectorEmail =
        selectedInspector?.email || data.allocated_to;

      if (currentInspectorEmail) {
        const hasConflict = await checkAssignmentConflict(
          currentInspectorEmail,
          startDateTime,
          endDateTime,
          mode === "edit" ? data.name : undefined
        );

        if (hasConflict) {
          return; // Stop execution if conflict is found
        }
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

      const currentInspectorEmail =
        selectedInspector?.email || data.allocated_to;
      const inspectorChanged =
        originalInspectorEmail &&
        originalInspectorEmail !== currentInspectorEmail;

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
          inquiryData,
          inquiryData.custom_property_area || "Property Inspection"
        );

        toast.success("Inspector assigned successfully!");
        onClose();
        navigate("/sales?tab=assign");
      } else {
        // For the original inspector (when changed)
        if (inspectorChanged) {
          console.log(
            `Inspector changed from ${originalInspectorEmail} to ${currentInspectorEmail}`
          );
          await deleteExistingDWA(
            originalInspectorEmail,
            preferredDate,
            originalStartTime
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
            originalStartTime
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
            requestedTime,
            parseFloat(duration),
            inquiryData?.custom_job_type || "Site Inspection",
            inquiryData?.custom_property_area || "Property Inspection"
          );
        }
        toast.success("Inspection updated successfully!");

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 py-20">
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
                      inquiryData.email_id,
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
                <span className="ml-2 text-gray-900">
                  {getJobTypes(inquiryData)}
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
                    inquiryData?.custom_property_category,
                    inquiryData?.custom_property_type,
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
              <div className="flex items-center justify-between">
                {selectedInspector ? (
                  (console.log("inspectordetails", selectedInspector),
                  (
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
                  ))
                ) : mode === "edit" && data?.allocated_to ? (
                  <div className="flex items-center gap-2 bg-gray-50">
                    <div>
                      <div className="text-md text-gray-900 font-medium">
                        Update Inspector
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-md font-medium text-black">
                    {mode === "create"
                      ? isLoadingAvailability
                        ? "Loading inspectors..."
                        : availableInspectors.length > 0
                        ? "Inspector Auto-Selected"
                        : "Select Inspector"
                      : "No inspector assigned"}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAvailabilityModal(true)}
                  disabled={isProcessing || (mode === "create" && isLoadingAvailability)}
                >
                  {selectedInspector ||
                  (mode === "edit" && data?.allocated_to) ? (
                    <UserPen className="w-4 h-4 text-black" />
                  ) : (
                    <UserPlus className="w-3 h-3 text-black" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Show loading state for availability */}
          {date && isLoadingAvailability && mode === "create" && (
            <div className="space-y-2 px-5 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <Label className="text-blue-700 text-sm font-medium">
                  Loading available time slots...
                </Label>
              </div>
            </div>
          )}

          {/* Show available slots with time filtering */}
          {selectedInspector &&
            (() => {
              // Only apply time filtering if the selected date is today
              const isToday = isSelectedDateToday();
              const filteredSlots = isToday
                ? filterFutureSlots(selectedInspector.availability.free_slots)
                : selectedInspector.availability.free_slots;

              return filteredSlots.length > 0 ? (
                <div className="space-y-2 px-5 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Label className="text-gray-700 text-sm font-medium">
                    {mode === "edit"
                      ? "Available Time Slots"
                      : "Available Time Slots"}
                    {isToday && (
                      <span className="text-xs text-gray-600 font-normal ml-1">
                        {/* (from {getCurrentTime()} onwards) */}
                      </span>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredSlots.map((slot, index) => (
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
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 px-5 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Label className="text-gray-700 text-sm font-medium">
                    Available Time Slots
                  </Label>
                  <p className="text-xs text-gray-500">
                    {isToday
                      ? "No available slots remaining for today"
                      : "No available slots for this date"}
                  </p>
                </div>
              );
            })()}

          {/* Show no inspectors available message in create mode */}
          {/* {mode === "create" && date && !isLoadingAvailability && 
           !selectedInspector && availableInspectors.length === 0 && (
            <div className="space-y-2 px-5 py-2 bg-red-50 border border-red-200 rounded-lg">
              <Label className="text-red-700 text-sm font-medium">
                No Inspectors Available
              </Label>
              <p className="text-xs text-red-600">
                No inspectors have available time slots for the selected date. Please choose a different date or contact an administrator.
              </p>
            </div>
          )} */}

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
                  <RestrictedTimeClock
                    value={requestedTime}
                    onChange={handleTimeChange}
                    minTime={getTimeConstraints().minTime}
                    maxTime={getTimeConstraints().maxTime}
                    selectedDate={date}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1 w-full">
                  <Label className="text-xs text-gray-600">Duration *</Label>
                  <div className="flex w-full">
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={duration}
                      onChange={(e) => {
                        const newDuration = e.target.value;
                        setDuration(newDuration);

                        // Only validate if we have both time and duration values
                        if (
                          requestedTime &&
                          newDuration &&
                          !isNaN(parseFloat(newDuration))
                        ) {
                          validateTimeAgainstSlot(requestedTime, newDuration);
                        }
                      }}
                      className="text-sm h-8 rounded-r-none"
                      disabled={isProcessing}
                    />
                    <span className="flex items-center justify-center px-1 text-xs text-gray-800 border rounded-r-md bg-white">
                      Hrs
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">End Time</Label>
                  <Input
                    type="text"
                    value={calculateEndTime() ?? ""}
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
                value={
                  description.startsWith("Inspection ") || description.startsWith(" Inspection") || description.startsWith("Inspection for") || description.startsWith("Inspection") ? "" : description
                }
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