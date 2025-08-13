/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { frappeAPI } from "../../api/frappeClient";
import { useAuth } from "../../context/AuthContext";
import {
  useLeads,
  type Lead,
  type LeadFormData,
} from "../../context/LeadContext";
import {
  budgetRanges,
  defaultFormData,
  formatSubmissionData,
  type FormSection,
} from "../../helpers/helper";
import { timeToMinutes } from "../../lib/timeUtils";
import { useAssignStore } from "../../store/assign";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import UserAvailability from "../ui/UserAvailability";
import PropertyAddressSection from "./PropertyAddress";

type PriorityLevel = "Low" | "Medium" | "High";

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Lead | null;
}

const sections: FormSection[] = [
  {
    id: "contact",
    title: "Customer Details",
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
    title: "Property Information",
    icon: <Building className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "additional",
    title: "Additional Information",
    icon: <FileText className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "inspector",
    title: "Assign Inspector",
    icon: <User className="h-4 w-4" />,
    completed: false,
  },
];

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

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Lead | null;
}

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

  const {
    fetchInspectors,
    // inspectors,
    // inspectorsLoading,
    createTodo,
    createTodoLoading,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();

  const [activeSection, setActiveSection] = useState<string>("contact");
  const [phoneNumber, setPhoneNumber] = useState("+971 ");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  // const [inspectorEmail, setInspectorEmail] = useState("");
  // const [showAvailability, setShowAvailability] = useState(false);

  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    ...defaultFormData,
  });
  const [showReferenceInput, setShowReferenceInput] = useState(false);

  // Customer search states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const [customerSearchTimeout, setCustomerSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [showNewCustomerFields, setShowNewCustomerFields] = useState(false);

  // Add these new state variables for enhanced inspector assignment
  const [selectedInspector, setSelectedInspector] =
    useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [requestedTime, setRequestedTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Remove these old variables (they'll be replaced):
  // const [inspectorEmail, setInspectorEmail] = useState("");
  // const [showAvailability, setShowAvailability] = useState(false);

  const navigate = useNavigate();

  const updatedSections = useMemo(() => {
    return sections.map((section) => {
      switch (section.id) {
        case "contact":
          return {
            ...section,
            completed:
              !!formData.lead_name &&
              !!formData.email_id &&
              !!formData.mobile_no &&
              (!showReferenceInput || !!formData.custom_reference_name),
          };
        case "job":
          return { ...section, completed: !!formData.custom_job_type };
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
        case "additional":
          return {
            ...section,
            completed:
              !!formData.custom_special_requirements ||
              (!!formData.custom_preferred_inspection_date &&
                !!formData.custom_preferred_inspection_time),
          };
        case "inspector":
          return { ...section, completed: !!selectedInspector }; // Changed from inspectorEmail
        default:
          return section;
      }
    });
  }, [formData, showReferenceInput, selectedInspector]);

  useEffect(() => {
    if (!hasFetchedInitialData && isOpen) {
      const fetchData = async () => {
        await fetchJobTypes();
        if (fetchProjectUrgency) await fetchProjectUrgency();
        if (fetchUtmSource) await fetchUtmSource();
        await fetchInspectors();
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
    fetchInspectors,
  ]);

  useEffect(() => {
    if (!formData.custom_preferred_inspection_time) {
      setFormData((prev) => ({
        ...prev,
        custom_preferred_inspection_time: getCurrentTime(),
      }));
    }
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Add these helper functions for time validation and calculation
  const validateRequestedTime = () => {
    if (!requestedTime) return false;
    if (!selectedSlot) return false;

    const requestedMinutes = timeToMinutes(requestedTime);
    const slotStartMinutes = timeToMinutes(selectedSlot.start);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);
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
    if (!selectedSlot || !requestedTime) return;

    const durationHours = parseFloat(durationValue);
    const durationMinutes = Math.round(durationHours * 60);
    const startMinutes = timeToMinutes(requestedTime);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);

    if (startMinutes + durationMinutes > slotEndMinutes) {
      const availableHours = (slotEndMinutes - startMinutes) / 60;
      toast.error(
        `Duration exceeds available time. Max ${availableHours.toFixed(
          1
        )} hours available in this slot.`,
        { duration: 2000 }
      );
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
        setFormData((prev) => ({
          ...prev,
          custom_preferred_inspection_time: firstSlot.start,
        }));
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
    setFormData((prev) => ({
      ...prev,
      custom_preferred_inspection_time: slot.start,
    }));
    toast.success(`Selected time slot: ${slot.start} - ${slot.end}`);
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
useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_job_type: inquiry.custom_job_type || "",
        custom_project_urgency: inquiry.custom_project_urgency || "",
        source: inquiry.source || "",
        custom_preferred_inspection_date:
          inquiry.custom_preferred_inspection_date
            ? new Date(inquiry.custom_preferred_inspection_date)
            : null,
      });
      setPhoneNumber(inquiry.mobile_no || "+971 ");
      setDate(
        inquiry.custom_preferred_inspection_date
          ? new Date(inquiry.custom_preferred_inspection_date)
          : new Date()
      );
      setShowReferenceInput(
        inquiry.source === "Reference" ||
          inquiry.source === "Supplier Reference"
      );
      
      // FIX: Set the customer search query with the existing lead name
      setCustomerSearchQuery(inquiry.lead_name || "");
      // Also ensure we show the customer fields since we have existing data
      setShowNewCustomerFields(true);
    }
  }, [inquiry, hasFetchedInitialData]);

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setPhoneNumber("+971 ");
    // Replace these lines:
    // setInspectorEmail("");
    // With these:
    setSelectedInspector(null);
    setSelectedSlot(null);
    setRequestedTime("");
    setDuration("0.5");

    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
    setShowReferenceInput(false);
    setCustomerSearchQuery("");
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
    setShowNewCustomerFields(false);
    setShowAvailabilityModal(false); // Add this
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // const handleDateChange = (name: string, date: Date | undefined) => {
  //   setFormData((prev) => ({ ...prev, [name]: date || null }));
  // };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setFormData((prev) => ({ ...prev, mobile_no: "+971 " }));
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

    setFormData((prev) => ({ ...prev, mobile_no: formattedNumber }));
  };

  const validateForm = (): boolean => {
    if (!formData.lead_name) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.mobile_no) {
      toast.error("Mobile number is required");
      return false;
    }
    if (!formData.custom_job_type) {
      toast.error("Job type is required");
      return false;
    }
    if (!formData.custom_budget_range) {
      toast.error("Budget range is required");
      return false;
    }
    if (!formData.custom_project_urgency) {
      toast.error("Project urgency is required");
      return false;
    }
    if (!formData.source) {
      toast.error("Source of inquiry is required");
      return false;
    }
    if (
      (formData.source === "Reference" ||
        formData.source === "Supplier Reference") &&
      !formData.custom_reference_name
    ) {
      toast.error("Reference name is required");
      return false;
    }
    return true;
  };

  const saveLead = async (): Promise<string | undefined> => {
    try {
      const submissionData = formatSubmissionData(formData);

      if (inquiry?.name) {
        await updateLead(inquiry.name, submissionData);
        toast.success("Inquiry updated successfully!");
        return inquiry.name;
      } else {
        const newInquiry = await createLead(submissionData);
        toast.success("Inquiry created successfully!");
        return newInquiry.name;
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      toast.error("Failed to save inquiry. Please try again.");
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await saveLead();
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("Failed to create inquiry. Please try again.");
    }
  };

  const handleAssignAndSave = async () => {
    if (!validateForm()) return;
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
      toast.error(
        `Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`
      );
      return;
    }

    try {
      const inquiryName = await saveLead();
      if (!inquiryName) {
        toast.error("Failed to save inquiry");
        return;
      }

      const preferredDate = format(date, "yyyy-MM-dd");
      const endTime = calculateEndTime();

      // Combine date and time for DATETIME fields
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;

      // Create todo
      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiryName,
        inspector_email: selectedInspector.email,
        description: formData.custom_special_requirements || "",
        priority: priority,
        preferred_date: preferredDate,
        custom_start_time: startDateTime,
        custom_end_time: endDateTime,
      });

      // Get employee name for DWA
      let employeeName = "";
      const employeeResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Employee?filters=[["user_id","=","${selectedInspector.email}"]]`
      );

      if (employeeResponse?.data?.length > 0) {
        employeeName = employeeResponse.data[0].name;
      } else {
        throw new Error(
          `Could not find employee record for ${selectedInspector.email}`
        );
      }

      // Create DWA
      const dwaPayload = {
        employee_name: employeeName,
        date: preferredDate,
        custom_work_allocation: [
          {
            work_title: formData.custom_job_type || "Site Inspection",
            work_description: formData.custom_property_area,
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
      navigate("/sales?tab=assign");
      onClose();
    } catch (error) {
      console.error("Full error in assignment process:", error);
      toast.error(
        `Failed to complete assignment: ${
          error && typeof error === "object" && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Updated customer search function - only search by name, email, and phone
  const handleCustomerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setShowNewCustomerFields(false);
      return;
    }

    setIsCustomerSearching(true);
    try {
      const allResults: any[] = [];
      const addressEndpoint =
        "/api/method/eits_app.site_address_search.search_site_addresses";
      const queryLower = query.toLowerCase().trim();

      const searchPromises: Promise<any>[] = [];

      if (queryLower.length >= 2) {
        // Search by Customer Name
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?search_term=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "customer_name",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "customer_name", data: [] }))
        );

        // Search by Lead Name
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_lead_customer_name=${encodeURIComponent(
                query
              )}`
            )
            .then((response) => ({
              type: "lead_name",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "lead_name", data: [] }))
        );

        // Search by Customer Email
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?search_term=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "customer_email",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "customer_email", data: [] }))
        );

        // Search by Lead Email
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?search_term=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "lead_email",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "lead_email", data: [] }))
        );

        // Search by Phone (if query looks like a phone number)
        if (/^\+?\d+$/.test(query.replace(/[\s-]/g, ""))) {
          const cleanPhone = query.replace(/[\s-]/g, "");

          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?search_term=${encodeURIComponent(
                  cleanPhone
                )}`
              )
              .then((response) => ({
                type: "customer_phone",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "customer_phone", data: [] }))
          );

          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?search_term=${encodeURIComponent(
                  cleanPhone
                )}`
              )
              .then((response) => ({
                type: "lead_phone",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "lead_phone", data: [] }))
          );
        }

        const searchResults = await Promise.all(searchPromises);

        searchResults.forEach((result) => {
          if (result.data && Array.isArray(result.data)) {
            const transformedData = result.data.map((address: any) => ({
              ...address,
              search_type: "customer",
              found_via: result.type,
              customer_name:
                address.customer_details?.customer_name ||
                address.lead_details?.lead_name ||
                address.custom_lead_customer_name ||
                `Customer`,
              mobile_no:
                address.custom_customer_phone_number ||
                address.custom_lead_phone_number ||
                address.customer_details?.mobile_no ||
                address.lead_details?.mobile_no,
              email_id:
                address.custom_customer_email ||
                address.lead_details?.email_id ||
                address.customer_details?.email_id,
              name: address.customer_details?.name || address.custom_lead_name,
              lead_name: address.custom_lead_name,
              // Address information (if available)
              address_details: {
                emirate: address.custom_emirate || "",
                area: address.custom_area || "",
                community: address.custom_community || "",
                street_name: address.custom_street_name || "",
                property_number: address.custom_property_number || "",
                property_category: address.custom_property_category || "",
                combined_address: address.custom_combined_address || "",
              },
            }));
            allResults.push(...transformedData);
          }
        });
      }

      const uniqueResults = allResults.filter((result, index, self) => {
        return (
          index ===
          self.findIndex(
            (r) =>
              (r.customer_name === result.customer_name &&
                r.email_id === result.email_id &&
                r.mobile_no === result.mobile_no) ||
              (r.custom_lead_name &&
                result.custom_lead_name &&
                r.custom_lead_name === result.custom_lead_name)
          )
        );
      });

      setCustomerSearchResults(uniqueResults);
      setShowCustomerDropdown(true);

      // Show new customer fields immediately if no results found
      if (uniqueResults.length === 0) {
        setShowNewCustomerFields(true);
      } else {
        setShowNewCustomerFields(false);
      }
    } catch (error) {
      console.error("Customer search error:", error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setShowNewCustomerFields(true);
      toast.error("Failed to search customers. Please try again.");
    } finally {
      setIsCustomerSearching(false);
    }
  }, []);

  const handleCustomerSelect = async (result: any) => {
    setFetchingCustomerDetails(true);
    setShowNewCustomerFields(false);

    try {
      // Set customer data
      const customerData = {
        lead_name: result.customer_name,
        email_id: result.email_id || "",
        mobile_no: result.mobile_no || "+971 ",
        customer_id: result.name || "",
        lead_id: result.custom_lead_name || "",
      };

      // Set address data if available
      const addressData = result.address_details
        ? {
            custom_property_category:
              result.address_details.property_category || "",
            custom_emirate: result.address_details.emirate || "",
            custom_community: result.address_details.community || "",
            custom_area: result.address_details.area || "",
            custom_street_name: result.address_details.street_name || "",
            custom_property_name__number:
              result.address_details.property_number || "",
            custom_property_area: result.address_details.combined_address || "",
          }
        : {};

      setFormData((prev) => ({
        ...prev,
        ...customerData,
        ...addressData,
      }));

      setCustomerSearchQuery(result.customer_name);
      setShowCustomerDropdown(false);
    } finally {
      setFetchingCustomerDetails(false);
    }
  };

  const handleCustomerSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setCustomerSearchQuery(query);

    if (!query.trim()) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setShowNewCustomerFields(false);
      return;
    }

    if (customerSearchTimeout) {
      clearTimeout(customerSearchTimeout);
    }

    setCustomerSearchTimeout(
      setTimeout(() => {
        handleCustomerSearch(query);
      }, 300)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [8, 9, 13, 16, 17, 18, 20, 27, 35, 36, 37, 38, 39, 40, 45, 46].includes(
        e.keyCode
      )
    ) {
      return;
    }

    const input = e.currentTarget;
    if (input.selectionStart && input.selectionStart < 5) {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      <div
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex flex-col h-full">
          <div className="bg-emerald-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {inquiry ? "Edit Inquiry" : "New Inquiry"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {updatedSections.map((section) => (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    className={`w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors ${
                      activeSection === section.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
                        {section.title}
                      </h4>
                      {section.completed && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    {activeSection === section.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      activeSection === section.id
                        ? "max-h-[1000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-4 pt-2 space-y-4">
                      {section.id === "contact" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2 col-span-1 md:col-span-3 relative">
                            <Label
                              htmlFor="customer_search"
                              className="flex items-center space-x-2"
                            >
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                Customer{" "}
                                <span className="text-gray-500">
                                  (name/email/phone)
                                </span>
                                <span className="text-red-500 ml-1">*</span>
                              </span>
                              {fetchingCustomerDetails && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                              )}
                            </Label>

                            <div className="relative">
                              <Input
                                id="customer_search"
                                name="customer_search"
                                value={customerSearchQuery}
                                onChange={handleCustomerSearchChange}
                                placeholder="Search by name, phone or email"
                                required
                                className="pr-10"
                              />
                              {isCustomerSearching && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                              )}
                            </div>

                            {showCustomerDropdown && (
                              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                {customerSearchResults.length > 0 ? (
                                  customerSearchResults.map((result, index) => (
                                    <div
                                      key={`customer-result-${index}`}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() =>
                                        handleCustomerSelect(result)
                                      }
                                    >
                                      <p className="font-medium truncate">
                                        {result.customer_name}
                                      </p>
                                      {(result.mobile_no ||
                                        result.email_id) && (
                                        <div className="text-xs text-gray-500 space-x-2">
                                          {result.mobile_no && (
                                            <span className="inline-flex items-center">
                                              <Phone className="h-3 w-3 mr-1" />
                                              {result.mobile_no}
                                            </span>
                                          )}
                                          {result.email_id && (
                                            <span className="inline-flex items-center">
                                              <Mail className="h-3 w-3 mr-1" />
                                              {result.email_id}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-4 py-2 text-center">
                                    <p className="font-medium text-gray-700">
                                      No customers found for "
                                      {customerSearchQuery}"
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Fill in the details below to add a new
                                      customer
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Show customer fields when needed */}
                          {(showNewCustomerFields ||
                            formData.lead_name ||
                            customerSearchQuery) && (
                            <>
                              <div className="col-span-1">
                                <Label
                                  htmlFor="phone"
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Phone Number{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="tel"
                                  id="phone"
                                  name="mobile_no"
                                  value={formData.mobile_no || phoneNumber}
                                  onChange={handlePhoneChange}
                                  onKeyDown={handleKeyDown}
                                  placeholder="+971 XX XXX XXXX"
                                  className="w-full"
                                  maxLength={17}
                                  required
                                />
                              </div>

                              <div className="col-span-1">
                                <Label
                                  htmlFor="email_id"
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Email
                                </Label>
                                <Input
                                  type="email"
                                  id="email_id"
                                  name="email_id"
                                  value={formData.email_id || ""}
                                  onChange={handleInputChange}
                                  placeholder="Enter email"
                                />
                              </div>
                            </>
                          )}

                          <div className="col-span-1 md:col-span-2">
                            <Label
                              htmlFor="source"
                              className="text-sm font-medium text-gray-700"
                            >
                              Source Of Inquiry{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.source || ""}
                              onValueChange={(value) => {
                                handleSelectChange("source", value);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {[...utmSource]
                                  .sort((a, b) => a.name.localeCompare(b.name))
                                  .map((utms) => (
                                    <SelectItem
                                      key={utms.name}
                                      value={utms.name}
                                    >
                                      {utms.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>

                            {showReferenceInput && (
                              <div className="mt-4">
                                <Label
                                  htmlFor="custom_reference_name"
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Reference Name{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="text"
                                  id="custom_reference_name"
                                  name="custom_reference_name"
                                  value={formData.custom_reference_name || ""}
                                  onChange={handleInputChange}
                                  required
                                  placeholder="Enter reference name"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {section.id === "job" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label
                              htmlFor="custom_job_type"
                              className="text-sm font-medium text-gray-700"
                            >
                              Job Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.custom_job_type || ""}
                              onValueChange={(value) =>
                                handleSelectChange("custom_job_type", value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {jobTypes.map((jobType) => (
                                  <SelectItem
                                    key={jobType.name}
                                    value={jobType.name}
                                  >
                                    {jobType.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor="custom_budget_range"
                              className="text-sm font-medium text-gray-700"
                            >
                              Budget Range
                            </Label>
                            <Select
                              value={formData.custom_budget_range || ""}
                              onValueChange={(value) =>
                                handleSelectChange("custom_budget_range", value)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {budgetRanges.map((range) => (
                                  <SelectItem key={range} value={range}>
                                    {range}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Project Urgency
                            </Label>
                            <Select
                              value={formData.custom_project_urgency || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "custom_project_urgency",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select urgency" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {projectUrgency.map((urgency) => (
                                  <SelectItem
                                    key={urgency.name}
                                    value={urgency.name}
                                  >
                                    {urgency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {section.id === "property" && (
                        <PropertyAddressSection
                          formData={formData}
                          handleSelectChange={handleSelectChange}
                          fieldNames={{
                          propertyNumber: "custom_property_name__number",
                          emirate: "custom_emirate",
                          area: "custom_area", // This is the individual area field
                          community: "custom_community",
                          streetName: "custom_street_name",
                          propertyArea: "custom_property_area", // This maps to the actual 'area' field in backend
                          propertyCategory: "custom_property_category",
                          propertyType: "custom_property_type",
                        }}
                          
                        />
                      )}

                      {section.id === "additional" && (
                        <div>
                          <div>
                            <Label
                              htmlFor="custom_special_requirements"
                              className="text-xs font-medium text-gray-700"
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
                            />
                          </div>
                        </div>
                      )}

                      {section.id === "inspector" && (
                        <div className="space-y-4">
                          {assignError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-2">
                              <div className="text-red-700 text-sm">
                                {assignError}
                              </div>
                            </div>
                          )}
                          {assignSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2">
                              <div className="text-emerald-700 text-sm">
                                Inspector assigned successfully!
                              </div>
                            </div>
                          )}

                          {/* Step 1: Date Selection */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm font-medium">
                              Select Inspection Date{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <input
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                value={date ? format(date, "yyyy-MM-dd") : ""}
                                onChange={(e) => {
                                  const selectedDate = e.target.value
                                    ? new Date(e.target.value)
                                    : undefined;
                                  handleDateSelect(selectedDate);
                                }}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm appearance-none" // Added appearance-none
                              />
                              <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />{" "}
                              {/* Added pointer-events-none */}
                            </div>
                          </div>

                          {/* Step 2: Inspector Selection */}
                          {date && (
                            <div className="space-y-2">
                              <Label className="text-gray-700 text-sm font-medium">
                                Inspector Selected
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
                                ) : (
                                  <div className="text-sm text-gray-600">
                                    Waiting for inspector selection...
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowAvailabilityModal(true)}
                                >
                                  {selectedInspector ? "Change" : "Select"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Step 3: Time Slot Selection */}
                          {selectedInspector &&
                            selectedInspector.availability.free_slots.length >
                              0 && (
                              <div className="space-y-2 p-3 bg-yellow-50 rounded-lg">
                                <Label className="text-gray-700 text-sm font-medium">
                                  Available Time Slots
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {selectedInspector.availability.free_slots.map(
                                    (slot, index) => (
                                      <Button
                                        key={index}
                                        type="button"
                                        variant={
                                          selectedSlot?.start === slot.start &&
                                          selectedSlot?.end === slot.end
                                            ? "outline"
                                            : "default"
                                        }
                                        className="justify-center h-auto py-1.5 px-2 text-xs"
                                        onClick={() =>
                                          handleSlotSelect({
                                            start: slot.start,
                                            end: slot.end,
                                          })
                                        }
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
                          {selectedSlot && (
                            <div className="space-y-3 p-3 border rounded-lg">
                              <Label className="text-gray-700 text-sm font-medium">
                                Finalize Time & Duration
                              </Label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">
                                    Start Time *
                                  </Label>
                                  <Input
                                    type="time"
                                    value={requestedTime}
                                    onChange={(e) => {
                                      const newTime = e.target.value;
                                      if (!selectedSlot) return;

                                      const newMinutes = timeToMinutes(newTime);
                                      const slotStart = timeToMinutes(
                                        selectedSlot.start
                                      );
                                      const slotEnd = timeToMinutes(
                                        selectedSlot.end
                                      );

                                      if (
                                        newMinutes >= slotStart &&
                                        newMinutes <= slotEnd
                                      ) {
                                        setRequestedTime(newTime);
                                        setFormData((prev) => ({
                                          ...prev,
                                          custom_preferred_inspection_time:
                                            newTime,
                                        }));
                                      } else {
                                        toast.error(
                                          `Time must be between ${selectedSlot.start} and ${selectedSlot.end}`
                                        );
                                      }
                                    }}
                                    min={selectedSlot?.start || ""}
                                    max={selectedSlot?.end || ""}
                                    className="text-sm h-8"
                                  />
                                  <div className="text-xs text-gray-500">
                                    Between {selectedSlot.start} -{" "}
                                    {selectedSlot.end}
                                  </div>
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
                                      setFormData((prev) => ({
                                        ...prev,
                                        custom_duration: newDuration,
                                      }));
                                      if (selectedSlot && requestedTime) {
                                        validateTimeDuration(newDuration);
                                      }
                                    }}
                                    placeholder="1.5"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">
                                    End Time
                                  </Label>
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

                          {/* Priority Selection */}
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm font-medium">
                              Priority
                            </Label>
                            <Select
                              value={priority}
                              onValueChange={(value) =>
                                setPriority(value as PriorityLevel)
                              }
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

                          {/* Save & Assign Button */}
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={handleAssignAndSave}
                              disabled={
                                createTodoLoading ||
                                loading ||
                                !selectedInspector ||
                                !date ||
                                !requestedTime ||
                                !validateRequestedTime() ||
                                !formData.lead_name ||
                                !formData.mobile_no ||
                                !formData.custom_job_type ||
                                (showReferenceInput &&
                                  !formData.custom_reference_name) ||
                                !formData.custom_budget_range ||
                                !formData.custom_project_urgency ||
                                !formData.source 
                              }
                              className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                            >
                              {createTodoLoading || loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {loading
                                    ? "Saving & Assigning..."
                                    : "Assigning..."}
                                </>
                              ) : (
                                "Save & Assign Inspector"
                              )}
                            </Button>
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700"
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
    </>
  );
};

export default InquiryForm;
