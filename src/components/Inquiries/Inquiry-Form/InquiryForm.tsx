/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import { Building, Home, Phone, Save, User, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  useLeads,
  type Lead,
  type LeadFormData,
} from "../../../context/LeadContext";
import {
  capitalizeFirstLetter,
  convertJobTypesToFormFormat,
  defaultFormData,
  extractAddressFromSite,
  extractNameFromQuery,
  extractPhoneFromQuery,
  formatSubmissionData,
  getCurrentTime,
  type FormSection,
} from "../../../helpers/helper";
import { useAssignStore } from "../../../store/assign";
import type {
  CustomerSearchResult,
  InspectorAvailability,
  NewCustomerFormData,
  PriorityLevel,
} from "../../../types/inquiryFormdata";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";

import { timeToMinutes } from "../../../lib/timeUtils";
import { showToast } from "../../../helpers/comman";
import { ConfirmationModal } from "../ConfirmationModal";

import { CustomerSearchSection } from "./CustomerSearchSection";
import { FormSectionHeader } from "./FormSectionHeader";
import { PropertyDetailsSection } from "./PropertyDetailsSection";
import { InspectorAssignmentSection } from "./InspectorAssignmentSection";
import { CustomerModal } from "./CustomerModal";
import { TimeWarningModal } from "./TimeWarningModal";
import { JobDetailsSection } from "./JobDetailsSection";
import { frappeAPI } from "../../../api/frappeClient";

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Lead | null;
}

const sections: FormSection[] = [
  {
    id: "contact",
    title: "Customer Information",
    icon: <Phone className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "job",
    title: "Job Details",
    icon: <Home className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "property",
    title: "Property Details",
    icon: <Building className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "inspector",
    title: "Schedule Inspection",
    icon: <User className="h-4 w-4" />,
    completed: false,
  },
];

