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
  X
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { frappeAPI } from "../../api/frappeClient";
import {
  useJobCardsOther,
  type JobCardOther,
  type JobCardOtherFormData,
  type Services,
} from "../../context/JobCardOtherContext";

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
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { createJobCardOther, updateJobCardOther, loading, fetchEmployees } =
    useJobCardsOther();



  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState<JobCardOtherFormData & {
    custom_property_category?: string;
    custom_emirate?: string;
    custom_area?: string;
    custom_community?: string;
    custom_street_name?: string;
    custom_property_name__number?: string;
    custom_property_area?: string;
  }>({
    date: new Date().toISOString().split("T")[0],
    building_name: "",
    property_no: "",
    area: "",
    party_name: "",
    start_date: new Date().toISOString().split("T")[0],
    finish_date: "",
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
    custom_area: "",
    custom_community: "",
    custom_street_name: "",
    custom_property_name__number: "",
    custom_property_area: "",
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

  const serviceTotal = calculateServiceTotal();

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
      setFormData({
        ...jobCard,
        date: jobCard.date || new Date().toISOString().split("T")[0],
        building_name: jobCard.building_name || "",
        property_no: jobCard.property_no || "",
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
        finish_date: jobCard.finish_date || "",
        custom_area: jobCard.custom_area || "",
        custom_emirate: jobCard.custom_emirate || "",
        custom_property_category: jobCard.custom_property_category || "",
        custom_community: jobCard.custom_community || "",
        custom_street_name: jobCard.custom_street_name || "",
        custom_property_name__number:
          jobCard.custom_property_name__number || "",
      });
      setSearchQuery(jobCard.party_name || "");
      setServices(jobCard.services || []);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        building_name: "",
        property_no: "",
        area: "",
        party_name: "",
        start_date: new Date().toISOString().split("T")[0],
        finish_date: "",
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
        custom_area: "",
        custom_community: "",
        custom_street_name: "",
        custom_property_name__number: "",
        custom_property_area: "",

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

  // Validate services when job card dates change
  useEffect(() => {
    if (formData.start_date && formData.finish_date) {
      const invalidServices = services.filter(
        (service) =>
          service.start_date &&
          service.finish_date &&
          !validateServiceDates(service)
      );

      if (invalidServices.length > 0) {
        toast.warning(
          "Some service dates are now outside the job card date range"
        );
      }
    }
  }, [
    formData.start_date,
    formData.finish_date,
    services,
    validateServiceDates,
  ]);


 const handleCustomerSearch = useCallback(async (query: string) => {
  if (!query.trim()) {
    setSearchResults([]);
    setShowDropdown(false);
    return;
  }

  setIsSearching(true);
  try {
    console.log("🔍 Starting search for query:", query);
    
    const allResults: any[] = [];
    const addressEndpoint = "/api/method/eits_app.site_address_search.search_site_addresses";

    // Search by all relevant fields
    const searchFields = [
      "custom_emirate",
      "custom_area", 
      "custom_community",
      "custom_street_name",
      "custom_property_number",
      "custom_customer_email",
      "custom_lead_email", 
      "custom_customer_phone_number",
      "custom_lead_phone_number",
      "custom_lead_customer_name"
    ];

    // Make API calls for each field
    for (const field of searchFields) {
      try {
        const url = `${addressEndpoint}?${field}=${encodeURIComponent(query)}`;
        console.log(`📡 Making API call for field ${field}:`, url);
        
        const response = await frappeAPI.makeAuthenticatedRequest("GET", url);
        console.log(`✅ Response for ${field}:`, response);

        // Check if we have data in the response
        if (response && response.message && response.message.data) {
          const responseData = response.message.data;
          console.log(`📋 Data for ${field}:`, responseData);

          if (Array.isArray(responseData) && responseData.length > 0) {
            // Transform each result
            const transformedData = responseData.map((address: any) => {
              console.log(`🔄 Transforming address:`, address);
              
              const transformed = {
                ...address,
                search_type: "address",
                found_via: field,
                customer_name: 
                  address.custom_lead_customer_name || 
                  address.lead_details?.lead_name || 
                  address.customer_details?.customer_name || 
                  "Unknown Customer",
                mobile_no:
                  address.custom_lead_phone_number ||
                  address.custom_customer_phone_number ||
                  address.lead_details?.mobile_no ||
                  address.customer_details?.mobile_no ||
                  "",
                email_id:
                  address.custom_lead_email ||
                  address.custom_customer_email ||
                  address.lead_details?.email_id ||
                  address.customer_details?.email_id ||
                  "",
                name: address.custom_lead_name || address.customer_details?.name,
                lead_name: address.custom_lead_name,
                address_details: {
                  emirate: address.custom_emirate,
                  area: address.custom_area,
                  community: address.custom_community,
                  street_name: address.custom_street_name,
                  property_number: address.custom_property_number,
                  combined_address: address.custom_combined_address || 
                    `${address.custom_emirate || ''}, ${address.custom_area || ''}, ${address.custom_community || ''}, ${address.custom_street_name || ''}, ${address.custom_property_number || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, ''),
                },
              };
              
              console.log(`✨ Transformed result:`, transformed);
              return transformed;
            });

            allResults.push(...transformedData);
            console.log(`📊 Added ${transformedData.length} results from ${field}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error searching field ${field}:`, error);
      }
    }

    console.log(`🎯 Total results before deduplication:`, allResults.length, allResults);

    // Remove duplicates
    const uniqueResults = allResults.filter(
      (result, index, self) => {
        const isDuplicate = self.findIndex(
          (r) =>
            (r.lead_name && result.lead_name && r.lead_name === result.lead_name) ||
            (r.address_details?.combined_address && 
             result.address_details?.combined_address && 
             r.address_details.combined_address === result.address_details.combined_address) ||
            (r.customer_name === result.customer_name && 
             r.mobile_no === result.mobile_no && 
             r.email_id === result.email_id)
        ) !== index;
        
        if (isDuplicate) {
          console.log(`🔄 Removing duplicate:`, result);
        }
        
        return !isDuplicate;
      }
    );

    console.log(`🎯 Unique results:`, uniqueResults.length, uniqueResults);

    // If no results found, add a "new customer" option
    if (uniqueResults.length === 0) {
      console.log(`➕ No results found, adding new customer option`);
      uniqueResults.push({
        customer_name: query,
        mobile_no: "",
        email_id: "",
        is_new_customer: true,
        search_type: "new",
      });
    }

    console.log(`📋 Final search results:`, uniqueResults);
    setSearchResults(uniqueResults);
    setShowDropdown(true);

  } catch (error) {
    console.error("❌ Overall search error:", error);
    setSearchResults([]);
    setShowDropdown(false);
    toast.error("Failed to search. Please try again.");
  } finally {
    setIsSearching(false);
  }
}, []);

// Updated handleCustomerSelect function for JobCard
const handleCustomerSelect = async (customer: any) => {
  setFetchingCustomerDetails(true);

  try {
    if (customer.is_new_customer) {
      // Handle new customer
      setFormData((prev) => ({
        ...prev,
        party_name: customer.customer_name,
        customer_id: "",
        lead_id: "",
        // Clear address fields for new customers
        building_name: "",
        property_no: "",
        area: "",
        custom_property_category: "",
        custom_emirate: "",
        custom_area: "",
        custom_community: "",
        custom_street_name: "",
        custom_property_name__number: "",
        custom_property_area: "",
      }));
      setSearchQuery(customer.customer_name);
    } else {
      // Handle existing customer/lead
      const customerData = {
        party_name: customer.customer_name || customer.name || "",
        customer_id: customer.name || "",
        lead_id: customer.lead_name || "",
        // Fill address fields from search result
        building_name: customer.custom_building_name || "",
        property_no: customer.address_details?.property_number || "",
        area: customer.address_details?.combined_address || "",
        custom_property_category: customer.custom_property_category || "",
        custom_emirate: customer.address_details?.emirate || "",
        custom_area: customer.address_details?.area || "",
        custom_community: customer.address_details?.community || "",
        custom_street_name: customer.address_details?.street_name || "",
        custom_property_name__number: customer.address_details?.property_number || "",
        custom_property_area: customer.address_details?.combined_address || "",
      };

      setFormData((prev) => ({
        ...prev,
        ...customerData,
      }));

      setSearchQuery(customer.customer_name || customer.name || "");
    }

    setShowDropdown(false);

    // If there's a lead_name, fetch additional lead details
    if (customer.lead_name && !customer.is_new_customer) {
      setFetchingLeadDetails(true);
      try {
        const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

        if (leadResponse.data) {
          const lead = leadResponse.data;
          setFormData((prev) => ({
            ...prev,
            building_name: lead.custom_building_name || prev.building_name,
            property_no: lead.custom_bulding__apartment__villa__office_number || prev.property_no,
            area: lead.custom_property_area || prev.area,
            lead_id: lead.name,
            // Update property address fields from lead data
            custom_property_category: lead.custom_property_category || prev.custom_property_category,
            custom_emirate: lead.custom_emirate || prev.custom_emirate,
            custom_area: lead.custom_area || prev.custom_area,
            custom_community: lead.custom_community || prev.custom_community,
            custom_street_name: lead.custom_street_name || prev.custom_street_name,
            custom_property_name__number: lead.custom_property_name__number || prev.custom_property_name__number,
            custom_property_area: lead.custom_property_area || prev.custom_property_area,
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
      toast.error(
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
      toast.error("Customer name is required");
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
        toast.success("Customer created successfully");
        handleCustomerSelect(response.data);
        setShowAddCustomerDialog(false);
      } else {
        throw new Error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create customer. Please try again."
      );
    } finally {
      setCreatingCustomer(false);
    }
  };

  // const handleCustomerSelect = async (customer: any) => {
  //   setFetchingCustomerDetails(true);

  //   try {
  //     setFormData((prev) => ({
  //       ...prev,
  //       party_name: customer.customer_name || customer.name || "",
  //       customer_id: customer.name,
  //     }));

  //     setSearchQuery(customer.customer_name || customer.name || "");
  //     setShowDropdown(false);

  //     if (customer.lead_name) {
  //       setFetchingLeadDetails(true);
  //       try {
  //         const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

  //         if (leadResponse.data) {
  //           const lead = leadResponse.data;
  //           setFormData((prev) => ({
  //             ...prev,
  //             building_name: lead.custom_building_name || "",
  //             property_no:
  //               lead.custom_bulding__apartment__villa__office_number || "",
  //             area: lead.custom_property_area || "",
  //             lead_id: lead.name,
  //           }));
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch lead data:", error);
  //       } finally {
  //         setFetchingLeadDetails(false);
  //       }
  //     }
  //   } finally {
  //     setFetchingCustomerDetails(false);
  //   }
  // };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      toast.error("Customer name is required");
      return false;
    }
    if (!formData.start_date) {
      toast.error("Start date is required");
      return false;
    }
    if (!formData.finish_date) {
      toast.error("Finish date is required");
      return false;
    }

    // Services validation
    if (services.length === 0) {
      toast.error("At least one service entry is required");
      return false;
    }

    // Check if all services have required fields
    const hasValidServices = services.some(
      (service) => service.work_type && service.price
    );

    if (!hasValidServices) {
      toast.error("Each service must have at least a work type and price");
      return false;
    }

    // Validate service dates
    const invalidServices = services.filter(
      (service) => !validateServiceDates(service)
    );
    if (invalidServices.length > 0) {
      toast.error("Some service dates are outside the job card date range");
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
        property_no: formData.property_no,
        building_name: formData.building_name,
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
       
        custom_emirate: formData.custom_emirate || "",
        custom_property_category: formData.custom_property_category || "",
        custom_community: formData.custom_community || "",
        custom_street_name: formData.custom_street_name || "",
        custom_property_name__number: formData.custom_property_name__number || "",
      };

      if (jobCard?.name) {
        await updateJobCardOther(jobCard.name, submissionData);
      } else {
        await createJobCardOther(submissionData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form");
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };
  const handleSelectChange = useCallback((name: string, value: string) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

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
                <p className="text-blue-100 text-sm">Other Services Details</p>
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
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
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
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"></span>
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
                      <label className="flex items-center space-x-2 text-sm md:text-base font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      {showDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                          {searchResults.length > 0 ? (
                            searchResults.map((result) => (
                              <div
                                key={
                                  result.name ||
                                  result.custom_combined_address ||
                                  result.customer_name
                                }
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleCustomerSelect(result)}
                              >
                                <p className="font-medium truncate">
                                  {result.customer_name}
                                  {result.is_new_customer && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      (New Customer)
                                    </span>
                                  )}
                                </p>
                                {(result.mobile_no || result.email_id) && (
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
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              onClick={handleAddNewCustomer}
                            >
                              <div>
                                <p className="font-medium">
                                  No customers found for "{searchQuery}"
                                </p>
                                <p className="text-xs text-gray-500">
                                  Click to add a new customer
                                </p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Add New
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                 <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <PropertyAddressSection
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                        getPropertyArea={formData.area || ""}
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
                          <Calendar className="h-4 w-4 text-gray-500" />
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
                                toast.error("Start date cannot be in the past");
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                          <Calendar className="h-4 w-4 text-gray-500" />
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
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              if (
                                formData.start_date &&
                                new Date(selectedDate) <
                                  new Date(formData.start_date)
                              ) {
                                toast.error(
                                  "Finish date cannot be before start date"
                                );
                                return;
                              }
                              setFormData((prev) => ({
                                ...prev,
                                finish_date: selectedDate,
                              }));
                            }}
                            min={
                              formData.start_date ||
                              new Date().toISOString().split("T")[0]
                            }
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    <span className="font-medium">
                      {serviceTotal.toFixed(2)} AED
                    </span>
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
                                      toast.error(
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
                                  max={formData.finish_date}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                  onChange={(e) => {
                                    if (
                                      formData.start_date &&
                                      new Date(e.target.value) <
                                        new Date(formData.start_date)
                                    ) {
                                      toast.error(
                                        "Service finish date cannot be before job start date"
                                      );
                                      return;
                                    }
                                    if (
                                      service.start_date &&
                                      new Date(e.target.value) <
                                        new Date(service.start_date)
                                    ) {
                                      toast.error(
                                        "Finish date cannot be before start date"
                                      );
                                      return;
                                    }
                                    updateService(
                                      index,
                                      "finish_date",
                                      e.target.value
                                    );
                                  }}
                                  min={
                                    formData.start_date || service.start_date
                                  }
                                  max={formData.finish_date}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>
                              {service.finish_date &&
                                !isDateInRange(service.finish_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Price - Full width */}
                          <div className="space-y-1">
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
                          </div>

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
                              className="min-h-[100px] text-md resize-none overflow-hidden w-full" // Increased min-height
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_no">Mobile Number</Label>
              <Input
                id="mobile_no"
                name="mobile_no"
                value={newCustomerData.mobile_no}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter mobile number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_id">Email (Optional)</Label>
              <Input
                id="email_id"
                name="email_id"
                value={newCustomerData.email_id || ""}
                onChange={handleNewCustomerInputChange}
                placeholder="Enter email address"
                type="email"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseCustomerDialog}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={creatingCustomer}>
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
