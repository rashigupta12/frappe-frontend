/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Calendar,
  ChevronDown,
  Home,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
// import { showToast } from "sonner";
import { frappeAPI } from "../../api/frappeClient";
import {
  useJobCardsOther,
  type JobCardOther,
  type JobCardOtherFormData,
  type Services,
} from "../../context/JobCardOtherContext";

import { handleKeyDown } from "../../helpers/helper";
import PropertyAddressSection from "../Inquiry/PropertyAddress";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { showToast } from "../../helpers/comman";

interface JobCardOtherFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCardOther | null;
}

interface NewCustomerData {
  customer_name: string;
  mobile_no: string;
  email_id?: string;
}

const JobCardOtherForm: React.FC<JobCardOtherFormProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  console.log("job card", jobCard);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { createJobCardOther, updateJobCardOther, loading, fetchEmployees } =
    useJobCardsOther();

  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<
    JobCardOtherFormData & {
      custom_property_category?: string;
      custom_emirate?: string;
      custom_uae_area?: string;
      custom_community?: string;
      custom_street_name?: string;
      custom_property_numbername?: string;
    }
  >({
    date: new Date().toISOString().split("T")[0],
    area: "",
    party_name: "",
    start_date: new Date().toISOString().split("T")[0],
    finish_date: new Date().toISOString().split("T")[0],
    prepared_by: "",
    approved_by: "",
    project_id_no: "",
    ac_v_no_and_date: "",
    services: [],
    lead_id: "",
    customer_id: "",
    custom_total_amount: "",
    custom_property_category: "",
    custom_emirate: "",
    custom_uae_area: "",
    custom_community: "",
    custom_street_name: "",
    custom_property_numbername: "",
    custom_property_type: "",
  });

  const [services, setServices] = useState<Services[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchingCustomerDetails, setFetchingCustomerDetails] = useState(false);
  const [fetchingLeadDetails, setFetchingLeadDetails] = useState(false);
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [jobTypes, setJobTypes] = useState<
    { name: string; job_type: string }[]
  >([]);
  const [loadingJobTypes, setLoadingJobTypes] = useState(false);
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    customer_name: "",
    mobile_no: "",
    email_id: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Calculate totals
  const calculateServiceTotal = () => {
    return services.reduce((total, service) => {
      const price = parseFloat(service.price) || 0;
      return total + price;
    }, 0);
  };

  // const serviceTotal = calculateServiceTotal();

  // Date validation functions
  const validateServiceDates = React.useCallback(
    (service: Services) => {
      if (!formData.start_date || !formData.finish_date) return true;

      const jobStart = new Date(formData.start_date);
      const jobFinish = new Date(formData.finish_date);
      const serviceStart = service.start_date
        ? new Date(service.start_date)
        : null;
      const serviceFinish = service.finish_date
        ? new Date(service.finish_date)
        : null;

      if (!serviceStart || !serviceFinish) return true;

      return (
        serviceStart >= jobStart &&
        serviceFinish <= jobFinish &&
        serviceStart <= serviceFinish
      );
    },
    [formData.start_date, formData.finish_date]
  );

  const isDateInRange = (date: string) => {
    if (!formData.start_date || !formData.finish_date) return true;

    const jobStart = new Date(formData.start_date);
    const jobFinish = new Date(formData.finish_date);
    const checkDate = new Date(date);

    return checkDate >= jobStart && checkDate <= jobFinish;
  };

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      console.log("Loading existing job card data:", jobCard);
      setFormData({
        ...jobCard,
        date: jobCard.date || new Date().toISOString().split("T")[0],
        area: jobCard.area || "",
        party_name: jobCard.party_name || "",
        approved_by: jobCard.approved_by || "",
        project_id_no: jobCard.project_id_no || "",
        ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
        services: jobCard.services || [],
        lead_id: (jobCard as any).lead_id || "",
        customer_id: (jobCard as any).customer_id || "",
        start_date:
          jobCard.start_date || new Date().toISOString().split("T")[0],
        finish_date:
          jobCard.finish_date || new Date().toISOString().split("T")[0],
        // FIX: Ensure all custom fields are properly mapped
        custom_uae_area: jobCard.custom_uae_area || "",
        custom_emirate: jobCard.custom_emirate || "",
        custom_property_category: jobCard.custom_property_category || "",
        custom_community: jobCard.custom_community || "",
        custom_street_name: jobCard.custom_street_name || "",
        custom_property_numbername: jobCard.custom_property_numbername || "",
        custom_property_type: jobCard.custom_property_type || "",
      });
      setSearchQuery(jobCard.party_name || "");
      setServices(jobCard.services || []);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        area: "",
        party_name: "",
        start_date: new Date().toISOString().split("T")[0],
        finish_date: new Date().toISOString().split("T")[0],
        prepared_by: "",
        approved_by: "",
        project_id_no: "",
        ac_v_no_and_date: "",
        services: [],
        lead_id: "",
        customer_id: "",
        custom_total_amount: "",
        custom_property_category: "",
        custom_emirate: "",
        custom_uae_area: "",
        custom_community: "",
        custom_street_name: "",
        custom_property_numbername: "",
        custom_property_type: "",
      });
      setSearchQuery("");
      setServices([]);
    }
  }, [jobCard, isOpen]);

  // Fetch job types
  useEffect(() => {
    const fetchJobTypes = async () => {
      setLoadingJobTypes(true);
      try {
        const response = await frappeAPI.getJobTypes();
        setJobTypes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch job types:", error);
      } finally {
        setLoadingJobTypes(false);
      }
    };

    fetchJobTypes();
  }, []);

  // Add this function after the calculateServiceTotal function
  const calculateJobFinishDate = useCallback(() => {
    if (services.length === 0) return formData.start_date;

    const serviceDates = services
      .map((service) => service.finish_date)
      .filter((date) => date && date.trim() !== "");

    if (serviceDates.length === 0) return formData.start_date;

    // Find the latest finish date
    const latestDate = serviceDates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });

    return latestDate;
  }, [services, formData.start_date]);

  // Replace the existing date validation useEffect with this:
  useEffect(() => {
    if (services.length > 0) {
      const calculatedFinishDate = calculateJobFinishDate();
      if (calculatedFinishDate !== formData.finish_date) {
        setFormData((prev) => ({
          ...prev,
          finish_date: calculatedFinishDate,
        }));
      }
    }
  }, [services, calculateJobFinishDate]);

  const handleCustomerSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.site_address_search.search_site_addresses_customers_only?search_term=${encodeURIComponent(
          query
        )}`
      );
      console.log("Search response:", response);

      // Check if response structure is correct
      if (!response.message?.data) {
        throw new Error("Invalid response structure");
      }

      const results = response.message.data;

      // Transform the results
      const transformedResults = results.map((result: any) => {
        // Extract customer/lead name from site_name (format: "Name-Number,...")
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
            combined_address: result.site_name,
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
      // Only show error if it's not a empty query case
      if (query.trim()) {
        showToast.error("Failed to search. Please try again.");
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setNewCustomerData((prev) => ({ ...prev, mobile_no: "+971 " }));
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

    setNewCustomerData((prev) => ({ ...prev, mobile_no: formattedNumber }));
  };

  // Updated handleCustomerSelect function for JobCard
  const handleCustomerSelect = async (customer: any) => {
    console.log("Selected customer:", customer);
    setFetchingCustomerDetails(true);

    try {
      if (customer.is_new_customer) {
        // Handle new customer
        setFormData((prev) => ({
          ...prev,
          party_name: customer.customer_name,
          customer_id: "",
          lead_id: "",
          area: "",
          custom_property_category: "",
          custom_emirate: "",
          custom_uae_area: "",
          custom_community: "",
          custom_street_name: "",
          custom_property_numbername: "",
          custom_property_type: "",
        }));
        setSearchQuery(customer.customer_name);
      } else {
        // Handle existing customer/lead
        const customerData = {
          party_name:
            customer.customer_name || customer.lead_details?.lead_name || "",
          customer_id: customer.customer_details?.name || "",
          lead_id: customer.lead_details?.name || "",
          area: customer.site_name || "",
          custom_property_category: customer.custom_property_category || "",
          custom_emirate: customer.custom_emirate || "",
          custom_uae_area: customer.custom_area || "",
          custom_community: customer.custom_community || "",
          custom_street_name: customer.custom_street_name || "",
          custom_property_numbername: customer.custom_property_number || "",
          custom_property_type: customer.custom_property_type || "",
        };

        setFormData((prev) => ({
          ...prev,
          ...customerData,
        }));

        setSearchQuery(
          customer.customer_name || customer.lead_details?.lead_name || ""
        );
      }

      setShowDropdown(false);

      // If there's a lead, fetch additional lead details
      if (customer.lead_details?.name && !customer.is_new_customer) {
        setFetchingLeadDetails(true);
        try {
          const leadResponse = await frappeAPI.getLeadById(
            customer.lead_details.name
          );

          if (leadResponse.data) {
            const lead = leadResponse.data;
            setFormData((prev) => ({
              ...prev,
              area: lead.custom_property_area || prev.area,
              lead_id: lead.name,
              custom_property_category:
                lead.custom_property_category || prev.custom_property_category,
              custom_emirate: lead.custom_emirate || prev.custom_emirate,
              custom_uae_area: lead.custom_area || prev.custom_uae_area,
              custom_community: lead.custom_community || prev.custom_community,
              custom_street_name:
                lead.custom_street_name || prev.custom_street_name,
              custom_property_numbername:
                lead.custom_property_numbername ||
                prev.custom_property_numbername,
              custom_property_type:
                lead.custom_property_type || prev.custom_property_type,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch lead data:", error);
        } finally {
          setFetchingLeadDetails(false);
        }
      }
    } finally {
      setFetchingCustomerDetails(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === "") {
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
        lead_id: "",
      }));
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length > 0) {
      setSearchTimeout(
        setTimeout(() => {
          handleCustomerSearch(query);
        }, 300)
      );
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleCloseCustomerDialog = () => {
    setShowAddCustomerDialog(false);
    if (!formData.customer_id && !formData.lead_id) {
      showToast.error(
        "Please select a customer to proceed with receipt submission"
      );
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (searchQuery === "") {
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
        lead_id: "",
      }));
    }
  }, [searchQuery]);

  const handleAddNewCustomer = () => {
    setNewCustomerData({
      customer_name:
        /^\d+$/.test(searchQuery) || searchQuery.includes("@")
          ? ""
          : searchQuery,
      mobile_no: /^\d+$/.test(searchQuery) ? searchQuery : "",
      email_id: searchQuery.includes("@") ? searchQuery : "",
    });
    setShowAddCustomerDialog(true);
    setShowDropdown(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.customer_name) {
      showToast.error("Customer name is required");
      return;
    }

    setCreatingCustomer(true);
    try {
      const response = await frappeAPI.createCustomer({
        customer_name: newCustomerData.customer_name,
        mobile_no: newCustomerData.mobile_no,
        email_id: newCustomerData.email_id || "",
      });

      if (response.data) {
        showToast.success("Customer created successfully");
        handleCustomerSelect(response.data);
        setShowAddCustomerDialog(false);
      } else {
        throw new Error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      showToast.error("Failed to create customer. Please try again.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleNewCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const addService = () => {
    const newService: Services = {
      work_type: "",
      work_description: "",
      start_date: formData.start_date || "",
      finish_date: formData.finish_date || "",
      price: "",
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (
    index: number,
    field: keyof Services,
    value: string
  ) => {
    setServices((prev) =>
      prev.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    );
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (!formData.party_name) {
      showToast.error("Customer name is required");
      return false;
    }
    if (!formData.start_date) {
      showToast.error("Start date is required");
      return false;
    }
    if (!formData.finish_date) {
      showToast.error("Finish date is required");
      return false;
    }

    // Services validation
    if (services.length === 0) {
      showToast.error("At least one service entry is required");
      return false;
    }

    // Check if all services have required fields
    const hasValidServices = services.some((service) => service.work_type);

    if (!hasValidServices) {
      showToast.error("Each service must have at least a work type and price");
      return false;
    }

    // Validate service dates
    const invalidServices = services.filter(
      (service) => !validateServiceDates(service)
    );
    if (invalidServices.length > 0) {
      showToast.error("Some service dates are outside the job card date range");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submissionData: JobCardOtherFormData = {
        date: formData.date,
        party_name: formData.party_name,
        area: formData.area,
        start_date: formData.start_date,
        finish_date: formData.finish_date,
        prepared_by: formData.prepared_by || "",
        approved_by: formData.approved_by || "",
        project_id_no: formData.project_id_no || "",
        ac_v_no_and_date: formData.ac_v_no_and_date || "",
        services: services,
        lead_id: formData.lead_id || "",
        customer_id: formData.customer_id || "",
        custom_total_amount: calculateServiceTotal().toString(),

        // FIX: Ensure all custom fields are included in submission
        custom_emirate: formData.custom_emirate || "",
        custom_uae_area: formData.custom_uae_area || "", // Make sure this is included
        custom_property_category: formData.custom_property_category || "",
        custom_community: formData.custom_community || "",
        custom_street_name: formData.custom_street_name || "",
        custom_property_numbername: formData.custom_property_numbername || "",
        custom_property_type: formData.custom_property_type || "",
      };

      console.log("Submitting job card data:", submissionData);

      if (jobCard?.name) {
        await updateJobCardOther(jobCard.name, submissionData);
      } else {
        await createJobCardOther(submissionData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      showToast.error("Failed to submit form");
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };

  // FIX: Add debug logging for handleSelectChange
  const handleSelectChange = useCallback((name: string, value: string) => {
    console.log(`handleSelectChange called: ${name} = ${value}`);
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      console.log("Updated formData:", newData);
      return newData;
    });
  }, []);
  const extractCustomerNameFromSite = (siteName: string) => {
    if (!siteName) return "Unknown";
    // Format: "Name-Number,..." - extract everything before the first dash and number
    const parts = siteName.split("-");
    if (parts.length >= 2) {
      // Check if the part after dash starts with a number
      const afterDash = parts[1];
      if (/^\d/.test(afterDash)) {
        return parts[0].trim();
      }
    }
    // Fallback: take first part before comma
    return siteName.split(",")[0].trim();
  };

  // Helper function to extract address from site_name (remove customer name part)
  const extractAddressFromSite = (siteName: string) => {
    if (!siteName) return "";
    // Format: "Name-Number,..." - extract everything after the first dash
    const dashIndex = siteName.indexOf("-");
    if (dashIndex !== -1) {
      const afterDash = siteName.substring(dashIndex + 1);
      // Check if what comes after dash starts with a number (address part)
      if (/^\d/.test(afterDash)) {
        return afterDash.trim();
      }
    }
    // Fallback: return original if pattern doesn't match
    return siteName;
  };
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 sm:inset-4 sm:rounded-xl lg:inset-y-4 lg:right-0 w-full lg:max-w-6xl bg-white shadow-2xl sm:border border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="bg-cyan-500 text-white shadow-lg transform scale-105  hover:blue-600 p-4 sm:rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {jobCard ? "Edit Job Card" : "New Job Card"}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                  {formData.project_id_no && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-blue-100">Project ID:</span>
                      <span className="text-sm font-medium">
                        {formData.project_id_no}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white font-medium">
                      Date:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="bg-blue-50  px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Basic Information
                      </h4>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                        isBasicInfoExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                <div
                  className={`transition-all px-6 duration-300 ease-in-out ${
                    isBasicInfoExpanded
                      ? "opacity-100 max-h-[1500px] py-4"
                      : "opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Customer Search - Full width on mobile, spans 2 cols on md, 1 col on lg */}
                    <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="flex items-center space-x-2 text-sm md:text-base font-medium text-black mb-2">
                        <User className="h-4 w-4 text-black" />
                        <span>
                          Customer{" "}
                          <span className="text-gray-500">
                            (name/email/phone)
                          </span>
                          <span className="text-red-500 ml-1">*</span>
                        </span>
                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </label>
                      <div className="relative">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search by name, phone, or email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10 capitalize"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      {showDropdown && (
                        <>
                          {/* Backdrop to handle clicks outside */}
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setShowDropdown(false)}
                          />

                          {/* Dropdown content with higher z-index */}
                          <div className="absolute z-[9999] mt-1 w-full bg-white shadow-xl rounded-md border border-gray-300 max-h-80 overflow-y-auto pb-40">
                            {searchResults.length > 0 ? (
                              searchResults.map((result, index) => {
                                // Extract customer name properly
                                const customerName =
                                  result.customer_name ||
                                  result.lead_details?.lead_name ||
                                  extractCustomerNameFromSite(result.site_name);

                                return (
                                  <div
                                    key={`search-result-${index}`}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                                    onClick={() => handleCustomerSelect(result)}
                                  >
                                    <div className="flex justify-between items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        {" "}
                                        {/* min-w-0 prevents flex item from overflowing */}
                                        <p className="font-medium text-gray-900 truncate text-sm">
                                          {customerName}
                                        </p>
                                        {/* Contact info */}
                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                          {result.mobile_no && (
                                            <span className="inline-flex items-center gap-1">
                                              <Phone className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate">
                                                {result.mobile_no}
                                              </span>
                                            </span>
                                          )}
                                          {result.email_id && (
                                            <span className="inline-flex items-center gap-1">
                                              <Mail className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate max-w-[150px]">
                                                {result.email_id}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                        {/* Address info with proper text wrapping */}
                                        {result.site_name && (
                                          <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                                            <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="break-words text-xs leading-tight">
                                                {extractAddressFromSite(
                                                  result.site_name
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                        {/* Match info badges */}
                                        {/* {result.match_info?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.match_info.slice(0, 2).map((match, i) => ( // Limit to 2 badges
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                <span className="truncate max-w-[80px]">
                                  {match.display_name}: {match.value}
                                </span>
                              </span>
                            ))}
                            {result.match_info.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{result.match_info.length - 2} more
                              </span>
                            )}
                          </div>
                        )} */}
                                      </div>

                                      {/* Status badge - fixed width to prevent layout shift */}
                                      {/* <div className="flex-shrink-0 w-16">
                                        {result.lead_details ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            Lead
                                          </span>
                                        ) : result.customer_details ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Customer
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            Address
                                          </span>
                                        )}
                                      </div> */}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors duration-150"
                                onClick={handleAddNewCustomer}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-700 text-sm">
                                    No results found for "{searchQuery}"
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Click to add a new customer
                                  </p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  Add New
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <PropertyAddressSection
                        formData={formData}
                        // handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        // getPropertyArea={formData.area || ""}
                        fieldNames={{
                          propertyNumber: "custom_property_numbername",
                          emirate: "custom_emirate",
                          area: "custom_uae_area",
                          community: "custom_community",
                          streetName: "custom_street_name",
                          propertyArea: "area",
                          propertyCategory: "custom_property_category",
                          propertyType: "custom_property_type",
                        }}
                      />
                    </div>
                    {/* Date Range - Full width on mobile, spans 2 cols on larger screens */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 col-span-1 md:col-span-2 lg:col-span-3">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="start_date"
                          className="flex items-center space-x-2"
                        >
                          <Calendar className="h-4 w-4 text-black" />
                          <span>
                            Start Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="start_date"
                            name="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              if (
                                new Date(selectedDate) <
                                new Date(new Date().toISOString().split("T")[0])
                              ) {
                                showToast.error("Start date cannot be in the past");
                                return;
                              }
                              setFormData((prev) => ({
                                ...prev,
                                start_date: selectedDate,
                                // Clear finish date if it's now invalid
                                ...(formData.finish_date &&
                                new Date(formData.finish_date) <
                                  new Date(selectedDate)
                                  ? { finish_date: "" }
                                  : {}),
                              }));
                            }}
                            min={new Date().toISOString().split("T")[0]}
                            required
                            className="w-full rounded-md border border-gray-300 px-2 py-2 text-md text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Finish Date */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="finish_date"
                          className="flex items-center space-x-2"
                        >
                          <Calendar className="h-4 w-4 text-black" />
                          <span>
                            Finish Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="finish_date"
                            name="finish_date"
                            type="date"
                            value={
                              formData.finish_date || formData.start_date || ""
                            }
                            readOnly // Add this to make it read-only
                            className="w-full rounded-md border border-gray-300 px-2 py-2 text-md text-gray-900 shadow-sm bg-gray-50 cursor-not-allowed" // Add bg-gray-50 and cursor-not-allowed
                          />
                          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Services
                    </h4>
                    {/* <span className="font-medium">
                      {serviceTotal.toFixed(2)} AED
                    </span> */}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {services.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No services added yet.</p>
                    </div>
                  ) : (
                    services.map((service, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          {/* Work Type - Full width */}
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-gray-600">
                              Work Type
                            </Label>
                            {loadingJobTypes ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin h-4 w-4" />
                                <span className="text-sm">
                                  Loading job types...
                                </span>
                              </div>
                            ) : (
                              <Select
                                value={service.work_type}
                                onValueChange={(value) =>
                                  updateService(index, "work_type", value)
                                }
                              >
                                <SelectTrigger className="h-9 text-sm w-full">
                                  <SelectValue placeholder="Select work type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white min-w-[300px]">
                                  {jobTypes
                                    .filter(
                                      (jobType) =>
                                        jobType.name !== "8. Veneer Pressing"
                                    )
                                    .map((jobType) => (
                                      <SelectItem
                                        key={jobType.name}
                                        value={jobType.name}
                                        className="truncate"
                                      >
                                        {jobType.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Date Range - Side by side on desktop */}
                          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                            {/* Service Start Date */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">
                                Start Date
                              </Label>
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={service.start_date}
                                  onChange={(e) => {
                                    if (
                                      formData.finish_date &&
                                      new Date(e.target.value) >
                                        new Date(formData.finish_date)
                                    ) {
                                      showToast.error(
                                        "Service start date cannot be after job finish date"
                                      );
                                      return;
                                    }
                                    updateService(
                                      index,
                                      "start_date",
                                      e.target.value
                                    );
                                  }}
                                  min={formData.start_date}
                                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                              {service.start_date &&
                                !isDateInRange(service.start_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )}
                            </div>

                            {/* Service Finish Date */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">
                                Finish Date
                              </Label>
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={
                                    service.finish_date ||
                                    service.start_date ||
                                    ""
                                  }
                                  // In the Service Finish Date input, replace the onChange handler:
                                  onChange={(e) => {
                                    if (
                                      service.start_date &&
                                      new Date(e.target.value) <
                                        new Date(service.start_date)
                                    ) {
                                      showToast.error(
                                        "Finish date cannot be before start date"
                                      );
                                      return;
                                    }
                                    updateService(
                                      index,
                                      "finish_date",
                                      e.target.value
                                    );
                                    // Remove the job card date range validation from here
                                  }}
                                  min={
                                    formData.start_date || service.start_date
                                  }
                                  className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                              {/* {service.finish_date &&
                                !isDateInRange(service.finish_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )} */}
                            </div>
                          </div>

                          {/* Price - Full width */}
                          {/* <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600">
                              Price
                            </Label>
                            <div className="flex rounded-md border border-gray-300 overflow-hidden">
                              <Input
                                placeholder="0.00"
                                type="number"
                                value={service.price || ""}
                                onChange={(e) =>
                                  updateService(index, "price", e.target.value)
                                }
                                className="h-9 text-sm border-none focus:ring-0 rounded-none flex-1"
                              />
                              <span className="inline-flex items-center px-2 bg-gray-50 text-gray-500 text-sm border-l">
                                AED
                              </span>
                            </div>
                          </div> */}

                          {/* Work Description - Full width */}
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-600">
                              Work Description
                            </Label>
                            <Textarea
                              placeholder="Enter detailed work description"
                              value={service.work_description}
                              onChange={(e) => {
                                updateService(
                                  index,
                                  "work_description",
                                  e.target.value
                                );
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                              }}
                              className="min-h-[100px] text-md resize-none overflow-hidden w-full capitalize" // Increased min-height
                              rows={3} // Set default rows to 3
                              onKeyDown={(e) => {
                                // Allow Enter key to create new lines
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </div>

                          {/* Delete Button - Right aligned */}
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setServiceToDelete(index);
                                setShowCancelDialog(true);
                              }}
                              className="h-10 w-10 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button
                    type="button"
                    onClick={addService}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex flex-row justify-end gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    className="px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base min-w-[120px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 sm:px-8 sm:py-3 bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg text-sm sm:text-base min-w-[160px]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="whitespace-nowrap">Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="whitespace-nowrap">
                          {jobCard ? "Update Job Card" : "Create Job Card"}
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {serviceToDelete !== null ? "Delete Service?" : "Are you sure?"}
            </DialogTitle>
            <DialogDescription>
              {serviceToDelete !== null
                ? "This service will be permanently deleted."
                : "Any unsaved changes will be lost. Do you want to continue?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setServiceToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (serviceToDelete !== null) {
                  removeService(serviceToDelete);
                  setServiceToDelete(null);
                } else {
                  handleConfirmCancel();
                }
                setShowCancelDialog(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog
        open={showAddCustomerDialog}
        onOpenChange={setShowAddCustomerDialog}
      >
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new customer.
            </DialogDescription>
            <button
              onClick={handleCloseCustomerDialog}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={newCustomerData.customer_name}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter customer name"
                required
                className="capitalize"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                name="mobile_no"
                value={newCustomerData.mobile_no}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="+971 XX XXX XXXX"
                maxLength={17}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="email_id">Email</Label>
              <Input
                type="email_id"
                name="email_id"
                value={newCustomerData.email_id}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter email"
                className="w-full"
              />
              {/* Error message */}
              {newCustomerData.email_id && (
                <>
                  {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    newCustomerData.email_id
                  ) && (
                    <p className="text-sm text-red-500 mt-1">
                      Must be a valid email format (example: user@example.com)
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseCustomerDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              {creatingCustomer ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {creatingCustomer ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCardOtherForm;