const InquiryForm: React.FC<InquiryFormProps> = ({
  isOpen,
  onClose,
  inquiry,
}) => {
  const { user } = useAuth();
  const {
    loading,
    createLead,
    updateLead,
    jobTypes,
    fetchJobTypes,
    fetchProjectUrgency,
    projectUrgency,
    utmSource,
    fetchUtmSource,
  } = useLeads();

  const { createTodo, createTodoLoading } = useAssignStore();

  // State management
  const [activeSection, setActiveSection] = useState<string>("contact");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    ...defaultFormData,
  });
  const [showReferenceInput, setShowReferenceInput] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    startTime: false,
    endTime: false,
  });

  // Customer search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Customer modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [customerForm, setCustomerForm] = useState<NewCustomerFormData>({
    name: "",
    email: "",
    phone: "+971 ",
    jobType: jobTypes.length > 0 ? [jobTypes[0].name] : [],
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Inspector assignment states
  const [selectedInspector, setSelectedInspector] =
    useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [requestedTime, setRequestedTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEndTimeWarning, setShowEndTimeWarning] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customerModalRef = useRef<HTMLDivElement>(null);

  // ... (keeping all the existing logic methods - updatedSections, calculateDuration, etc.)
  const updatedSections = useMemo(() => {
    return sections.map((section) => {
      switch (section.id) {
        case "contact":
          return {
            ...section,
            completed:
              !!selectedCustomer &&
              (!showReferenceInput || !!formData.custom_reference_name),
          };
        case "job":
          return {
            ...section,
            completed:
              !!formData.custom_job_type &&
              !!formData.custom_budget_range &&
              !!formData.custom_project_urgency &&
              !!formData.source,
          };
        case "property":
          return {
            ...section,
            completed:
              !!formData.custom_property_name__number &&
              !!formData.custom_property_category &&
              !!formData.custom_property_area &&
              !!formData.custom_street_name &&
              !!formData.custom_emirate &&
              !!formData.custom_community &&
              !!formData.custom_area,
          };
        case "inspector":
          return {
            ...section,
            completed:
              !!selectedInspector && !!date && !!requestedTime && !!endTime,
          };
        default:
          return section;
      }
    });
  }, [
    formData,
    showReferenceInput,
    selectedInspector,
    selectedCustomer,
    date,
    requestedTime,
    endTime,
  ]);

  const calculateDuration = (): number => {
    if (!requestedTime || !endTime) return 0;

    const startMinutes = timeToMinutes(requestedTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) return 0;

    return (endMinutes - startMinutes) / 60;
  };

  const getDefaultStartTime = () => {
    // Use the selected date instead of current date
    const selectedDate = date || new Date();
    const now = new Date();

    // Only use current time if the selected date is today
    if (selectedDate.toDateString() === now.toDateString()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const roundedCurrentMinutes = Math.ceil(currentMinutes / 15) * 15;

      let defaultStartMinutes = roundedCurrentMinutes;

      if (selectedSlot) {
        const slotStartMinutes = timeToMinutes(selectedSlot.start);
        defaultStartMinutes = Math.max(defaultStartMinutes, slotStartMinutes);
      }

      const hours = Math.floor(defaultStartMinutes / 60);
      const minutes = defaultStartMinutes % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } else {
      // For future dates, use the start of the slot or 9:00 AM as default
      return selectedSlot ? selectedSlot.start : "09:00";
    }
  };

  // Initialize form data
  useEffect(() => {
    if (!hasFetchedInitialData && isOpen) {
      const fetchData = async () => {
        await fetchJobTypes();
        if (fetchProjectUrgency) await fetchProjectUrgency();
        if (fetchUtmSource) await fetchUtmSource();
        setHasFetchedInitialData(true);
      };
      fetchData();
    }
  }, [
    isOpen,
    hasFetchedInitialData,
    fetchJobTypes,
    fetchProjectUrgency,
    fetchUtmSource,
  ]);

  useEffect(() => {
    if (!formData.custom_preferred_inspection_time) {
      setFormData((prev) => ({
        ...prev,
        custom_preferred_inspection_time: getCurrentTime(),
      }));
    }
  }, []);

  // Time validation effect
  useEffect(() => {
    if (requestedTime && endTime && selectedSlot) {
      if (!validateTimeSelection(requestedTime, endTime, false)) {
        return;
      }

      const endMinutes = timeToMinutes(endTime);
      const slotEndMinutes = timeToMinutes(selectedSlot.end);

      if (endMinutes > slotEndMinutes) {
        setValidationErrors({ startTime: true, endTime: true });
        showToast.error(
          `End time (${endTime}) exceeds the selected slot (${selectedSlot.start} - ${selectedSlot.end}). Please adjust the end time.`
        );
      } else if (endMinutes > 18 * 60) {
        setShowEndTimeWarning(true);
        setValidationErrors({ startTime: false, endTime: false });
      } else {
        setShowEndTimeWarning(false);
        setValidationErrors({ startTime: false, endTime: false });
      }
    }
  }, [requestedTime, endTime, selectedSlot]);

  // Load inquiry data
  useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_jobtype: convertJobTypesToFormFormat(inquiry.custom_jobtype),
        custom_project_urgency: inquiry.custom_project_urgency || "",
        source: inquiry.source || "",
        custom_preferred_inspection_date:
          inquiry.custom_preferred_inspection_date
            ? new Date(inquiry.custom_preferred_inspection_date)
            : null,
      });

      setDate(
        inquiry.custom_preferred_inspection_date
          ? new Date(inquiry.custom_preferred_inspection_date)
          : new Date()
      );

      setShowReferenceInput(
        inquiry.source === "Reference" ||
          inquiry.source === "Supplier Reference"
      );

      if (inquiry.lead_name) {
        setSelectedCustomer({
          customer_name: inquiry.lead_name,
          mobile_no: inquiry.mobile_no || "+971 ",
          email_id: inquiry.email_id || "",
          name: inquiry.name || "",
          lead_name: inquiry.name,
        });
        setSearchQuery(inquiry.lead_name);
      }
    }
  }, [inquiry, hasFetchedInitialData]);

  // ... (all existing useEffect hooks and methods remain the same)

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setSelectedCustomer(null);
    setSelectedInspector(null);
    setSelectedSlot(null);
    setRequestedTime("");
    setEndTime("");
    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
    setShowReferenceInput(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setShowAvailabilityModal(false);
    setActiveSection("contact");
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: capitalizeFirstLetter(value) }));
  };

  const validateTimeSelection = (
    startTime: string,
    endTime: string,
    showError: boolean = true
  ): boolean => {
    setValidationErrors({
      startTime: false,
      endTime: false,
    });

    let isValid = true;
    let errorMessage = "";

    if (!startTime || !endTime) {
      if (showError) {
        showToast.error("Please select both start and end times");
      }
      return false;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      errorMessage = "End time must be after start time";
      isValid = false;
      setValidationErrors({ startTime: true, endTime: true });
    }

    if (isValid && endMinutes - startMinutes < 15) {
      errorMessage =
        "There must be at least 15 minutes between start and end time";
      isValid = false;
      setValidationErrors({ startTime: true, endTime: true });
    }

    // Check if the selected date is today
    const selectedDate = date || new Date();
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (isValid && isToday) {
      // For today, check if times are in the future
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      if (startMinutes < currentMinutes) {
        errorMessage =
          "Start time cannot be in the past for today's inspection";
        isValid = false;
        setValidationErrors({ startTime: true, endTime: false });
      }
    }

    if (isValid && selectedInspector) {
      const isWithinAvailableSlot =
        selectedInspector.availability.free_slots.some((slot) => {
          const slotStart = timeToMinutes(slot.start);
          const slotEnd = timeToMinutes(slot.end);
          return startMinutes >= slotStart && endMinutes <= slotEnd;
        });

      if (!isWithinAvailableSlot) {
        errorMessage =
          "Selected times must be within inspector's available slots";
        isValid = false;
        setValidationErrors({ startTime: true, endTime: true });
      }
    }

    if (!isValid && showError && errorMessage) {
      showToast.error(errorMessage);
    }

    return isValid;
  };

  const getEndTimeConstraints = () => {
    if (selectedSlot) {
      const minEndTime = requestedTime
        ? (() => {
            const startMinutes = timeToMinutes(requestedTime);
            const minEndMinutes = startMinutes + 15;
            const hours = Math.floor(minEndMinutes / 60);
            const minutes = minEndMinutes % 60;
            return `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
          })()
        : selectedSlot.start;

      return {
        minTime: minEndTime,
        maxTime: selectedSlot.end,
      };
    }

    const minEndTime = requestedTime
      ? (() => {
          const startMinutes = timeToMinutes(requestedTime);
          const minEndMinutes = startMinutes + 15;
          const hours = Math.floor(minEndMinutes / 60);
          const minutes = minEndMinutes % 60;
          return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        })()
      : "09:15";

    return {
      minTime: minEndTime,
      maxTime: "18:00",
    };
  };

  const handleStartTimeChange = (newTime: string) => {
    setValidationErrors({
      startTime: false,
      endTime: false,
    });

    setRequestedTime(newTime);

    if (endTime) {
      const startMinutes = timeToMinutes(newTime);
      const currentEndMinutes = timeToMinutes(endTime);

      if (currentEndMinutes - startMinutes < 15) {
        const newEndMinutes = startMinutes + 15;

        let maxEndMinutes = 18 * 60;

        if (selectedInspector) {
          const containingSlot = selectedInspector.availability.free_slots.find(
            (slot) => {
              const slotStart = timeToMinutes(slot.start);
              const slotEnd = timeToMinutes(slot.end);
              return startMinutes >= slotStart && startMinutes < slotEnd;
            }
          );

          if (containingSlot) {
            maxEndMinutes = timeToMinutes(containingSlot.end);
          }
        } else if (selectedSlot) {
          maxEndMinutes = timeToMinutes(selectedSlot.end);
        }

        const finalEndMinutes = Math.min(newEndMinutes, maxEndMinutes);
        const hours = Math.floor(finalEndMinutes / 60);
        const minutes = finalEndMinutes % 60;
        setEndTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`
        );
      }
    } else {
      const startMinutes = timeToMinutes(newTime);
      const defaultEndMinutes = startMinutes + 15;

      let maxEndMinutes = 18 * 60;

      if (selectedInspector) {
        const containingSlot = selectedInspector.availability.free_slots.find(
          (slot) => {
            const slotStart = timeToMinutes(slot.start);
            const slotEnd = timeToMinutes(slot.end);
            return startMinutes >= slotStart && startMinutes < slotEnd;
          }
        );

        if (containingSlot) {
          maxEndMinutes = timeToMinutes(containingSlot.end);
        }
      } else if (selectedSlot) {
        maxEndMinutes = timeToMinutes(selectedSlot.end);
      }

      const finalEndMinutes = Math.min(defaultEndMinutes, maxEndMinutes);
      const hours = Math.floor(finalEndMinutes / 60);
      const minutes = finalEndMinutes % 60;
      setEndTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setValidationErrors({
      startTime: false,
      endTime: false,
    });

    setEndTime(newEndTime);

    if (requestedTime) {
      validateTimeSelection(requestedTime, newEndTime, false);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "source" && { custom_reference_name: "" }),
    }));
    if (name === "source") {
      setShowReferenceInput(
        value === "Reference" || value === "Supplier Reference"
      );
    }
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setCustomerForm((prev) => ({ ...prev, phone: "+971 " }));
      return;
    }

    const digits = input.replace(/\D/g, "").substring(3);
    const limitedDigits = digits.substring(0, 9);

    let formattedNumber = "+971 ";

    if (limitedDigits.length > 0) {
      const isMobile = limitedDigits.startsWith("5");

      if (isMobile) {
        formattedNumber += limitedDigits.substring(0, 3);
        if (limitedDigits.length > 3) {
          formattedNumber += " " + limitedDigits.substring(3, 6);
          if (limitedDigits.length > 6) {
            formattedNumber += " " + limitedDigits.substring(6, 9);
          }
        }
      } else {
        formattedNumber += limitedDigits.substring(0, 2);
        if (limitedDigits.length > 2) {
          formattedNumber += " " + limitedDigits.substring(2, 5);
          if (limitedDigits.length > 5) {
            formattedNumber += " " + limitedDigits.substring(5, 9);
          }
        }
      }
    }

    setCustomerForm((prev) => ({ ...prev, phone: formattedNumber }));
  };

  const validateForm = (): boolean => {
    if (!selectedCustomer) {
      showToast.error("Customer selection is required");
      setActiveSection("contact");
      return false;
    }

    const isValidEmail = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    if (formData.email_id && !isValidEmail(formData.email_id)) {
      showToast.error("Please enter a valid email address");
      return false;
    }

    if (!formData.custom_jobtype || formData.custom_jobtype.length === 0) {
      showToast.error("At least one job type is required");
      setActiveSection("job");
      return false;
    }

    return true;
  };

  const saveLead = async (): Promise<string | undefined> => {
    try {
      const existingLeadId = inquiry?.name || formData.name;
      const isUpdate = !!existingLeadId;
      let submissionData = formatSubmissionData(formData, isUpdate);

      if (!inquiry && selectedCustomer) {
        submissionData = {
          ...submissionData,
          lead_name: selectedCustomer.customer_name,
          email_id: selectedCustomer.email_id || "",
          mobile_no: selectedCustomer.mobile_no || "+971 ",
        };
      }

      if (existingLeadId) {
        try {
          const freshLead = await frappeAPI.makeAuthenticatedRequest(
            "GET",
            `/api/resource/Lead/${existingLeadId}`
          );

          if (freshLead?.data) {
            submissionData = {
              ...freshLead.data,
              ...submissionData,
            };

            Object.keys(submissionData).forEach((key) => {
              if (submissionData[key] === undefined) {
                delete submissionData[key];
              }
            });
          }
        } catch (fetchError) {
          console.warn(
            "Could not fetch fresh lead data, proceeding with existing data:",
            fetchError
          );
        }

        const updatedLead = await updateLead(existingLeadId, submissionData);

        const convertedJobTypes = Array.isArray(updatedLead.custom_jobtype)
          ? updatedLead.custom_jobtype.map((item: any) =>
              typeof item === "string" ? item : item.job_type
            )
          : formData.custom_jobtype || [];

        setFormData((prev) => ({
          ...prev,
          ...updatedLead,
          custom_jobtype: convertedJobTypes,
          custom_preferred_inspection_date:
            updatedLead.custom_preferred_inspection_date
              ? new Date(updatedLead.custom_preferred_inspection_date)
              : prev.custom_preferred_inspection_date,
        }));

        showToast.success("Inquiry updated successfully!");
        return existingLeadId;
      } else {
        const newInquiry = await createLead(submissionData);

        const convertedJobTypes = Array.isArray(newInquiry.custom_jobtype)
          ? newInquiry.custom_jobtype.map((item: any) =>
              typeof item === "string" ? item : item.job_type
            )
          : formData.custom_jobtype || [];

        setFormData((prev) => ({
          ...prev,
          ...newInquiry,
          name: newInquiry.name,
          custom_jobtype: convertedJobTypes,
          custom_preferred_inspection_date:
            newInquiry.custom_preferred_inspection_date
              ? new Date(newInquiry.custom_preferred_inspection_date)
              : prev.custom_preferred_inspection_date,
        }));

        showToast.success("Inquiry created successfully!");
        return newInquiry.name;
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      showToast.error("Failed to save inquiry. Please try again.");
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const existingLeadId = inquiry?.name || formData.name;
      const isUpdate = !!existingLeadId;
      let submissionData = formatSubmissionData(formData, isUpdate);

      if (!inquiry && selectedCustomer) {
        submissionData = {
          ...submissionData,
          lead_name: selectedCustomer.customer_name,
          email_id: selectedCustomer.email_id || "",
          mobile_no: selectedCustomer.mobile_no || "+971 ",
        };
      }

      if (existingLeadId) {
        await updateLead(existingLeadId, submissionData);
        showToast.success("Inquiry updated successfully!");
      } else {
        const newInquiry = await createLead(submissionData);
        showToast.success("Inquiry created successfully!");
        setFormData((prev) => ({
          ...prev,
          name: newInquiry.name,
        }));
      }

      onClose();
    } catch (err: any) {
      console.error("Form submission error:", err);

      let errorMessage = "Failed to create inquiry. Please try again.";

      try {
        // ✅ Handle 502 / 503 first
        if (err?.response?.status === 502 || err?.response?.status === 503) {
          errorMessage =
            "Server is temporarily unavailable. Please try again later.";
        } else {
          const serverMessages =
            err?.response?.data?._server_messages || err?._server_messages;

          if (serverMessages) {
            try {
              const parsed = JSON.parse(serverMessages);
              if (parsed.length > 0) {
                errorMessage = parsed[0].message || parsed[0];
              }
            } catch {
              // If already string and not JSON
              errorMessage = serverMessages;
            }
          } else if (err?.response?.data?.exception) {
            errorMessage =
              err.response.data.exception.split(":").pop()?.trim() ||
              errorMessage;
          } else if (err?.message) {
            errorMessage = err.message;
            console.log("General error message:", errorMessage);
          }
        }
      } catch (parseErr) {
        console.warn("Error parsing server error:", parseErr);
      }

      showToast.error("Failed to create inquiry");
    }
  };

  const validateFormForAssignment = (): boolean => {
    const requiredFields = [
      {
        field: selectedCustomer,
        message: "Customer selection is required",
        section: "contact",
      },
      {
        field: formData.custom_jobtype?.length,
        message: "At least one job type is required",
        section: "job",
      },
      {
        field: formData.custom_budget_range,
        message: "Budget range is required",
        section: "job",
      },
      {
        field: formData.custom_project_urgency,
        message: "Project urgency is required",
        section: "job",
      },
      {
        field: formData.source,
        message: "Source of inquiry is required",
        section: "contact",
      },
      {
        field: formData.custom_property_name__number,
        message: "Property number is required",
        section: "property",
      },
      {
        field: formData.custom_property_category,
        message: "Property category is required",
        section: "property",
      },
      {
        field: formData.custom_property_area,
        message: "Property area is required",
        section: "property",
      },
      {
        field: formData.custom_street_name,
        message: "Street name is required",
        section: "property",
      },
      {
        field: formData.custom_emirate,
        message: "Emirate is required",
        section: "property",
      },
      {
        field: formData.custom_community,
        message: "Community is required",
        section: "property",
      },
      {
        field: formData.custom_area,
        message: "Area is required",
        section: "property",
      },
      {
        field: selectedInspector,
        message: "Inspector selection is required",
        section: "inspector",
      },
      {
        field: date,
        message: "Inspection date is required",
        section: "inspector",
      },
      {
        field: requestedTime,
        message: "Requested inspection time is required",
        section: "inspector",
      },
    ];

    for (const { field, message, section } of requiredFields) {
      if (!field) {
        showToast.error(`Please complete ${section} section: ${message}`);
        setActiveSection(section);
        return false;
      }
    }

    // Additional validations
    if (
      (formData.source === "Reference" ||
        formData.source === "Supplier Reference") &&
      !formData.custom_reference_name
    ) {
      showToast.error(
        "Please complete job details: Reference name is required"
      );
      setActiveSection("job");
      return false;
    }

    if (!validateRequestedTime()) {
      showToast.error(
        `Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`
      );
      setActiveSection("inspector");
      return false;
    }

    const endMinutes = timeToMinutes(endTime);
    if (endMinutes > 18 * 60) {
      showToast.error(
        "Inspection cannot end after 6:00 PM. Please adjust the end time."
      );
      setShowEndTimeWarning(true);
      setActiveSection("inspector");
      return false;
    }

    return true;
  };

  const handleAssignAndSave = () => {
    if (!validateFormForAssignment()) return;
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    setShowConfirmModal(false);

    try {
      const existingLeadId = inquiry?.name || formData.name;
      const isUpdate = !!existingLeadId;

      let inquiryName: string;

      if (existingLeadId) {
        const submissionData = formatSubmissionData(formData, isUpdate);
        await updateLead(existingLeadId, submissionData);
        inquiryName = existingLeadId;
        showToast.success("Inquiry updated successfully!");
      } else {
        const savedLeadName = await saveLead();
        if (!savedLeadName) {
          showToast.error("Failed to save inquiry");
          return;
        }
        inquiryName = savedLeadName;
      }

      const preferredDate = format(date!, "yyyy-MM-dd");
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;
      const duration = calculateDuration().toString();

      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiryName,
        inspector_email: selectedInspector!.email,
        description: formData.custom_special_requirements || "",
        priority: priority,
        preferred_date: preferredDate,
        custom_start_time: startDateTime,
        custom_end_time: endDateTime,
      });

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

      const dwaPayload = {
        employee_name: employeeName,
        date: preferredDate,
        custom_work_allocation: [
          {
            work_title: formData.custom_job_type || "Site Inspection",
            work_description: formData.custom_property_area,
            expected_start_date: requestedTime,
            expected_time_in_hours: parseFloat(duration),
            end_time: endTime,
          },
        ],
      };

      await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/Daily Work Allocation",
        dwaPayload
      );

      showToast.success("Inspector assigned successfully!");
      navigate("/sales?tab=assign");
      onClose();
    } catch (error) {
      console.error("Full error in assignment process:", error);
      showToast.error(`Failed to complete assignment`);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.site_address_search.search_site_addresses?search_term=${encodeURIComponent(
          query
        )}`
      );

      if (!response.message?.data) {
        throw new Error("Invalid response structure");
      }

      const results = response.message.data;

      const transformedResults = results.map((result: any) => {
        const nameFromSite =
          result.site_name?.split("-")[0]?.split(",")[0] || "Unknown";
        return {
          ...result,
          search_type: "address",
          customer_name:
            result.lead_details?.lead_name ||
            result.customer_details?.customer_name ||
            nameFromSite,
          mobile_no:
            result.custom_lead_phone_number ||
            result.lead_details?.mobile_no ||
            result.custom_customer_phone_number ||
            result.customer_details?.mobile_no,
          email_id:
            result.custom_lead_email ||
            result.lead_details?.email_id ||
            result.custom_customer_email ||
            result.customer_details?.email_id,
          name: result.customer_details?.name || result.lead_details?.name,
          lead_name: result.lead_details?.name,
          area: result.site_name,
          address_details: {
            emirate: result.custom_emirate,
            area: result.custom_area,
            community: result.custom_community,
            street_name: result.custom_street_name,
            property_number: result.custom_property_number,
            combined_address:
              extractAddressFromSite(result.custom_combine_address) ||
              extractAddressFromSite(result.site_name),
            property_category: result.custom_property_category,
            property_type: result.custom_property_type,
          },
          match_info: result.match_info,
        };
      });

      setSearchResults(transformedResults);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(capitalizeFirstLetter(query));

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        searchCustomers(query);
      }, 300)
    );
  };

  const handleCustomerSelect = async (result: CustomerSearchResult) => {
    setSelectedCustomer(result);
    setSearchQuery(result.customer_name);
    setShowDropdown(false);

    setFormData((prev) => ({
      ...prev,
      lead_name: result.customer_name,
      email_id: result.email_id || "",
      mobile_no: result.mobile_no || "+971 ",
      customer_id: result.name || "",
      lead_id: result.lead_name || "",
    }));

    if (result.address_details) {
      const address = extractAddressFromSite(result.address_details.combined_address)
      setFormData((prev) => ({
        ...prev,
        custom_property_category:
          result.address_details?.property_category || "",
        custom_emirate: result.address_details?.emirate || "",
        custom_community: result.address_details?.community || "",
        custom_area: result.address_details?.area || "",
        custom_street_name: result.address_details?.street_name || "",
        custom_property_name__number:
          result.address_details?.property_number || "",
        custom_property_area: address || "",
        custom_property_type: result.address_details?.property_type || "",
      }));
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setFormData((prev) => ({
      ...prev,
      lead_name: "",
      email_id: "",
      mobile_no: "+971 ",
      customer_id: "",
      lead_id: "",
    }));
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setCustomerForm({
      name: extractNameFromQuery(searchQuery),
      email: "",
      phone: extractPhoneFromQuery(searchQuery),
      jobType: jobTypes.length > 0 ? [jobTypes[0].name] : [],
    });
    setShowCustomerModal(true);
    setShowDropdown(false);
  };

  const handleOpenEditModal = () => {
    if (!selectedCustomer) return;

    setModalMode("edit");
    setCustomerForm({
      name: selectedCustomer.customer_name,
      email: selectedCustomer.email_id || "",
      phone: selectedCustomer.mobile_no || "+971 ",
      jobType:
        formData.custom_jobtype ||
        (jobTypes.length > 0 ? [jobTypes[0].name] : []),
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      showToast.error("Customer name is required");
      return;
    }
    if (!customerForm.name.trim()) {
      showToast.error("Customer name is required");
      return;
    }

    if (!customerForm.phone || customerForm.phone.length < 5) {
      showToast.error("Valid mobile number is required");
      return;
    }
    if (!customerForm.phone || customerForm.phone.length < 5) {
      showToast.error("Valid mobile number is required");
      return;
    }

    try {
      setIsCreatingCustomer(true);

      const updatedCustomer = {
        customer_name: customerForm.name.trim(),
        mobile_no: customerForm.phone,
        email_id: customerForm.email || "",
        name: selectedCustomer?.name || "",
        lead_name: selectedCustomer?.lead_name || "",
      };

      setSelectedCustomer(updatedCustomer);
      setSearchQuery(updatedCustomer.customer_name);

      setFormData((prev) => ({
        ...prev,
        lead_name: updatedCustomer.customer_name,
        email_id: updatedCustomer.email_id,
        mobile_no: updatedCustomer.mobile_no,
        customer_id: updatedCustomer.name || prev.customer_id,
        lead_id: updatedCustomer.lead_name || prev.lead_id,
      }));

      setShowCustomerModal(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "+971 ",
        jobType: [],
      });
      setShowCustomerModal(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "+971 ",
        jobType: [],
      });

      showToast.success(
        modalMode === "create"
          ? `Customer "${updatedCustomer.customer_name}" details added`
          : `Customer "${updatedCustomer.customer_name}" details updated`
      );
    } catch (error) {
      console.error("Error updating customer details:", error);
      showToast.error("Failed to update customer details");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const validateRequestedTime = () => {
    if (!requestedTime || !selectedSlot) return false;

    const requestedMinutes = timeToMinutes(requestedTime);
    const slotStartMinutes = timeToMinutes(selectedSlot.start);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);
    const duration = calculateDuration();
    const durationMinutes = Math.round(duration * 60);

    if (
      requestedMinutes < slotStartMinutes ||
      requestedMinutes >= slotEndMinutes
    ) {
      return false;
    }

    if (requestedMinutes + durationMinutes > slotEndMinutes) {
      return false;
    }

    return true;
  };

  const handleInspectorSelect = (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
  ) => {
    const inspector = availabilityData.find(
      (inspector) => inspector.email === email
    );
    if (inspector) {
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
        showToast.success(`Selected ${inspector.user_name}`);
      }
    }
    setShowAvailabilityModal(false);
  };
  // Update the handleSlotSelect function to use the correct date
  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);

    const defaultStartTime = getDefaultStartTime();
    setRequestedTime(defaultStartTime);

    const startMinutes = timeToMinutes(defaultStartTime);
    const slotEndMinutes = timeToMinutes(slot.end);
    const defaultEndMinutes = Math.min(startMinutes + 15, slotEndMinutes);
    const hours = Math.floor(defaultEndMinutes / 60);
    const minutes = defaultEndMinutes % 60;
    setEndTime(
      `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`
    );

    showToast.success(`Selected time slot: ${slot.start} - ${slot.end}`);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setSelectedInspector(null);
    setSelectedSlot(null);

    if (selectedDate) {
      setTimeout(() => {
        setShowAvailabilityModal(true);
      }, 300);
    }
  };

  // Update dropdown position
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showCustomerModal &&
        customerModalRef.current &&
        !customerModalRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerModal]);

  if (!isOpen) return null;

  const handleCancelSaveCustomer = () => {
    if (confirm("Are you sure you want to discard changes?")) {
      setShowCustomerModal(false);
    }
  };

  return (


<>
  {/* Backdrop with enhanced blur and opacity */}
  <div
    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity duration-500"
    onClick={() => {
      if (!showCustomerModal) {
        handleClose();
      }
    }}
  />

  {/* Slide-out Panel with modern styling */}
  <div
    className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white rounded-l-2xl shadow-2xl border-l border-gray-100 transform transition-transform duration-500 ease-in-out z-50"
    style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
  >
    <div className="flex flex-col h-full">
      {/* Header with gradient and improved button */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-md">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">
            {inquiry ? "Edit Inquiry" : "New Inquiry"}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full text-white hover:bg-white/20 transition-colors"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="p-4 flex-1 overflow-y-auto">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {updatedSections.map((section) => (
            <div
              key={section.id}
              className="bg-gray-50 border border-green-200 rounded-lg overflow-hidden shadow-sm"
            >
              <FormSectionHeader
                section={section}
                activeSection={activeSection}
                onToggle={toggleSection}
              />

              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  activeSection === section.id
                    ? "max-h-screen opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-5 pt-3 space-y-5">
                  {section.id === "contact" && (
                    <CustomerSearchSection
                      selectedCustomer={selectedCustomer}
                      searchQuery={searchQuery}
                      searchResults={searchResults}
                      isSearching={isSearching}
                      showDropdown={showDropdown}
                      dropdownPosition={dropdownPosition}
                      onSearchChange={handleSearchChange}
                      onCustomerSelect={handleCustomerSelect}
                      onClearCustomer={handleClearCustomer}
                      onOpenCreateModal={handleOpenCreateModal}
                      onOpenEditModal={handleOpenEditModal}
                      showReferenceInput={showReferenceInput}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      setDropdownPosition={setDropdownPosition}
                    />
                  )}

                  {section.id === "job" && (
                    <JobDetailsSection
                      formData={formData}
                      jobTypes={jobTypes}
                      projectUrgency={projectUrgency}
                      utmSource={utmSource}
                      showReferenceInput={showReferenceInput}
                      onSelectChange={handleSelectChange}
                      onJobTypesChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          custom_jobtype: selected,
                        }));
                      }}
                      handleInputChange={handleInputChange}
                    />
                  )}

                  {section.id === "property" && (
                    <PropertyDetailsSection
                      formData={formData}
                      handleSelectChange={handleSelectChange}
                    />
                  )}

                  {section.id === "inspector" && (
                    <InspectorAssignmentSection
                      date={date}
                      selectedInspector={selectedInspector}
                      selectedSlot={selectedSlot}
                      requestedTime={requestedTime}
                      endTime={endTime}
                      priority={priority}
                      validationErrors={validationErrors}
                      createTodoLoading={createTodoLoading}
                      loading={loading}
                      showAvailabilityModal={showAvailabilityModal}
                      onDateSelect={handleDateSelect}
                      onSlotSelect={handleSlotSelect}
                      onStartTimeChange={handleStartTimeChange}
                      onEndTimeChange={handleEndTimeChange}
                      onPriorityChange={(value) =>
                        setPriority(value as PriorityLevel)
                      }
                      onShowAvailabilityModal={() =>
                        setShowAvailabilityModal(true)
                      }
                      onHideAvailabilityModal={() =>
                        setShowAvailabilityModal(false)
                      }
                      onInspectorSelect={handleInspectorSelect}
                      onAssignAndSave={handleAssignAndSave}
                      calculateDuration={calculateDuration}
                      getDefaultStartTime={getDefaultStartTime}
                      getEndTimeConstraints={getEndTimeConstraints}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Special Requirements Textarea */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <Label
              htmlFor="custom_special_requirements"
              className="text-sm mb-1 font-medium text-gray-700 block"
            >
              Special Requirements
            </Label>
            <Textarea
              id="custom_special_requirements"
              name="custom_special_requirements"
              value={formData.custom_special_requirements || ""}
              onChange={handleInputChange}
              placeholder="Enter any special requirements or notes"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white">
                  <Save className="h-4 w-4" />
                  {inquiry ? "Update" : "Create"} Inquiry
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>

  {/* Other modals (unchanged for this task) */}
  <CustomerModal
    isOpen={showCustomerModal}
    mode={modalMode}
    customerForm={customerForm}
    isCreatingCustomer={isCreatingCustomer}
    onClose={() => setShowCustomerModal(false)}
    onSave={handleSaveCustomer}
    onCancel={handleCancelSaveCustomer}
    onFormChange={setCustomerForm}
    onPhoneChange={handlePhoneChange}
  />
  <TimeWarningModal
    isOpen={showEndTimeWarning}
    onClose={() => setShowEndTimeWarning(false)}
  />
  <ConfirmationModal
    isOpen={showConfirmModal}
    onConfirm={confirmAssignment}
    onCancel={() => setShowConfirmModal(false)}
    title="Confirm Inspector Assignment"
    message={`Are you sure to assign ${selectedInspector?.user_name} for the inspection on ${date ? format(date, "MMM dd, yyyy") : ""} at ${requestedTime}? Once assigned, customer details cannot be modified for this inquiry.`}
  />
</>
  );
};

export default InquiryForm;
