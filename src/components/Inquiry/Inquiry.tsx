/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Edit,
  Plus,
  Save,
  Search,
  X,
  Calendar,
  MapPin,
  Phone,
  Home,
  Building,
  FileText,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import AddressFinder from "./AddressFinder";
import { useEffect } from "react";
import {
  useLeads,
  type Lead,
  type LeadFormData,
} from "../../context/LeadContext";

interface FormSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
}

const InquiryPage = () => {
  const {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
  } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState<Lead | null>(null);
  const [activeSection, setActiveSection] = useState<string>("contact");

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const [formData, setFormData] = useState<LeadFormData>({
    lead_name: "",
    email_id: "",
    mobile_no: "",
    custom_job_type: "Electrical",
    custom_property_type: "Residential",
    custom_type_of_building: "Villa",
    custom_building_name: "",
    custom_budget_range: "Under 10,000 AED",
    custom_project_urgency: "Urgent (Within 1 week)",
    custom_preferred_inspection_date: null,
    custom_alternative_inspection_date: null,
    custom_preferred_inspection_time: "",
    custom_special_requirements: "",
    custom_map_data: "",
  });

  const jobTypes = [
    "Electrical",
    "Joineries and Wood Work",
    "Painting & Decorating",
    "Sanitary, Plumbing, Toilets & Washroom",
    "Equipment Installation and Maintenance",
    "Other",
  ];

  const propertyTypes = ["Residential", "Commercial", "Industrial"];
  const buildingTypes = ["Villa", "Apartment", "Office", "Warehouse", "Other"];
  const budgetRanges = [
    "Under 10,000 AED",
    "10,000 - 50,000 AED",
    "50,000 - 100,000 AED",
    "Above 100,000 AED",
  ];
  const urgencyOptions = [
    "Urgent (Within 1 week)",
    "Normal (Within 1 month)",
    "Flexible (Within 3 months)",
    "Future Planning (3+ months)",
  ];

  const sections: FormSection[] = [
    {
      id: "contact",
      title: "Contact Information",
      icon: <Phone className="h-4 w-4" />,
      completed:
        !!formData.lead_name && !!formData.email_id && !!formData.mobile_no,
    },
    {
      id: "job",
      title: "Job Details",
      icon: <Home className="h-4 w-4" />,
      completed: !!formData.custom_job_type,
    },
    {
      id: "property",
      title: "Property Information",
      icon: <Building className="h-4 w-4" />,
      completed:
        !!formData.custom_property_type && !!formData.custom_type_of_building,
    },
    {
      id: "inspection",
      title: "Inspection Schedule",
      icon: <Calendar className="h-4 w-4" />,
      completed: !!formData.custom_preferred_inspection_date,
    },
    {
      id: "additional",
      title: "Additional Information",
      icon: <FileText className="h-4 w-4" />,
      completed: true, // Always show as this is optional
    },
  ];

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: LeadFormData) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: date || null }));
  };

  const resetForm = () => {
    setFormData({
      lead_name: "",
      email_id: "",
      mobile_no: "",
      custom_job_type: "Electrical",
      custom_property_type: "Residential",
      custom_type_of_building: "Villa",
      custom_building_name: "",
      custom_budget_range: "Under 10,000 AED",
      custom_project_urgency: "Urgent (Within 1 week)",
      custom_preferred_inspection_date: null,
      custom_alternative_inspection_date: null,
      custom_preferred_inspection_time: "",
      custom_special_requirements: "",
      custom_map_data: "",
    });
  };

  const openSidebar = (inquiry: Lead | null = null) => {
    if (inquiry) {
      setCurrentInquiry(inquiry);
      setFormData({
        lead_name: inquiry.lead_name || "",
        email_id: inquiry.email_id || "",
        mobile_no: inquiry.mobile_no || "",
        custom_job_type: inquiry.custom_job_type || "Electrical",
        custom_property_type: inquiry.custom_property_type || "Residential",
        custom_type_of_building: inquiry.custom_type_of_building || "Villa",
        custom_building_name: inquiry.custom_building_name || "",
        custom_budget_range: inquiry.custom_budget_range || "Under 10,000 AED",
        custom_project_urgency:
          inquiry.custom_project_urgency || "Urgent (Within 1 week)",
        custom_preferred_inspection_date:
          inquiry.custom_preferred_inspection_date
            ? new Date(inquiry.custom_preferred_inspection_date)
            : null,
        custom_alternative_inspection_date:
          inquiry.custom_alternative_inspection_date
            ? new Date(inquiry.custom_alternative_inspection_date)
            : null,
        custom_preferred_inspection_time:
          inquiry.custom_preferred_inspection_time || "",
        custom_special_requirements: inquiry.custom_special_requirements || "",
        custom_map_data: inquiry.custom_map_data || "",
      });
    } else {
      setCurrentInquiry(null);
      resetForm();
    }
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setCurrentInquiry(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lead_name) {
      alert("Name is required");
      return;
    }
    if (!formData.email_id) {
      alert("Email is required");
      return;
    }
    if (!formData.mobile_no) {
      alert("Mobile number is required");
      return;
    }
    if (!formData.custom_job_type) {
      alert("Job type is required");
      return;
    }

    try {
      if (currentInquiry?.name) {
        // Update existing lead
        await updateLead(currentInquiry.name, formData);
      } else {
        // Create new lead
        await createLead(formData);
      }

      closeSidebar();
    } catch (err) {
      console.error("Form submission error:", err);
      alert(
        "Error submitting form: " +
          (err && typeof err === "object" && "message" in err
            ? (err as { message?: string }).message
            : String(err))
      );
    }
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const filteredInquiries = leads.filter(
    (inquiry: Lead) =>
      (inquiry.lead_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (inquiry.email_id?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (inquiry.mobile_no?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      )
  );

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">
              Inquiry Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track customer inquiries
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <Button
              onClick={() => openSidebar()}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inquiry
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-emerald-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Contact
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider"
                >
                  Job Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider  "
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">Budget</div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-emerald-800 uppercase tracking-wider  "
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Inspection Date
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-emerald-800 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex justify-center mb-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                    <p className="text-gray-500">Loading inquiries...</p>
                  </td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-500">
                        {searchTerm
                          ? "No inquiries match your search"
                          : "No inquiries found"}
                      </p>
                      {!searchTerm && (
                        <Button
                          onClick={() => openSidebar()}
                          className="mt-4 bg-gradient-to-r from-emerald-600 to-blue-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Inquiry
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry: Lead, index: number) => (
                  <tr
                    key={inquiry.name}
                    className="hover:bg-emerald-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1 p-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {inquiry.lead_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {inquiry.mobile_no}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {inquiry.email_id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs">
                        {inquiry.custom_job_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          
                          {inquiry.custom_map_data || "Not specified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700"
                      >
                        {inquiry.custom_budget_range || "Not specified"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(inquiry.custom_preferred_inspection_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
                          onClick={() => openSidebar(inquiry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 right-0 w-full md:w-[65%] lg:w-[55%] bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {currentInquiry ? "Edit Inquiry" : "New Inquiry"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                onClick={closeSidebar}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {sections.map((section) => (
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
                          <div>
                            <label
                              htmlFor="lead_name"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="text"
                              id="lead_name"
                              name="lead_name"
                              value={formData.lead_name || ""}
                              onChange={handleInputChange}
                              required
                              placeholder="Enter your name"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="email_id"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Email
                            </label>
                            <Input
                              type="email"
                              id="email_id"
                              name="email_id"
                              value={formData.email_id || ""}
                              onChange={handleInputChange}
                              required
                              placeholder="Enter your email"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="mobile_no"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Mobile No
                            </label>
                            <Input
                              type="tel"
                              id="mobile_no"
                              name="mobile_no"
                              value={formData.mobile_no || ""}
                              onChange={handleInputChange}
                              required
                              placeholder="Enter your mobile number"
                            />
                          </div>
                        </div>
                      )}

                      {section.id === "job" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="mb-4">
                            <label
                              htmlFor="custom_job_type"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Job Type <span className="text-red-500">*</span>
                            </label>

                            <Select
                              value={formData.custom_job_type || ""}
                              onValueChange={(value) =>
                                handleSelectChange("custom_job_type", value)
                              }
                            >
                              <SelectTrigger
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                id="custom_job_type"
                              >
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>

                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {jobTypes.map((type) => (
                                  <SelectItem
                                    key={type}
                                    value={type}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="mb-4">
                            <label
                              htmlFor="custom_budget_range"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Budget Range
                            </label>

                            <Select
                              value={formData.custom_budget_range || ""}
                              onValueChange={(value) =>
                                handleSelectChange("custom_budget_range", value)
                              }
                            >
                              <SelectTrigger
                                id="custom_budget_range"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>

                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {budgetRanges.map((range) => (
                                  <SelectItem
                                    key={range}
                                    value={range}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {range}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {section.id === "property" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Property Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Property Type
                            </label>
                            <Select
                              value={formData.custom_property_type || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "custom_property_type",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {propertyTypes.map((type) => (
                                  <SelectItem
                                    key={type}
                                    value={type}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Building Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Building Type
                            </label>
                            <Select
                              value={formData.custom_type_of_building || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "custom_type_of_building",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <SelectValue placeholder="Select building type" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {buildingTypes.map((type) => (
                                  <SelectItem
                                    key={type}
                                    value={type}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Project Urgency */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project Urgency
                            </label>
                            <Select
                              value={formData.custom_project_urgency || ""}
                              onValueChange={(value) =>
                                handleSelectChange(
                                  "custom_project_urgency",
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <SelectValue placeholder="Select urgency" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {urgencyOptions.map((option) => (
                                  <SelectItem
                                    key={option}
                                    value={option}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Building Name */}
                          <div>
                            <label
                              htmlFor="custom_building_name"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Building Name
                            </label>
                            <Input
                              type="text"
                              id="custom_building_name"
                              name="custom_building_name"
                              value={formData.custom_building_name || ""}
                              onChange={handleInputChange}
                              placeholder="Enter building name"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Building Number */}
                          <div>
                            <label
                              htmlFor="custom_building_number"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Building Number
                            </label>
                            <Input
                              type="text"
                              id="custom_building_number"
                              name="custom_building_number"
                              value={formData.custom_building_number || ""}
                              onChange={handleInputChange}
                              placeholder="Enter building number"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Map Location */}
                          {/* Map Location */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Location
                            </label>
                            <AddressFinder
                              onSelect={(location) => {
                                if (location) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    custom_map_data: JSON.stringify({
                                      display_name: location.display_name,
                                      clean_display_name:
                                        location.clean_display_name,
                                      lat: location.lat,
                                      lon: location.lon,
                                      address: location.address,
                                    }),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    custom_map_data: "",
                                  }));
                                }
                              }}
                              initialValue={
                                formData.custom_map_data
                                  ? JSON.parse(formData.custom_map_data)
                                      .clean_display_name
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      )}

                      {section.id === "inspection" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Preferred Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred Date
                            </label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split("T")[0]} // Disable past dates
                              value={
                                formData.custom_preferred_inspection_date
                                  ? new Date(
                                      formData.custom_preferred_inspection_date
                                    )
                                      .toISOString()
                                      .split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "custom_preferred_inspection_date",
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </div>

                          {/* Alternative Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alternative Date
                            </label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split("T")[0]} // Disable past dates
                              value={
                                formData.custom_alternative_inspection_date
                                  ? new Date(
                                      formData.custom_alternative_inspection_date
                                    )
                                      .toISOString()
                                      .split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                handleDateChange(
                                  "custom_alternative_inspection_date",
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </div>

                          {/* Preferred Time */}
                          <div>
                            <label
                              htmlFor="custom_preferred_inspection_time"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Preferred Time
                            </label>
                            <Input
                              type="time"
                              id="custom_preferred_inspection_time"
                              name="custom_preferred_inspection_time"
                              value={
                                formData.custom_preferred_inspection_time || ""
                              }
                              onChange={handleInputChange}
                            />
                          </div>

                          {/* Alternative Time */}
                          <div>
                            <label
                              htmlFor="custom_alternative_inspection_time"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Alternative Time
                            </label>
                            <Input
                              type="time"
                              id="custom_alternative_inspection_time"
                              name="custom_alternative_inspection_time"
                              value={
                                formData.custom_alternative_inspection_time ||
                                ""
                              }
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      )}

                      {section.id === "additional" && (
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="custom_special_requirements"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Special Requirements
                            </label>
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
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSidebar}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {currentInquiry ? "Update" : "Create"} Inquiry
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default InquiryPage;
