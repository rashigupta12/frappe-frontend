/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Building,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { frappeAPI } from "../../api/frappeClient";
import {
  useJobCardsOther,
  type JobCardOther,
  type JobCardOtherFormData,
  type Services,
} from "../../context/JobCardOtherContext";
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

  const [formData, setFormData] = useState<JobCardOtherFormData>({
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
        toast.error("Failed to load job types");
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
      let response;

      if (/^\d+$/.test(query)) {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?mobile_no=${query}`
        );
      } else if (query.includes("@")) {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?email_id=${query}`
        );
      } else {
        response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.customer_search.search_customers?customer_name=${query}`
        );
      }

      if (!response.message || !Array.isArray(response.message.data)) {
        throw new Error("Invalid response format");
      }

      const customers = response.message.data;
      setShowDropdown(true);

      if (customers.length === 0) {
        setSearchResults([]);
        return;
      }

      const detailedCustomers = await Promise.all(
        customers.map(async (customer: { name: any }) => {
          try {
            const customerDetails = await frappeAPI.getCustomerById(
              customer.name
            );
            return customerDetails.data;
          } catch (error) {
            console.error(
              `Failed to fetch details for customer ${customer.name}:`,
              error
            );
            return null;
          }
        })
      );

      const validCustomers = detailedCustomers.filter(
        (customer) => customer !== null
      );

      setSearchResults(validCustomers);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

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

  const handleCustomerSelect = async (customer: any) => {
    setFetchingCustomerDetails(true);

    try {
      setFormData((prev) => ({
        ...prev,
        party_name: customer.customer_name || customer.name || "",
        customer_id: customer.name,
      }));

      setSearchQuery(customer.customer_name || customer.name || "");
      setShowDropdown(false);

      if (customer.lead_name) {
        setFetchingLeadDetails(true);
        try {
          const leadResponse = await frappeAPI.getLeadById(customer.lead_name);

          if (leadResponse.data) {
            const lead = leadResponse.data;
            setFormData((prev) => ({
              ...prev,
              building_name: lead.custom_building_name || "",
              property_no:
                lead.custom_bulding__apartment__villa__office_number || "",
              area: lead.custom_property_area || "",
              lead_id: lead.name,
            }));
            toast.success("Customer and property details loaded!");
          }
        } catch (error) {
          console.error("Failed to fetch lead data:", error);
          toast.error("Loaded customer but failed to fetch property details");
        } finally {
          setFetchingLeadDetails(false);
        }
      } else {
        toast.success("Customer loaded (no property details found)");
      }
    } finally {
      setFetchingCustomerDetails(false);
    }
  };

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
    if (services.length === 0) {
      toast.error("At least one service entry is required");
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
        custom_total_amount: calculateServiceTotal().toString(), // Add this line

      };

      if (jobCard?.name) {
        await updateJobCardOther(jobCard.name, submissionData);
      } else {
        await createJobCardOther(submissionData);
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    onClose();
  };



  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
        onClick={onClose}
      />

      <div
        className="fixed inset-0 sm:inset-y-0 sm:right-0 w-full sm:max-w-6xl bg-white shadow-2xl sm:border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-4">
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
                <div className="flex items-center space-x-6 mt-1">
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
          <div className="max-w-5xl mx-auto p-3 space-y-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Basic Information
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {isBasicInfoExpanded ? "Expanded" : "Collapsed"}
                      </span>
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
                      ? "opacity-100 max-h-[1500px]"
                      : "opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 pt-2 relative">
                      <Label
                        htmlFor="party_name"
                        className="flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <label className="block text-sm font-medium text-gray-700">
                          Customer{" "}
                          <span className="text-gray-500">
                            (name / email / phone)
                          </span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>

                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Search by name, phone, or email"
                          required
                          className="focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>

                      {showDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {searchResults.length > 0 ? (
                            searchResults.map((customer) => (
                              <div
                                key={customer.name}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <div>
                                  <p className="font-medium">
                                    {customer.customer_name || customer.name}
                                  </p>
                                  <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                                    {customer.mobile_no && (
                                      <span className="flex items-center">
                                        <Phone className="h-3 w-3 mr-1" />
                                        {customer.mobile_no}
                                      </span>
                                    )}
                                    {customer.email_id && (
                                      <span className="flex items-center">
                                        <Mail className="h-3 w-3 mr-1" />
                                        {customer.email_id}
                                      </span>
                                    )}
                                    {customer.lead_name && (
                                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
                                        Has Property
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Select
                                </span>
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

                    <div className="space-y-2">
                      <Label
                        htmlFor="building_name"
                        className="flex items-center space-x-2"
                      >
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>Building Name</span>
                      </Label>
                      <Input
                        id="building_name"
                        name="building_name"
                        value={formData.building_name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter building name"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_no">Property No</Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no || ""}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="area"
                        className="flex items-center space-x-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>Area</span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area || ""}
                        onChange={handleInputChange}
                        placeholder="Enter area"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex pb-4 flex-wrap gap-2">
                      <div className="w-[48%] space-y-1">
                        <Label
                          htmlFor="start_date"
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            Start Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <Input
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>

                      <div className="w-[48%] space-y-1">
                        <Label
                          htmlFor="finish_date"
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>
                            Finish Date <span className="text-red-500">*</span>
                          </span>
                        </Label>
                        <Input
                          id="finish_date"
                          name="finish_date"
                          type="date"
                          value={formData.finish_date || ""}
                          onChange={(e) => {
                            if (
                              formData.start_date &&
                              new Date(e.target.value) <
                                new Date(formData.start_date)
                            ) {
                              toast.error(
                                "Finish date cannot be before start date"
                              );
                              return;
                            }
                            handleInputChange(e);
                          }}
                          min={formData.start_date}
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between space-x-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Services
                    </h4>
                    <span className="pt-1">{serviceTotal.toFixed(2)} AED</span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {services.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <p className="text-sm">No services added yet.</p>
                    </div>
                  ) : (
                    services.map((service, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 w-full">
                              <Label className="text-xs font-medium text-gray-600">
                                Work Type
                              </Label>
                              {loadingJobTypes ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="animate-spin h-4 w-4" />
                                  <span className="text-sm">
                                    Loading work types...
                                  </span>
                                </div>
                              ) : (
                                <Select
                                  value={service.work_type}
                                  onValueChange={(value) =>
                                    updateService(index, "work_type", value)
                                  }
                                >
                                  <SelectTrigger className="h-9 text-sm w-full truncate sm:max-w-xs">
                                    <SelectValue placeholder="Select work type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white max-w-full sm:max-w-xs">
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
                              )}
                            </div>
                          </div>

                          <div className="flex w-full gap-2">
                            <div className="space-y-1 w-1/2">
                              <Label className="text-sm font-medium text-gray-600">
                                Start Date
                              </Label>
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
                                className="h-10"
                              />
                              {service.start_date &&
                                !isDateInRange(service.start_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )}
                            </div>

                            <div className="space-y-1 w-1/2">
                              <Label className="text-sm font-medium text-gray-600">
                                Finish Date
                              </Label>
                              <Input
                                type="date"
                                value={service.finish_date}
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
                                min={formData.start_date || service.start_date}
                                max={formData.finish_date}
                                className="h-10"
                              />
                              {service.finish_date &&
                                !isDateInRange(service.finish_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="w-[100%]">
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
                                style={{
                                  WebkitAppearance: "none",
                                  MozAppearance: "textfield",
                                }}
                              />
                              <span className="inline-flex items-center px-2 bg-gray-50 text-gray-500 text-sm border-l">
                                AED
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 w-full">
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
                              className="min-h-[40px] text-md resize-none overflow-hidden"
                              rows={1}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
  type="button"
  variant="destructive"
  size="sm"
  onClick={() => {
    setServiceToDelete(index); // Set the index of service to delete
    setShowCancelDialog(true); // Show confirmation dialog
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
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelClick}
                    className="px-8 py-3 order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg order-1 sm:order-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-5 w-5" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        {jobCard ? "Update Job Card" : "Create Job Card"}
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

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
      <Button variant="outline" onClick={() => {
        setShowCancelDialog(false);
        setServiceToDelete(null);
      }}>
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
            <Button
              variant="outline"
              onClick={() => setShowAddCustomerDialog(false)}
            >
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
