/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  useJobCardsOther,
  type JobCardOtherFormData,
  type Services,
  type JobCardOther,
} from "../../context/JobCardOtherContext";
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
import {
  X,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calendar,
  User,
  Building,
  MapPin,
  Wrench,
  Phone,
  Mail,
} from "lucide-react";
import { frappeAPI } from "../../api/frappeClient";
import { toast } from "sonner";

interface JobCardOtherFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard?: JobCardOther | null;
}

const JobCardOtherForm: React.FC<JobCardOtherFormProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const { createJobCardOther, updateJobCardOther, loading, fetchEmployees } =
    useJobCardsOther();

  const [formData, setFormData] = useState<JobCardOtherFormData>({
    date: new Date().toISOString().split("T")[0],
    building_name: "",
    property_no: "",
    area: "",
    party_name: "",
    start_date: "",
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<
    { name: string; job_type: string }[]
  >([]);
  const [loadingJobTypes, setLoadingJobTypes] = useState(false);

  // Fetch employees when component mounts
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load existing job card data when editing
  useEffect(() => {
    if (jobCard) {
      setFormData({
        ...jobCard,
        party_name: jobCard.party_name || "",
        prepared_by: jobCard.prepared_by || "",
        approved_by: jobCard.approved_by || "",
        project_id_no: jobCard.project_id_no || "",
        ac_v_no_and_date: jobCard.ac_v_no_and_date || "",
        services: jobCard.services || [],
        lead_id: (jobCard as any).lead_id || "",
        customer_id: (jobCard as any).customer_id || "",
      });
      setServices(jobCard.services || []);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        building_name: "",
        property_no: "",
        area: "",
        party_name: "",
        start_date: "",
        finish_date: "",
        prepared_by: "",
        approved_by: "",
        project_id_no: "",
        ac_v_no_and_date: "",
        services: [],
        lead_id: "",
        customer_id: "",
      });
      setServices([]);
    }
  }, [jobCard, isOpen]);

  // Fetch job types
  useEffect(() => {
    const fetchJobTypes = async () => {
      setLoadingJobTypes(true);
      try {
        const response = await frappeAPI.getJobTypes();
        console.log("Fetched job types:", response.data);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // const handleSelectChange = (field: string, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  // Helper function to get employee name for display
  // const getEmployeeDisplayName = (employeeId: string) => {
  //   const employee = employees.find(emp => emp.name === employeeId);
  //   return employee ? employee.employee_name : employeeId;
  // };

  // Services functions
  const addService = () => {
    const newService: Services = {
      work_type: "",
      work_description: "",
      start_date: "",
      finish_date: "",
      invoice_date: "",
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
      alert("Customer name is required");
      return false;
    }
    if (!formData.building_name) {
      alert("Building name is required");
      return false;
    }
    if (!formData.property_no) {
      alert("Property number is required");
      return false;
    }
    if (!formData.area) {
      alert("Area is required");
      return false;
    }
    if (!formData.start_date) {
      alert("Start date is required");
      return false;
    }
    if (!formData.finish_date) {
      alert("Finish date is required");
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

  const handleCustomerSearch = async () => {
    setSearchError(null);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await frappeAPI.getcustomer({
        mobile_no: searchQuery,
        email_id: searchQuery,
        customer_name: searchQuery,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      if (response.data.length === 0) {
        setSearchError("No customers found");
        setSearchResults([]);
        return;
      }

      // For each customer found, fetch their full details
      const detailedCustomers = await Promise.all(
        response.data.map(async (customer: { name: any }) => {
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

      // Filter out any failed requests
      const validCustomers = detailedCustomers.filter(
        (customer) => customer !== null
      );

      setSearchResults(validCustomers);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(
        error instanceof Error ? error.message : "Failed to search customers"
      );
    } finally {
      setIsSearching(false);
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
          <div className="max-w-5xl mx-auto p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Basic Information
                    </h4>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 relative">
                      <Label
                        htmlFor="party_name"
                        className="flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <span>
                          Customer Name <span className="text-red-500">*</span>
                        </span>
                        {(fetchingCustomerDetails || fetchingLeadDetails) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="party_name"
                          name="party_name"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                          }}
                          onBlur={handleCustomerSearch}
                          placeholder="Search by name, email or phone"
                          required
                          className="focus:ring-blue-500 focus:border-blue-500 pr-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>

                      {searchError && (
                        <p className="text-xs text-red-500 mt-1">
                          {searchError}
                        </p>
                      )}

                      {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                          {searchResults.map((customer) => (
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
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="building_name"
                        className="flex items-center space-x-2"
                      >
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>
                          Building Name <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <Input
                        id="building_name"
                        name="building_name"
                        value={formData.building_name || ""}
                        onChange={handleInputChange}
                        placeholder="Enter building name"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="property_no">
                        Property No <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="property_no"
                        name="property_no"
                        value={formData.property_no || ""}
                        onChange={handleInputChange}
                        placeholder="Enter property number"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="area"
                        className="flex items-center space-x-2"
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>
                          Area <span className="text-red-500">*</span>
                        </span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area || ""}
                        onChange={handleInputChange}
                        placeholder="Enter area"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* <div className="space-y-2">
                      <Label htmlFor="project_id_no">Project ID No</Label>
                      <Input
                        id="project_id_no"
                        name="project_id_no"
                        value={formData.project_id_no || ''}
                        onChange={handleInputChange}
                        placeholder="Enter project ID"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div> */}

                    <div className="flex flex-wrap gap-2">
                      {/* Start Date */}
                      <div className="w-[48%] space-y-2">
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
                          value={formData.start_date || ""}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>

                      {/* Finish Date */}
                      <div className="w-[48%] space-y-2">
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
                          onChange={handleInputChange}
                          required
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* <div className='flex gap-2'>
                      Prepared By Dropdown
                      <div className="space-y-2">
                        <Label htmlFor="prepared_by">Prepared By</Label>
                        <Select
                          value={formData.prepared_by || 'none'}
                          onValueChange={(value) => handleSelectChange('prepared_by', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="focus:ring-blue-500 bg-white focus:border-blue-500">
                            <SelectValue placeholder="Select preparer">
                              {formData.prepared_by && formData.prepared_by !== 'none'
                                ? getEmployeeDisplayName(formData.prepared_by)
                                : "Select preparer"
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="none">Select preparer</SelectItem>
                            {employees.filter(employee => employee.employee_name && employee.name).map((employee) => (
                              <SelectItem key={employee.name} value={employee.name}>
                                {employee.employee_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      Approved By Dropdown
                      <div className="space-y-2">
                        <Label htmlFor="approved_by">Approved By</Label>
                        <Select
                          value={formData.approved_by || 'none'}
                          onValueChange={(value) => handleSelectChange('approved_by', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="focus:ring-blue-500 bg-white focus:border-blue-500">
                            <SelectValue placeholder="Select approver">
                              {formData.approved_by && formData.approved_by !== 'none'
                                ? getEmployeeDisplayName(formData.approved_by)
                                : "Select approver"
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="none">Select approver</SelectItem>
                            {employees.filter(employee => employee.employee_name && employee.name).map((employee) => (
                              <SelectItem key={employee.name} value={employee.name}>
                                {employee.employee_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div> */}

                    {/* <div className="space-y-2">
                      <Label htmlFor="ac_v_no_and_date">AC V No / Date</Label>
                      <Input
                        id="ac_v_no_and_date"
                        name="ac_v_no_and_date"
                        value={formData.ac_v_no_and_date || ''}
                        onChange={handleInputChange}
                        placeholder="Enter AC V number/date"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Services Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Wrench className="h-5 w-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Services
                      </h4>
                    </div>
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

                <div className="p-6 space-y-4">
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No services added yet</p>
                      <p className="text-sm">
                        Click "Add Service" to get started
                      </p>
                    </div>
                  ) : (
                    services.map((service, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          {/* Work Type and Description Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600">
                                Work Type
                              </Label>
                              {loadingJobTypes ? (
                                <div className="flex items-center justify-center h-10 bg-gray-100 rounded-md">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                <Select
                                  value={service.work_type}
                                  onValueChange={(value) =>
                                    updateService(index, "work_type", value)
                                  }
                                >
                                  <SelectTrigger className="h-10 bg-white">
                                    <SelectValue placeholder="Select work type" />
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
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600">
                                Work Description
                              </Label>
                              <Textarea
                                placeholder="Enter detailed work description"
                                value={service.work_description}
                                onChange={(e) =>
                                  updateService(
                                    index,
                                    "work_description",
                                    e.target.value
                                  )
                                }
                                className="min-h-[40px] resize-none"
                                rows={2}
                              />
                            </div>
                          </div>

                          {/* Dates Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600">
                                Start Date
                              </Label>
                              <Input
                                type="date"
                                value={service.start_date}
                                onChange={(e) =>
                                  updateService(
                                    index,
                                    "start_date",
                                    e.target.value
                                  )
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600">
                                Finish Date
                              </Label>
                              <Input
                                type="date"
                                value={service.finish_date}
                                onChange={(e) =>
                                  updateService(
                                    index,
                                    "finish_date",
                                    e.target.value
                                  )
                                }
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-600">
                                Invoice Date
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="date"
                                  value={service.invoice_date}
                                  onChange={(e) =>
                                    updateService(
                                      index,
                                      "invoice_date",
                                      e.target.value
                                    )
                                  }
                                  className="h-10"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeService(index)}
                                  className="h-10 w-10 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
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
    </>
  );
};

export default JobCardOtherForm;
