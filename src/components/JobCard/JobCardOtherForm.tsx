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
import { useLeads } from "../../context/LeadContext"; // Import LeadContext for address functionality
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

  // Add address-related hooks from LeadContext
  const {
    emirates,
    cities,
    areas,
    fetchEmirates,
    fetchCities,
    fetchAreas,
    addressLoading,
  } = useLeads();

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
 const [selectedEmirate, setSelectedEmirate] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [showOtherAreaInput, setShowOtherAreaInput] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Add address state variables
 

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

  // Load emirates on component mount
  useEffect(() => {
    fetchEmirates();
  }, [fetchEmirates]);

  // Function to combine address components into a single string
  const combineAddress = useCallback(
    (emirate: string, city: string, area: string): string => {
      const addressParts = [area, city, emirate].filter(
        (part) => part && part.trim() !== ""
      );

      return addressParts.join(", ");
    },
    []
  );

  // Parse and prefill address components when formData.area changes
// Replace the existing address parsing useEffect with this corrected version

useEffect(() => {
  if (formData.area && !hasPrefilled && emirates.length > 0) {
    const parts = formData.area.split(",").map((part: string) => part.trim());

    // Address format: "area, city, emirate" (Al Satwa, Dubai, Dubai)
    if (parts.length >= 3) {
      const area = parts[0]; // First part is area (Al Satwa)
      const city = parts[1]; // Second part is city (Dubai)
      const emirate = parts[2]; // Third part is emirate (Dubai)

      console.log("Parsed address:", { area, city, emirate });

      // Set the emirate if it exists in the emirates list
      const foundEmirate = emirates.find(
        (e) => e.name.toLowerCase() === emirate.toLowerCase()
      );
      
      if (foundEmirate) {
        setSelectedEmirate(foundEmirate.name);

        // Fetch cities for this emirate and then process
        fetchCities(foundEmirate.name).then(() => {
          // Use a longer timeout to ensure cities are loaded
          setTimeout(() => {
            const foundCity = cities.find(
              (c) => c.name.toLowerCase() === city.toLowerCase()
            );
            
            if (foundCity) {
              setSelectedCity(foundCity.name);

              // Fetch areas for this city and then process
              fetchAreas(foundCity.name).then(() => {
                // Use a longer timeout to ensure areas are loaded
                setTimeout(() => {
                  const foundArea = areas.find(
                    (a) => a.name.toLowerCase() === area.toLowerCase()
                  );
                  
                  if (foundArea) {
                    setSelectedArea(foundArea.name);
                    setShowOtherAreaInput(false);
                    setNewAreaName("");
                  } else if (area) {
                    // If area doesn't exist in dropdown but has a value, show "other" input
                    setShowOtherAreaInput(true);
                    setNewAreaName(area);
                    setSelectedArea("");
                  }
                  setHasPrefilled(true);
                  setIsInitialLoad(false);
                }, 500); // Increased timeout to 500ms
              }).catch((error) => {
                console.error("Error fetching areas:", error);
                setHasPrefilled(true);
                setIsInitialLoad(false);
              });
            } else {
              console.log("City not found:", city);
              setHasPrefilled(true);
              setIsInitialLoad(false);
            }
          }, 300); // Increased timeout to 300ms
        }).catch((error) => {
          console.error("Error fetching cities:", error);
          setHasPrefilled(true);
          setIsInitialLoad(false);
        });
      } else {
        console.log("Emirate not found:", emirate);
        setHasPrefilled(true);
        setIsInitialLoad(false);
      }
    } else {
      console.log("Address format not recognized:", formData.area);
      setHasPrefilled(true);
      setIsInitialLoad(false);
    }
  } else if (!formData.area) {
    setHasPrefilled(true);
    setIsInitialLoad(false);
  }
}, [
  formData.area,
  emirates,
  cities,
  areas,
  fetchCities,
  fetchAreas,
  hasPrefilled,
]);

