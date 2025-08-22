/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
  Loader2,
  Mail,
  Phone,
  Save,
  Search,
  User,
  UserPen,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  capitalizeFirstLetter,
  convertJobTypesToFormFormat,
  defaultFormData,
  extractAddressFromSite,
  extractNameFromQuery,
  extractPhoneFromQuery,
  formatSubmissionData,
  getCurrentTime,
  handleKeyDown,
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
import { ConfirmationModal } from "./ConfirmationModal";
import { MultiSelectJobTypes } from "./MultiselectJobtypes";
import PropertyAddressSection from "./PropertyAddress";
import { RestrictedTimeClock } from "./ResticritedtimeSlot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { createPortal } from "react-dom";
import type {
  CustomerSearchResult,
  InspectorAvailability,
  NewCustomerFormData,
  PriorityLevel,
} from "../../types/inquiryFormdata";

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
    id: "inspector",
    title: "Assign Inspector",
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

  const [activeSection, setActiveSection] = useState<string>("contact");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    ...defaultFormData,
  });
  const [showReferenceInput, setShowReferenceInput] = useState(false);

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
  const customerModalRef = useRef<HTMLDivElement>(null);

  // Inspector assignment states
  const [selectedInspector, setSelectedInspector] =
    useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [requestedTime, setRequestedTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEndTimeWarning, setShowEndTimeWarning] = useState(false);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        case "inspector":
          return { ...section, completed: !!selectedInspector };
        default:
          return section;
      }
    });
  }, [formData, showReferenceInput, selectedInspector, selectedCustomer]);

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

  useEffect(() => {
    if (requestedTime && duration) {
      const endTime = calculateEndTime();
      if (endTime) {
        const [hours, minutes] = endTime.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes;

        // Check if end time is after 18:00 (6:00 PM)
        if (totalMinutes > 18 * 60) {
          setShowEndTimeWarning(true);
        } else {
          setShowEndTimeWarning(false);
        }
      }
    }
  }, [requestedTime, duration]);
  // Replace the existing useEffect for inquiry loading
  useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_jobtype: convertJobTypesToFormFormat(inquiry.custom_jobtype), // Use helper
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

      // Set selected customer from inquiry data
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

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setSelectedCustomer(null);
    setSelectedInspector(null);
    setSelectedSlot(null);
    setRequestedTime("");
    setDuration("0.5");
    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
    setShowReferenceInput(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setShowAvailabilityModal(false);
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
    // Customer Details validation
    if (!selectedCustomer) {
      toast.error("Customer selection is required");
      return false;
    }

    if (!formData.custom_jobtype || formData.custom_jobtype.length === 0) {
      toast.error("At least one job type is required");
      return false;
    }
    return true;
  };

  const saveLead = async (): Promise<string | undefined> => {
    try {
      let submissionData = formatSubmissionData(formData);

      // For new inquiries, ensure we use the locally stored customer data
      if (!inquiry && selectedCustomer) {
        submissionData = {
          ...submissionData,
          lead_name: selectedCustomer.customer_name,
          email_id: selectedCustomer.email_id || "",
          mobile_no: selectedCustomer.mobile_no || "+971 ",
        };
      }

      // Check if we already have a lead ID (either from inquiry prop or from newly created lead)
      const existingLeadId = inquiry?.name || formData.name;

      if (existingLeadId) {
        // For updates, fetch fresh document to avoid TimestampMismatchError
        try {
          const freshLead = await frappeAPI.makeAuthenticatedRequest(
            "GET",
            `/api/resource/Lead/${existingLeadId}`
          );

          if (freshLead?.data) {
            // Merge fresh data with our changes
            submissionData = {
              ...freshLead.data, // Start with fresh data including timestamps
              ...submissionData, // Apply our changes
            };

            // Remove any undefined fields
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

        // Update existing lead
        const updatedLead = await updateLead(existingLeadId, submissionData);

        // Convert API response format back to form format (string[])
        const convertedJobTypes = Array.isArray(updatedLead.custom_jobtype)
          ? updatedLead.custom_jobtype.map((item: any) =>
              typeof item === "string" ? item : item.job_type
            )
          : formData.custom_jobtype || [];

        // Update formData with proper type conversion
        setFormData((prev) => ({
          ...prev,
          ...updatedLead,
          custom_jobtype: convertedJobTypes, // Ensure this is string[]
          custom_preferred_inspection_date:
            updatedLead.custom_preferred_inspection_date
              ? new Date(updatedLead.custom_preferred_inspection_date)
              : prev.custom_preferred_inspection_date,
        }));

        toast.success("Inquiry updated successfully!");
        return existingLeadId;
      } else {
        // Create new lead only if we don't have an ID
        const newInquiry = await createLead(submissionData);

        // Convert API response format back to form format (string[])
        const convertedJobTypes = Array.isArray(newInquiry.custom_jobtype)
          ? newInquiry.custom_jobtype.map((item: any) =>
              typeof item === "string" ? item : item.job_type
            )
          : formData.custom_jobtype || [];

        // Update formData with the new lead ID and fresh data
        setFormData((prev) => ({
          ...prev,
          ...newInquiry,
          name: newInquiry.name,
          custom_jobtype: convertedJobTypes, // Ensure this is string[]
          custom_preferred_inspection_date:
            newInquiry.custom_preferred_inspection_date
              ? new Date(newInquiry.custom_preferred_inspection_date)
              : prev.custom_preferred_inspection_date,
        }));

        toast.success("Inquiry created successfully!");
        return newInquiry.name;
      }
    } catch (err) {
      console.error("Error saving lead:", err);

      // // Handle specific timestamp errors
      // let errorMessage = "Failed to save inquiry. Please try again.";
      // if (err && typeof err === "object" && "message" in err) {
      //   const errorMsg = (err as { message: string }).message;
      //   if (errorMsg.includes("TimestampMismatchError") || errorMsg.includes("Document has been modified")) {
      //     errorMessage = "The document has been modified. Please refresh the form and try again.";
      //   }
      // }

      toast.error("Failed to save inquiry. Please try again.");
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only validate on submit
    if (!validateForm()) return;

    try {
      // For new inquiries, ensure we use the locally stored customer data
      let submissionData = formatSubmissionData(formData);

      // If this is a new inquiry and we have selected customer data, use it
      if (!inquiry && selectedCustomer) {
        submissionData = {
          ...submissionData,
          lead_name: selectedCustomer.customer_name,
          email_id: selectedCustomer.email_id || "",
          mobile_no: selectedCustomer.mobile_no || "+971 ",
        };
      }

      const existingLeadId = inquiry?.name || formData.name;

      if (existingLeadId) {
        // Update existing lead
        await updateLead(existingLeadId, submissionData);
        toast.success("Inquiry updated successfully!");
      } else {
        // Create new lead
        const newInquiry = await createLead(submissionData);
        toast.success("Inquiry created successfully!");

        // Update formData with the new lead ID
        setFormData((prev) => ({
          ...prev,
          name: newInquiry.name,
        }));
      }

      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error("Failed to create inquiry. Please try again.");
    }
  };

  const handleAssignAndSave = () => {
    // Validate form fields and show specific error messages
    if (!selectedCustomer) {
      toast.error(
        "Please complete customer details: Customer selection is required"
      );
      setActiveSection("contact");
      return;
    }

    if (!formData.custom_jobtype || formData.custom_jobtype.length === 0) {
      toast.error(
        "Please complete job details: At least one job type is required"
      );
      setActiveSection("job");
      return;
    }

    if (!formData.custom_budget_range) {
      toast.error("Please complete job details: Budget range is required");
      setActiveSection("job");
      return;
    }

    if (!formData.custom_project_urgency) {
      toast.error("Please complete job details: Project urgency is required");
      setActiveSection("job");
      return;
    }

    if (!formData.source) {
      toast.error(
        "Please complete customer details: Source of inquiry is required"
      );
      setActiveSection("contact");
      return;
    }

    if (
      (formData.source === "Reference" ||
        formData.source === "Supplier Reference") &&
      !formData.custom_reference_name
    ) {
      toast.error(
        "Please complete customer details: Reference name is required"
      );
      setActiveSection("contact");
      return;
    }

    // Property validation
    if (!formData.custom_property_name__number) {
      toast.error(
        "Please complete property details: Property number is required"
      );
      setActiveSection("property");
      return;
    }

    if (!formData.custom_property_category) {
      toast.error(
        "Please complete property details: Property category is required"
      );
      setActiveSection("property");
      return;
    }

    if (!formData.custom_property_area) {
      toast.error(
        "Please complete property details: Property area is required"
      );
      setActiveSection("property");
      return;
    }

    if (!formData.custom_street_name) {
      toast.error("Please complete property details: Street name is required");
      setActiveSection("property");
      return;
    }

    if (!formData.custom_emirate) {
      toast.error("Please complete property details: Emirate is required");
      setActiveSection("property");
      return;
    }

    if (!formData.custom_community) {
      toast.error("Please complete property details: Community is required");
      setActiveSection("property");
      return;
    }

    if (!formData.custom_area) {
      toast.error("Please complete property details: Area is required");
      setActiveSection("property");
      return;
    }

    // Inspector assignment validation
    if (!selectedInspector) {
      toast.error("Please select an inspector for assignment");
      setActiveSection("inspector");
      return;
    }

    if (!date) {
      toast.error("Please select an inspection date");
      setActiveSection("inspector");
      return;
    }

    if (!requestedTime) {
      toast.error("Please enter the requested inspection time");
      setActiveSection("inspector");
      return;
    }

    if (!validateRequestedTime()) {
      toast.error(
        `Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`
      );
      setActiveSection("inspector");
      return;
    }

    // Check if end time is after 18:00 and show warning instead of proceeding
    const endTime = calculateEndTime();
    if (endTime) {
      const [hours, minutes] = endTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes > 18 * 60) {
        toast.error(
          "Inspection cannot end after 6:00 PM. Please adjust the start time or duration."
        );
        setShowEndTimeWarning(true);
        setActiveSection("inspector");
        return;
      }
    }

    // If all validations pass, show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    setShowConfirmModal(false);

    try {
      // Get the lead ID - either from existing inquiry or from formData
      const existingLeadId = inquiry?.name || formData.name;

      let inquiryName: string;

      if (existingLeadId) {
        // If we already have a lead ID, just update it
        const submissionData = formatSubmissionData(formData);
        await updateLead(existingLeadId, submissionData);
        inquiryName = existingLeadId;
        toast.success("Inquiry updated successfully!");
      } else {
        // Only create new lead if we don't have an ID (shouldn't happen if saveNewCustomer worked correctly)
        const savedLeadName = await saveLead();
        if (!savedLeadName) {
          toast.error("Failed to save inquiry");
          return;
        }
        inquiryName = savedLeadName;
      }

      const preferredDate = format(date!, "yyyy-MM-dd");
      const endTime = calculateEndTime();
      const startDateTime = `${preferredDate} ${requestedTime}:00`;
      const endDateTime = `${preferredDate} ${endTime}:00`;

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

      // Rest of the assignment logic remains the same...
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
      toast.error(`Failed to complete assignment`);
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
              result.custom_combine_address ||
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

    // Update form data with customer information
    setFormData((prev) => ({
      ...prev,
      lead_name: result.customer_name,
      email_id: result.email_id || "",
      mobile_no: result.mobile_no || "+971 ",
      customer_id: result.name || "",
      lead_id: result.lead_name || "",
    }));

    // If address details are available, populate property fields
    if (result.address_details) {
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
        custom_property_area: result.address_details?.combined_address || "",
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
      toast.error("Customer name is required");
      return;
    }

    if (!customerForm.phone || customerForm.phone.length < 5) {
      toast.error("Valid mobile number is required");
      return;
    }

    try {
      setIsCreatingCustomer(true);

      // For new inquiries, just update local state without creating/updating lead
      if (!inquiry) {
        const updatedCustomer = {
          customer_name: customerForm.name.trim(),
          mobile_no: customerForm.phone,
          email_id: customerForm.email || "",
          name: selectedCustomer?.name || "",
          lead_name: selectedCustomer?.lead_name || "",
        };

        setSelectedCustomer(updatedCustomer);
        setSearchQuery(updatedCustomer.customer_name);

        // Update form data locally - ensure custom_jobtype is string[]
        setFormData((prev) => ({
          ...prev,
          lead_name: updatedCustomer.customer_name,
          email_id: updatedCustomer.email_id,
          mobile_no: updatedCustomer.mobile_no,
          custom_jobtype: customerForm.jobType, // This is already string[]
        }));

        setShowCustomerModal(false);
        setCustomerForm({
          name: "",
          email: "",
          phone: "+971 ",
          jobType: [],
        });

        toast.success(`Customer details updated`);
        return;
      }

      // For existing inquiries, update the lead
      const leadId = formData.name || selectedCustomer?.name;
      if (!leadId) {
        throw new Error("No lead ID found for update");
      }

      // Fetch fresh document before updating
      const freshLead = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Lead/${leadId}`
      );

      if (!freshLead?.data) {
        throw new Error("Could not fetch fresh lead data");
      }

      // Convert jobType array to the format expected by the API
      const apiJobTypeFormat = customerForm.jobType.map((jobType) => ({
        job_type: jobType,
      }));

      const newLeadData = {
        ...freshLead.data,
        lead_name: customerForm.name.trim(),
        email_id: customerForm.email || "",
        mobile_no: customerForm.phone,
        custom_jobtype: apiJobTypeFormat, // Use API format
      };

      // Remove undefined fields
      Object.keys(newLeadData).forEach((key) => {
        if (newLeadData[key] === undefined) {
          delete newLeadData[key];
        }
      });

      let updatedLead;
      if (modalMode === "create") {
        const formattedData = formatSubmissionData({
          lead_name: customerForm.name.trim(),
          email_id: customerForm.email || "",
          mobile_no: customerForm.phone,
          custom_jobtype: customerForm.jobType, // Helper will convert to API format
          custom_budget_range: "",
          custom_project_urgency: "",
          source: "",
          custom_property_name__number: "",
          custom_emirate: "",
          custom_area: "",
          custom_community: "",
          custom_street_name: "",
          custom_property_area: "",
          custom_property_category: "",
          custom_special_requirements: "",
        });
        updatedLead = await createLead(formattedData);
      } else {
        updatedLead = await updateLead(leadId, newLeadData);
      }

      if (!updatedLead) {
        throw new Error("Failed to save lead");
      }

      // Convert API response format back to form format (string[])
      const convertedJobTypes = Array.isArray(updatedLead.custom_jobtype)
        ? updatedLead.custom_jobtype.map((item: any) =>
            typeof item === "string" ? item : item.job_type
          )
        : customerForm.jobType;

      // Update formData with proper type conversion
      setFormData((prev: LeadFormData) => ({
        ...prev,
        ...updatedLead,
        custom_jobtype: convertedJobTypes, // Ensure this is string[]
        custom_preferred_inspection_date:
          updatedLead.custom_preferred_inspection_date
            ? new Date(updatedLead.custom_preferred_inspection_date)
            : prev.custom_preferred_inspection_date,
      }));

      // Update date if it exists
      if (updatedLead.custom_preferred_inspection_date) {
        setDate(new Date(updatedLead.custom_preferred_inspection_date));
      }

      // Update reference input visibility
      setShowReferenceInput(
        updatedLead.source === "Reference" ||
          updatedLead.source === "Supplier Reference"
      );

      // Update the selected customer with new data
      const updatedCustomer = {
        customer_name: updatedLead.lead_name || customerForm.name,
        mobile_no: updatedLead.mobile_no || customerForm.phone,
        email_id: updatedLead.email_id || customerForm.email,
        name: updatedLead.name,
        lead_name: updatedLead.name,
      };

      setSelectedCustomer(updatedCustomer);
      setSearchQuery(updatedCustomer.customer_name);

      setShowCustomerModal(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "+971 ",
        jobType: [],
      });

      toast.success(
        `Customer "${updatedCustomer.customer_name}" updated successfully!`
      );
    } catch (error) {
      console.error("Error saving lead:", error);

      toast.error("Failed to save customer");
    } finally {
      setIsCreatingCustomer(false);
    }
  };
  const validateRequestedTime = () => {
    if (!requestedTime || !selectedSlot) return false;

    const requestedMinutes = timeToMinutes(requestedTime);
    const slotStartMinutes = timeToMinutes(selectedSlot.start);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);
    const durationMinutes = Math.round(parseFloat(duration) * 60);

    // Check if requested time is within slot
    if (
      requestedMinutes < slotStartMinutes ||
      requestedMinutes >= slotEndMinutes
    ) {
      return false;
    }

    // Check if duration fits within the remaining slot time
    if (requestedMinutes + durationMinutes > slotEndMinutes) {
      return false;
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

  const handleInspectorSelect = (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
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

  // Update dropdown position when shown
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
      // If customer modal is open and click is outside customer modal, don't close
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
  }, [showCustomerModal]); // Add showCustomerModal as dependency

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
    >
      {isSearching ? (
        <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Searching customers...
        </div>
      ) : searchResults.length > 0 ? (
        <div className="overflow-y-auto max-h-[calc(60vh-100px)]">
          {searchResults.map((result, index) => (
            <div
              key={`customer-result-${index}`}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCustomerSelect(result)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium truncate text-gray-900">
                    {result.customer_name}
                  </p>
                  {(result.mobile_no || result.email_id) && (
                    <div className="text-xs text-gray-500 space-x-2 mt-1">
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
                  {result.site_name && (
                    <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                      <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-xs leading-tight">
                          {extractAddressFromSite(result.site_name)}
                        </p>
                      </div>
                    </div>
                  )}
                  {(result.address_details?.property_category ||
                    result.address_details?.property_type) && (
                    <div className="mt-2 flex gap-2">
                      {result.address_details?.property_category && (
                        <span className="inline-flex items-center px-2 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Building className="h-3 w-3 mr-1" />
                          {result.address_details.property_category}
                        </span>
                      )}
                      {result.address_details?.property_type && (
                        <span className="inline-flex items-center px-2 rounded-full text-xs bg-green-100 text-green-800">
                          {result.address_details.property_type}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-t border-gray-100"
            onClick={handleOpenCreateModal}
          >
            <div>
              <p className="text-xs text-gray-500">
                Click to add a new customer
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
              Add New
            </span>
          </div>
        </div>
      ) : searchQuery ? (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          onClick={handleOpenCreateModal}
        >
          <div>
            <p className="font-medium">No customer found for "{searchQuery}"</p>
            <p className="text-xs text-gray-500">Click to add a new customer</p>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
            Add New
          </span>
        </div>
      ) : null}
    </div>
  );

  if (!isOpen) return null;

  const handleCancelSaveCustomer = () => {
    if (confirm("Are you sure you want to discard changes?")) {
      setShowCustomerModal(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={() => {
          // Don't close if customer modal is open
          if (!showCustomerModal) {
            handleClose();
          }
        }}
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
                type="button"
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
                              className="text-gray-700"
                            >
                              <div className="flex items-center gap-2 text-base font-medium">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>
                                  Customer{" "}
                                  <span className="text-gray-500 font-normal">
                                    (name/email/phone)
                                  </span>
                                  <span className="text-red-500 ml-1">*</span>
                                </span>
                              </div>
                            </Label>

                            <div className="relative">
                              {selectedCustomer ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between ">
                                  <div className="flex-1 text-sm">
                                    <span className="font-medium">
                                      {capitalizeFirstLetter(
                                        selectedCustomer.customer_name
                                      )}
                                    </span>
                                    {selectedCustomer.mobile_no && (
                                      <span className="text-gray-500">
                                        {" "}
                                        | {selectedCustomer.mobile_no}
                                      </span>
                                    )}
                                    {selectedCustomer.email_id && (
                                      <span className="text-gray-500">
                                        {" "}
                                        | {selectedCustomer.email_id}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={handleOpenEditModal}
                                      className="p-1 hover:bg-gray-200 rounded"
                                      title="Edit customer"
                                    >
                                      <UserPen className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleClearCustomer}
                                      className="p-1 hover:bg-gray-200 rounded"
                                      title="Clear customer"
                                    >
                                      <X className="h-4 w-4 text-gray-600" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <Search className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
                                  <Input
                                    ref={inputRef}
                                    id="customer_search"
                                    name="customer_search"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search by name, phone or email"
                                    required
                                    className="pl-9 pr-10"
                                    onFocus={() => {
                                      if (searchQuery && !showDropdown) {
                                        searchCustomers(searchQuery);
                                      }
                                    }}
                                  />
                                  {isSearching && (
                                    <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-gray-500" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Render dropdown as portal */}
                            {showDropdown &&
                              typeof document !== "undefined" &&
                              createPortal(<DropdownContent />, document.body)}
                          </div>

                          <div className="col-span-1 md:col-span-2">
                            <Label
                              htmlFor="source"
                              className="text-md font-medium text-gray-700 mb-1"
                            >
                              Source Of Inquiry{" "}
                            </Label>
                            <Select
                              value={formData.source || ""}
                              onValueChange={(value) => {
                                handleSelectChange("source", value);
                              }}
                            >
                              <SelectTrigger className="w-full text-md">
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
                                  className="text-md font-medium text-gray-700"
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
                          <div className="space-y-2">
                            <Label className="text-md font-medium text-gray-700 mb-1">
                              Job Types <span className="text-red-500">*</span>
                            </Label>
                            <MultiSelectJobTypes
                              jobTypes={jobTypes}
                              selectedJobTypes={formData.custom_jobtype || []}
                              onSelectionChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  custom_jobtype: selected,
                                }));
                              }}
                              placeholder="Select job types"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="custom_budget_range"
                              className="text-md font-medium text-gray-700 mb-1"
                            >
                              Budget Range{" "}
                            </Label>
                            <Select
                              value={formData.custom_budget_range || ""}
                              onValueChange={(value) =>
                                handleSelectChange("custom_budget_range", value)
                              }
                            >
                              <SelectTrigger className="w-full text-md">
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
                            <Label className="text-md font-medium text-gray-700 mb-1">
                              Project Urgency{" "}
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
                              <SelectTrigger className="w-full text-md ">
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
                            area: "custom_area",
                            community: "custom_community",
                            streetName: "custom_street_name",
                            propertyArea: "custom_property_area",
                            propertyCategory: "custom_property_category",
                            propertyType: "custom_property_type",
                          }}
                        />
                      )}

                      {section.id === "inspector" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-md font-medium mb-1">
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
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm appearance-none"
                              />
                              <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          {date && (
                            <div className="space-y-2">
                              {/* <Label className="text-gray-700 text-md font-medium mb-1">
                                Inspector Selected
                              </Label> */}
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
                                  <div className="text-md font-medium text-black">
                                    Select inspector
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowAvailabilityModal(true)}
                                >
                                  {selectedInspector ? (
                                    <UserPen className="w-4 h-4 text-black" />
                                  ) : (
                                    <UserPlus className="w-3 h-3 text-black" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {selectedInspector &&
                            selectedInspector.availability.free_slots.length >
                              0 && (
                              <div className="space-y-2 px-5 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <Label className="text-gray-700 text-md font-medium mb-1">
                                  Available Time Slots
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {selectedInspector.availability.free_slots.map(
                                    (slot, index) => (
                                      <Button
                                        type="button"
                                        key={index}
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
                                      </Button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {selectedSlot && (
                            <div className="space-y-3 p-3 ">
                              <Label className="text-gray-700 text-md font-medium mb-1">
                                Finalize Time & Duration
                              </Label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1 time-picker-container">
                                  <Label className="text-xs text-gray-600">
                                    Start Time *
                                  </Label>
                                  <RestrictedTimeClock
                                    value={requestedTime}
                                    onChange={(time) => {
                                      setRequestedTime(time);
                                      setFormData((prev) => ({
                                        ...prev,
                                        custom_preferred_inspection_time: time,
                                      }));
                                    }}
                                    minTime={selectedSlot.start}
                                    maxTime={selectedSlot.end}
                                    className="text-sm h-8"
                                    selectedDate={date}
                                  />
                                </div>

                                <div className="space-y-1 w-full">
                                  <Label className="text-xs text-gray-600">
                                    Duration *
                                  </Label>
                                  <div className="flex w-full ">
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0.5"
                                      max={(() => {
                                        if (!selectedSlot || !requestedTime)
                                          return 8;
                                        const requestedMinutes =
                                          timeToMinutes(requestedTime);
                                        const slotEndMinutes = timeToMinutes(
                                          selectedSlot.end
                                        );
                                        const remainingMinutes =
                                          slotEndMinutes - requestedMinutes;
                                        const maxHours = remainingMinutes / 60;
                                        return Math.max(
                                          0.5,
                                          Math.floor(maxHours * 2) / 2
                                        );
                                      })()}
                                      value={duration}
                                      onChange={(e) => {
                                        const newDuration = e.target.value;
                                        setDuration(newDuration);
                                        setFormData((prev) => ({
                                          ...prev,
                                          custom_duration: newDuration,
                                        }));
                                      }}
                                      placeholder="1.5"
                                      className="text-sm h-8 rounded-r-none "
                                    />
                                    <span className="flex items-center justify-center px-3 text-xs text-gray-700 border border-l-0 rounded-r-md bg-gray-50">
                                      Hrs
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">
                                    End Time
                                  </Label>
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
                          <div className="space-y-2">
                            <Label className="text-gray-700 text-md font-medium mb-1">
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
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={handleAssignAndSave}
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
              <div>
                <div className="px-2">
                  <Label
                    htmlFor="custom_special_requirements"
                    className="text-md mb-1 font-medium text-gray-700"
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

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent
          className="sm:max-w-[500px] bg-white"
          ref={customerModalRef}
          onInteractOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add New Lead" : "Edit Lead"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Fill in the details to add a new lead"
                : "Update the lead details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    name: capitalizeFirstLetter(e.target.value),
                  }))
                }
                placeholder="Enter customer name"
                required
                disabled={isCreatingCustomer}
              />
            </div>

            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                name="phone"
                value={customerForm.phone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="+971 XX XXX XXXX"
                maxLength={17}
                required
                disabled={isCreatingCustomer}
              />
            </div>

            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Email
              </Label>
              <Input
                type="email"
                name="email"
                value={customerForm.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomerForm((prev) => ({
                    ...prev,
                    email: value,
                  }));
                }}
                placeholder="Enter email"
                disabled={isCreatingCustomer}
              />

              {/* Error message */}
              {customerForm.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email) && (
                  <p className="text-sm text-red-500 mt-1">
                    Invalid email format
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Job Types <span className="text-red-500">*</span>
              </Label>
              <MultiSelectJobTypes
                jobTypes={jobTypes}
                selectedJobTypes={customerForm.jobType}
                onSelectionChange={(selected: string[]) => {
                  setCustomerForm((prev) => ({
                    ...prev,
                    jobType: selected,
                  }));
                }}
                placeholder="Select job types"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelSaveCustomer}
              disabled={isCreatingCustomer}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modalMode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : modalMode === "create" ? (
                "Save Lead"
              ) : (
                "Update Lead"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEndTimeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">End Time Warning</h3>
              <button
                onClick={() => setShowEndTimeWarning(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-gray-700">
              The calculated end time ({calculateEndTime()}) is after 6:00 PM.
              Time shouldn't extend beyond 6:00 PM.
            </p>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowEndTimeWarning(false)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                OK, I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmAssignment}
        onCancel={() => setShowConfirmModal(false)}
        title="Confirm Inspector Assignment"
        message={`Are you sure to assign ${
          selectedInspector?.user_name
        } for the inspection on ${
          date ? format(date, "MMM dd, yyyy") : ""
        } at ${requestedTime}? Once assigned, customer details cannot be modified for this inquiry.`}
      />
    </>
  );
};

export default InquiryForm;
