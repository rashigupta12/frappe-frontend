/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
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
    inspectors,
    inspectorsLoading,
    createTodo,
    createTodoLoading,
    error: assignError,
    success: assignSuccess,
  } = useAssignStore();

  const [activeSection, setActiveSection] = useState<string>("contact");
  const [phoneNumber, setPhoneNumber] = useState("+971 ");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    ...defaultFormData,
  });
  const [showReferenceInput, setShowReferenceInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [showNewCustomerFields, setShowNewCustomerFields] = useState(false);
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
          return { ...section, completed: !!inspectorEmail };
        default:
          return section;
      }
    });
  }, [formData, showReferenceInput, inspectorEmail]);

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
    }
  }, [inquiry, hasFetchedInitialData]);

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setPhoneNumber("+971 ");
    setInspectorEmail("");
    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
    setShowReferenceInput(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
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

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date || null }));
  };

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
    if (!inspectorEmail) {
      toast.error("Please select an inspector");
      return;
    }
    if (!date) {
      toast.error("Please select an inspection date");
      return;
    }
    if (!priority) {
      toast.error("Please select a priority");
      return;
    }
    if (!formData.custom_preferred_inspection_time) {
      toast.error("Please select a preferred inspection time");
      return;
    }

    try {
      const inquiryName = await saveLead();
      if (!inquiryName) {
        toast.error("Failed to save inquiry");
        return;
      }

      const preferredDate = format(date, "yyyy-MM-dd");
      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiryName,
        inspector_email: inspectorEmail,
        description: formData.custom_special_requirements || "",
        priority: priority,
        preferred_date: preferredDate,
      });

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

  const handleCustomerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setShowNewCustomerFields(false); // Hide new customer fields when search is empty
      return;
    }
    setIsSearching(true);
    try {
      const allResults: any[] = [];
      const addressEndpoint =
        "/api/method/eits_app.site_address_search.search_site_addresses";
      const queryLower = query.toLowerCase().trim();

      const searchPromises: Promise<any>[] = [];

      if (queryLower.length >= 2) {
        // ... (all your existing search logic remains the same) ...
        // Existing search promises for addresses
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_area=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "area",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "area", data: [] }))
        );
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_community=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "community",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "community", data: [] }))
        );
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_street_name=${encodeURIComponent(
                query
              )}`
            )
            .then((response) => ({
              type: "street",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "street", data: [] }))
        );

        // --- NEW: Search by Customer Name and Lead Name ---
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?customer_name=${encodeURIComponent(query)}`
            )
            .then((response) => ({
              type: "customer_name",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "customer_name", data: [] }))
        );
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
        // Always search, whether partial or full email
        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_customer_email=${encodeURIComponent(
                query
              )}`
            )
            .then((response) => ({
              type: "customer_email",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "customer_email", data: [] }))
        );

        searchPromises.push(
          frappeAPI
            .makeAuthenticatedRequest(
              "GET",
              `${addressEndpoint}?custom_lead_email=${encodeURIComponent(
                query
              )}`
            )
            .then((response) => ({
              type: "lead_email",
              data: response.message?.data || [],
            }))
            .catch(() => ({ type: "lead_email", data: [] }))
        );
        // --- END NEW ---

        if (/^\d+$/.test(query)) {
          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_property_number=${encodeURIComponent(
                  query
                )}`
              )
              .then((response) => ({
                type: "property",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "property", data: [] }))
          );
        }

        if (/^\+?\d+$/.test(query.replace(/[\s-]/g, ""))) {
          const cleanPhone = query.replace(/[\s-]/g, "");
          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_customer_phone_number=${encodeURIComponent(
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
                `${addressEndpoint}?custom_lead_phone_number=${encodeURIComponent(
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

        const knownEmirates = [
          "dubai",
          "abu dhabi",
          "sharjah",
          "ajman",
          "umm al quwain",
          "ras al khaimah",
          "fujairah",
        ];
        if (
          knownEmirates.some(
            (emirate) =>
              emirate.includes(queryLower) ||
              queryLower.includes(emirate.replace(/\s/g, "")) ||
              emirate.toLowerCase() === queryLower
          )
        ) {
          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_emirate=${encodeURIComponent(query)}`
              )
              .then((response) => ({
                type: "emirate",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "emirate", data: [] }))
          );
        }

        const searchResults = await Promise.all(searchPromises);

        searchResults.forEach((result) => {
          if (result.data && Array.isArray(result.data)) {
            const transformedData = result.data.map((address: any) => ({
              ...address,
              search_type: "address",
              found_via: result.type,
              customer_name:
                address.customer_details?.customer_name ||
                address.lead_details?.lead_name ||
                `Address: ${address.custom_combined_address}`,
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
              // building_name: "",
              // property_no: address.custom_property_number,
              area: address.custom_combined_address,
              address_details: {
                emirate: address.custom_emirate,
                area: address.custom_area,
                community: address.custom_community,
                street_name: address.custom_street_name,
                property_number: address.custom_property_number,
                combined_address: address.custom_combined_address,
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
              r.custom_combined_address === result.custom_combined_address ||
              (r.custom_lead_name &&
                result.custom_lead_name &&
                r.custom_lead_name === result.custom_lead_name) ||
              (r.site_name &&
                result.site_name &&
                r.site_name === result.site_name)
          )
        );
      });

      setSearchResults(uniqueResults);
      setShowDropdown(true);

      // CRITICAL: Show new customer fields when no results are found
      if (uniqueResults.length === 0) {
        setShowNewCustomerFields(true);
      } else {
        setShowNewCustomerFields(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(true);
      setShowNewCustomerFields(true); // Show new customer fields on error (no results)
      toast.error("Failed to search addresses. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCustomerSelect = async (result: any) => {
    setFetchingCustomerDetails(true);
    setShowNewCustomerFields(false); // Always hide new fields when an existing customer is selected

    try {
      if (result.is_new_customer) {
        // Logic for creating a new customer
        setFormData({
          ...formData,
          new_customer_name: result.customer_name || searchQuery,
          new_customer_phone: result.mobile_no || "",
          new_customer_email: result.email_id || "",
          // Clear existing customer fields
          customer_id: "",
          lead_id: "",
          lead_name: "",
          mobile_no: "",
          email_id: "",
          // Clear address fields for a new customer
          custom_property_area: "",
          custom_emirate: "",
          custom_community: "",
          custom_area: "",
          custom_street_name: "",
          custom_property_name__number: "",
        });
        setShowNewCustomerFields(true);
        setSearchQuery(result.customer_name || searchQuery);
      } else {
        // Logic for selecting an existing customer
        const customerData = {
          lead_name: result.customer_name,
          email_id: result.email_id || "",
          mobile_no: result.mobile_no || "+971 ",
          customer_id: result.name || "",
          lead_id: result.custom_lead_name || "",
          custom_property_area: result.custom_combined_address || "",
          custom_emirate: result.custom_emirate || "",
          custom_community: result.custom_community || "",
          custom_area: result.custom_area || "",
          custom_street_name: result.custom_street_name || "",
          custom_property_name__number: result.custom_property_number || "",
        };
        setFormData((prev) => ({
          ...prev,
          ...customerData,
          // Reset new customer fields just in case
          new_customer_name: "",
          new_customer_phone: "",
          new_customer_email: "",
        }));

        // Set the search bar text to the selected customer's name
        setSearchQuery(result.customer_name);

        // We might need to hide the dropdown and the "new customer" fields
        setShowNewCustomerFields(false);
      }
    } finally {
      setFetchingCustomerDetails(false);
      setShowDropdown(false);
    }
  };

  const handleCreateNewCustomer = () => {
    setShowNewCustomerFields(true);
    setShowDropdown(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Immediately hide dropdown and new customer fields if search is empty
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      setShowNewCustomerFields(false);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
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
                                  (name/email/phone/address)
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
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search by name, phone, email or address"
                                required
                                className="pr-10"
                              />
                              {isSearching && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                              )}
                            </div>

                            {showDropdown && (
                              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                  searchResults.map((result, index) => (
                                    <div
                                      key={`search-result-${index}`}
                                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() =>
                                        handleCustomerSelect(result)
                                      }
                                    >
                                      <p className="font-medium truncate">
                                        {result.customer_name}
                                        {result.is_new_customer && (
                                          <span className="ml-2 text-xs text-gray-500">
                                            (New Customer)
                                          </span>
                                        )}
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
                                      {result.custom_combined_address && (
                                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                                          <Home className="h-3 w-3 mr-1 flex-shrink-0" />
                                          <span className="truncate">
                                            {result.custom_combined_address}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div
                                    key="no-results"
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                    onClick={handleCreateNewCustomer} // Add this click handler
                                  >
                                    <div>
                                      <p className="font-medium">
                                        No customers found for "{searchQuery}"
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Please create a new customer.
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {showNewCustomerFields || formData.lead_name ? (
                            <>
                              <div className="col-span-1">
                                <Label
                                  htmlFor="lead_name"
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Customer Name{" "}
                                  <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="lead_name"
                                  name="lead_name"
                                  value={formData.lead_name || ""}
                                  onChange={handleInputChange}
                                  placeholder="Enter customer name"
                                  required
                                />
                              </div>

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
                          ) : null}
                          {/* --- */}

                          {/* Existing fields (source of inquiry, etc.) */}
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
                          // handleInputChange={handleInputChange}
                          handleSelectChange={handleSelectChange}
                          // getPropertyArea={formData.custom_property_area || ""}
                        />
                      )}

                      {section.id === "additional" && (
                        <div>
                          <div className="grid grid-cols-12 gap-4 mb-2">
                            <div className="col-span-6">
                              <Label className="text-sm font-medium text-gray-700">
                                Preferred Date
                              </Label>
                              <div className="relative">
                                <Input
                                  type="date"
                                  min={new Date().toISOString().split("T")[0]}
                                  value={
                                    date
                                      ? format(date, "yyyy-MM-dd")
                                      : formData.custom_preferred_inspection_date
                                      ? new Date(
                                          formData.custom_preferred_inspection_date
                                        )
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const selectedDate = e.target.value
                                      ? new Date(e.target.value)
                                      : undefined;
                                    setDate(selectedDate);
                                    handleDateChange(
                                      "custom_preferred_inspection_date",
                                      selectedDate
                                    );
                                  }}
                                  className="w-full pr-10"
                                />
                                <div
                                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                                  onClick={() => {
                                    const input = document.querySelector(
                                      'input[type="date"]'
                                    ) as HTMLInputElement;
                                    if (input) {
                                      input.focus();
                                      if (
                                        "showPicker" in input &&
                                        typeof input.showPicker === "function"
                                      ) {
                                        input.showPicker();
                                      }
                                    }
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </div>
                              </div>
                            </div>

                            <div className="col-span-6">
                              <Label
                                htmlFor="custom_preferred_inspection_time"
                                className="text-sm font-medium text-gray-700"
                              >
                                Time
                              </Label>
                              <div className="relative">
                                <Input
                                  type="time"
                                  id="custom_preferred_inspection_time"
                                  name="custom_preferred_inspection_time"
                                  value={
                                    formData.custom_preferred_inspection_time ||
                                    getCurrentTime()
                                  }
                                  onChange={handleInputChange}
                                  className="w-full pr-10"
                                />
                                <div
                                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                                  onClick={() => {
                                    const input = document.querySelector(
                                      'input[type="time"]'
                                    ) as HTMLInputElement;
                                    if (input) {
                                      input.focus();
                                      if (
                                        "showPicker" in input &&
                                        typeof input.showPicker === "function"
                                      ) {
                                        input.showPicker();
                                      }
                                    }
                                  }}
                                >
                                  <Clock className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor="custom_special_requirements"
                              className="text-sm font-medium text-gray-700"
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
                            <div className="text-red-500 text-sm">
                              {assignError}
                            </div>
                          )}
                          {assignSuccess && (
                            <div className="text-emerald-500 text-sm">
                              Inspector assigned successfully!
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-gray-700 text-sm font-medium">
                              Select Inspector
                            </Label>
                            <Select
                              value={inspectorEmail}
                              onValueChange={setInspectorEmail}
                              disabled={inspectorsLoading}
                            >
                              <SelectTrigger className="w-full bg-white border border-gray-300">
                                <SelectValue placeholder="Select an inspector" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-300 max-h-[200px]">
                                {inspectors.map((inspector) => (
                                  <SelectItem
                                    key={inspector.full_name ?? inspector.name}
                                    value={inspector.name ?? ""}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{inspector.full_name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
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
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-gray-700 text-sm font-medium">
                                Inspection Date
                              </Label>
                              <div className="relative">
                                <input
                                  type="date"
                                  min={new Date().toISOString().split("T")[0]}
                                  value={
                                    date
                                      ? format(date, "yyyy-MM-dd")
                                      : formData.custom_preferred_inspection_date
                                      ? new Date(
                                          formData.custom_preferred_inspection_date
                                        )
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const selectedDate = e.target.value
                                      ? new Date(e.target.value)
                                      : undefined;
                                    setDate(selectedDate);
                                    handleDateChange(
                                      "custom_preferred_inspection_date",
                                      selectedDate
                                    );
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  style={{
                                    WebkitAppearance: "none",
                                    MozAppearance: "textfield",
                                  }}
                                />
                                {/* Custom Calendar Icon - Clickable */}
                                <div
                                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                                  onClick={() => {
                                    const input = document.querySelector(
                                      'input[type="date"]'
                                    ) as HTMLInputElement;
                                    if (input) {
                                      input.focus();
                                      if (
                                        "showPicker" in input &&
                                        typeof input.showPicker === "function"
                                      ) {
                                        input.showPicker();
                                      }
                                    }
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={handleAssignAndSave}
                              disabled={
                                createTodoLoading ||
                                loading ||
                                !inspectorEmail ||
                                !date ||
                                !formData.lead_name ||
                                !formData.mobile_no ||
                                !formData.custom_job_type ||
                                (showReferenceInput &&
                                  !formData.custom_reference_name) ||
                                !formData.custom_budget_range ||
                                !formData.custom_project_urgency ||
                                !formData.source ||
                                (formData.source === "Reference" &&
                                  !formData.custom_reference_name) ||
                                !formData.custom_property_area ||
                                !formData.custom_preferred_inspection_time
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