// Also add this useEffect to reset hasPrefilled when jobCard changes
useEffect(() => {
  if (jobCard) {
    setHasPrefilled(false);
    setIsInitialLoad(true);
    // Reset address selection states when loading a new job card
    setSelectedEmirate("");
    setSelectedCity("");
    setSelectedArea("");
    setShowOtherAreaInput(false);
    setNewAreaName("");
  }
}, [jobCard?.name]); // Only trigger when the job card ID changes
  // Update combined address whenever any address component changes
  useEffect(() => {
    if (!isInitialLoad) {
      const combinedAddress = combineAddress(
        selectedEmirate,
        selectedCity,
        showOtherAreaInput ? newAreaName : selectedArea
      );

      // Only update if there's a change to avoid infinite loops
      if (combinedAddress !== formData.area) {
        setFormData((prev) => ({ ...prev, area: combinedAddress }));
      }
    }
  }, [
    selectedArea,
    selectedCity,
    selectedEmirate,
    combineAddress,
    formData.area,
    showOtherAreaInput,
    newAreaName,
    isInitialLoad,
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback(
    (value: string) => {
      setSelectedEmirate(value);
      setSelectedCity(""); // Reset city when emirate changes
      setSelectedArea(""); // Reset area when emirate changes
      setShowOtherAreaInput(false); // Reset other area input
      setNewAreaName(""); // Reset new area name
      fetchCities(value);
    },
    [fetchCities]
  );

  // Handle city selection
  const handleCityChange = useCallback(
    (value: string) => {
      setSelectedCity(value);
      setSelectedArea(""); // Reset area when city changes
      setShowOtherAreaInput(false); // Reset other area input
      setNewAreaName(""); // Reset new area name
      fetchAreas(value);
    },
    [fetchAreas]
  );

  // Handle area selection
  const handleAreaChange = useCallback((value: string) => {
    if (value === "other") {
      setShowOtherAreaInput(true);
      setSelectedArea(""); // Clear selected area when choosing "other"
    } else {
      setSelectedArea(value);
      setShowOtherAreaInput(false);
      setNewAreaName(""); // Clear new area name when selecting from dropdown
    }
  }, []);

  // Handle adding a new area
  const handleAddNewArea = async () => {
    if (!newAreaName.trim()) {
      toast.error("Please enter an area name");
      return;
    }

    if (!selectedCity) {
      toast.error("Please select a city first");
      return;
    }

    setIsAddingArea(true);
    try {
      // Create the new area in the database
      const response = await frappeAPI.createArea({
        area_name: newAreaName.trim(),
        city: selectedCity,
      });

      if (response.data) {
        toast.success("Area added successfully!");

        // Refresh areas for the current city
        await fetchAreas(selectedCity);

        // Wait a moment for the areas to be updated, then select the newly added area
        setTimeout(() => {
          setSelectedArea(newAreaName.trim());
          setShowOtherAreaInput(false);
          setNewAreaName("");
        }, 100);
      } else {
        throw new Error("Failed to create area");
      }
    } catch (error) {
      console.error("Error creating area:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create area. Please try again."
      );
    } finally {
      setIsAddingArea(false);
    }
  };

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
      // Reset address state when creating new job card
      setSelectedEmirate("");
      setSelectedCity("");
      setSelectedArea("");
      setShowOtherAreaInput(false);
      setNewAreaName("");
      setHasPrefilled(false);
      setIsInitialLoad(true);
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
      const endpoint = "/api/method/eits_app.customer_search.search_customers";
      const params = new URLSearchParams();

      if (/^\d+$/.test(query)) {
        // Search by phone number (only digits)
        params.append("mobile_no", query);
      } else if (/^[a-zA-Z0-9._-]+$/.test(query)) {
        // Search by email (partial match) OR name
        // First try email search
        params.append("email_id", query);
        const emailResponse = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `${endpoint}?${params.toString()}`
        );

        // If no email results, try name search
        if (!emailResponse.message.data?.length) {
          params.delete("email_id");
          params.append("customer_name", query);
        }
      } else {
        // Search by name
        params.append("customer_name", query);
      }

      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `${endpoint}?${params.toString()}`
      );
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
      // Error handling...
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(true);
      toast.error("Failed to search customers. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);
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
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg transform scale-105 hover:from-emerald-600 hover:to-blue-600 p-4 sm:rounded-t-xl">
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
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
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
                        <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto mt-1">
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
                                    {/* {customer.lead_name && (
                                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs">
                                        Has Property
                                      </span>
                                    )} */}
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

                    {/* Building Name */}
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
                        className="focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>

                    {/* Property No */}
                    <div className="space-y-2">
                      <Label htmlFor="property_no">Property No</Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no || ""}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        className="focus:ring-blue-500 focus:border-blue-500 w-full"
                      />
                    </div>

                    {/* Address Section - Emirate, City, Area */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Emirate */}
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>Emirate</span>
                          </Label>
                          <Select
                            value={selectedEmirate}
                            onValueChange={handleEmirateChange}
                            disabled={addressLoading}
                          >
                            <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <SelectValue
                                placeholder={
                                  addressLoading
                                    ? "Loading..."
                                    : "Select emirate"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {emirates.map((emirate) => (
                                <SelectItem
                                  key={emirate.name}
                                  value={emirate.name}
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer"
                                >
                                  {emirate.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Select
                            value={selectedCity}
                            onValueChange={handleCityChange}
                            disabled={!selectedEmirate || addressLoading}
                          >
                            <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <SelectValue
                                placeholder={
                                  !selectedEmirate
                                    ? "Select emirate first"
                                    : addressLoading
                                    ? "Loading..."
                                    : "Select city"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {cities.map((city) => (
                                <SelectItem
                                  key={city.name}
                                  value={city.name}
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer"
                                >
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                       
                      </div>
                       {/* Area */}
                        <div className="space-y-2">
                          <Label>Area</Label>
                          <Select
                            value={showOtherAreaInput ? "other" : selectedArea}
                            onValueChange={handleAreaChange}
                            disabled={!selectedCity || addressLoading}
                          >
                            <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <SelectValue
                                placeholder={
                                  !selectedCity
                                    ? "Select city first"
                                    : addressLoading
                                    ? "Loading..."
                                    : "Select area"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {areas.map((area) => (
                                <SelectItem
                                  key={area.name}
                                  value={area.name}
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer"
                                >
                                  {area.name}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="other"
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 focus:bg-blue-100 cursor-pointer"
                              >
                                Other (Not listed)
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Other Area Input */}
                          {showOtherAreaInput && (
                            <div className="mt-2 flex gap-2">
                              <Input
                                type="text"
                                value={newAreaName}
                                onChange={(e) => setNewAreaName(e.target.value)}
                                placeholder="Enter new area name"
                                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <Button
                                type="button"
                                onClick={handleAddNewArea}
                                disabled={isAddingArea || !newAreaName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isAddingArea ? (
                                  <>
                                    <span className="animate-spin mr-2">↻</span>
                                    Adding...
                                  </>
                                ) : (
                                  "Add Area"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                      {/* Combined Address Display */}
                      <div className="mt-4">
                        <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>Combined Address</span>
                        </Label>
                        <Input
                          type="text"
                          value={formData.area || ""}
                          readOnly
                          placeholder="Address will be combined automatically"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                          title="This field is automatically generated from the address components above"
                        />
                      </div>
                    </div>

                    {/* Date Range - Full width on mobile, spans 2 cols on larger screens */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 col-span-1 md:col-span-2 lg:col-span-3">
                      <div className="space-y-1">
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
                          readOnly
                          value={formData.start_date}
                          onChange={handleInputChange}
                          required
                          className="pl-0.5 w-full"
                        />
                      </div>

                      <div className="space-y-1">
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
                          className="w-full -px-1"
                        />
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
                            <div className="space-y-1">
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
                                className="h-10 pl-0.5"
                              />
                              {service.start_date &&
                                !isDateInRange(service.start_date) && (
                                  <p className="text-xs text-red-500">
                                    Date must be within job card range
                                  </p>
                                )}
                            </div>

                            <div className="space-y-1">
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
                                className="h-10 pl-0.5 "
                              />
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
                              className="min-h-[40px] text-md resize-none overflow-hidden w-full"
                              rows={1}
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
