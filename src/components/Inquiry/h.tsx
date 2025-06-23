/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  Filter,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useLeads,
  type Lead,
  type LeadFormData,
} from "../../context/LeadContext";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import AddressFinder from "./AddressFinder";
import { useNavigate } from "react-router-dom";

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
    jobTypes,
    fetchJobTypes,
    fetchProjectUrgency,
    projectUrgency,
  } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState<Lead | null>(null);
  const [activeSection, setActiveSection] = useState<string>("contact");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInquiry, setViewInquiry] = useState<Lead | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string>("Electrical");
  const navigate = useNavigate();

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const [formData, setFormData] = useState<LeadFormData>({
    lead_name: "",
    email_id: "",
    mobile_no: "",
    custom_job_type: jobTypes.length > 0 ? jobTypes[0].name : "Electrical", // Dynamic default
    custom_property_type: "Residential",
    custom_type_of_building: "Villa",
    custom_building_name: "",
    custom_budget_range: "Under 10,000 AED",
    custom_project_urgency:
      projectUrgency.length > 0
        ? projectUrgency[0].name
        : "Urgent (Within 1 week)", // Dynamic default
    custom_preferred_inspection_date: null,
    custom_alternative_inspection_date: null,
    custom_preferred_inspection_time: "",
    custom_special_requirements: "",
    custom_map_data: "",
    custom_building_number: "",
    custom_alternative_inspection_time: "",
  });

  const propertyTypes = ["Residential", "Commercial", "Industrial"];
  const buildingTypes = ["Villa", "Apartment", "Office", "Warehouse", "Other"];
  // const budgetRanges = [
  //   "Under 10,000 AED",
  //   "10,000 - 50,000 AED",
  //   "50,000 - 100,000 AED",
  //   "Above 100,000 AED",
  // ];
  // const urgencyOptions = [
  //   "Urgent (Within 1 week)",
  //   "Normal (Within 1 month)",
  //   "Flexible (Within 3 months)",
  //   "Future Planning (3+ months)",
  // ];

  const getJobTypeColor = (jobType: string) => {
    const colors = {
      Electrical: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
      "Joineries and Wood Work": {
        bg: "#D1FAE5",
        text: "#065F46",
        border: "#10B981",
      },
      "Painting & Decorating": {
        bg: "#DBEAFE",
        text: "#1E40AF",
        border: "#3B82F6",
      },
      "Sanitary, Plumbing, Toilets & Washroom": {
        bg: "#E9D5FF",
        text: "#6B21A8",
        border: "#9333EA",
      },
      "Equipment Installation and Maintenance": {
        bg: "#FECACA",
        text: "#991B1B",
        border: "#EF4444",
      },
      Other: { bg: "#E5E7EB", text: "#4B5563", border: "#9CA3AF" },
    };
    return colors[jobType as keyof typeof colors] || colors["Other"];
  };

  const getBudgetColor = (budget: string) => {
    const colors = {
      "Under 10,000 AED": { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
      "10,000 - 50,000 AED": {
        bg: "#FEF3C7",
        text: "#92400E",
        border: "#F59E0B",
      },
      "50,000 - 100,000 AED": {
        bg: "#DBEAFE",
        text: "#1E40AF",
        border: "#3B82F6",
      },
      "Above 100,000 AED": {
        bg: "#E9D5FF",
        text: "#6B21A8",
        border: "#9333EA",
      },
    };
    return (
      colors[budget as keyof typeof colors] || {
        bg: "#E5E7EB",
        text: "#4B5563",
        border: "#9CA3AF",
      }
    );
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> =
      {
        "Urgent (Within 1 week)": {
          bg: "#FEE2E2",
          text: "#991B1B",
          border: "#EF4444",
        },
        "Normal (Within 1 month)": {
          bg: "#FEF3C7",
          text: "#92400E",
          border: "#F59E0B",
        },
        "Flexible (Within 3 months)": {
          bg: "#D1FAE5",
          text: "#065F46",
          border: "#10B981",
        },
        "Future Planning (3+ months)": {
          bg: "#DBEAFE",
          text: "#1E40AF",
          border: "#3B82F6",
        },
      };
    return (
      colors[urgency as keyof typeof colors] || {
        bg: "#E5E7EB",
        text: "#4B5563",
        border: "#9CA3AF",
      }
    );
  };

  const sections: FormSection[] = [
    {
      id: "contact",
      title: "Customer Details",
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
      completed: true,
    },
  ];

  useEffect(() => {
    fetchLeads();
    fetchJobTypes();
    if (fetchProjectUrgency) {
      fetchProjectUrgency();
    }
  }, [fetchLeads, fetchJobTypes, fetchProjectUrgency]);
  console.log("Leads:", leads);
  console.log("Job Types:", jobTypes);
  console.log("Project Urgency:", projectUrgency);

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
      custom_job_type: jobTypes.length > 0 ? jobTypes[0].name : "Electrical",
      custom_property_type: "Residential",
      custom_type_of_building: "Villa",
      custom_building_name: "",
      custom_budget_range: "Under 10,000 AED",
      custom_project_urgency:
        projectUrgency.length > 0
          ? projectUrgency[0].name
          : "Urgent (Within 1 week)",
      custom_preferred_inspection_date: null,
      custom_alternative_inspection_date: null,
      custom_preferred_inspection_time: "",
      custom_special_requirements: "",
      custom_map_data: "",
      custom_building_number: "",
      custom_alternative_inspection_time: "",
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
        custom_building_number: inquiry.custom_building_number || "",
        custom_alternative_inspection_time:
          inquiry.custom_alternative_inspection_time || "",
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

  const openViewModal = (inquiry: Lead) => {
    setViewInquiry(inquiry);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewInquiry(null);
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
      const submissionData = { ...formData };

      const getDateString = (
        date: string | Date | null | undefined
      ): string => {
        if (!date) return "";

        if (typeof date === "string") {
          if (date.includes(" ")) {
            return date.split(" ")[0];
          }
          return date;
        }

        return date.toISOString().split("T")[0];
      };

      const formatDateTime = (dateStr: string, timeStr: string): string => {
        if (!dateStr || !timeStr) return "";

        const time =
          timeStr.includes(":") && timeStr.split(":").length === 2
            ? `${timeStr}:00`
            : timeStr;

        return `${dateStr} ${time}`;
      };

      const formatDate = (date: string | Date | null | undefined): string => {
        if (!date) return "";
        return getDateString(date);
      };

      if (
        formData.custom_preferred_inspection_time &&
        formData.custom_preferred_inspection_date
      ) {
        const dateStr = getDateString(
          formData.custom_preferred_inspection_date
        );
        submissionData.custom_preferred_inspection_time = formatDateTime(
          dateStr,
          formData.custom_preferred_inspection_time
        );
      } else {
        submissionData.custom_preferred_inspection_time = "";
      }

      if (
        formData.custom_alternative_inspection_time &&
        formData.custom_alternative_inspection_date
      ) {
        const dateStr = getDateString(
          formData.custom_alternative_inspection_date
        );
        submissionData.custom_alternative_inspection_time = formatDateTime(
          dateStr,
          formData.custom_alternative_inspection_time
        );
      } else {
        submissionData.custom_alternative_inspection_time = "";
      }

      submissionData.custom_preferred_inspection_date = formatDate(
        formData.custom_preferred_inspection_date
      );
      submissionData.custom_alternative_inspection_date = formatDate(
        formData.custom_alternative_inspection_date
      );

      if (currentInquiry?.name) {
        await updateLead(currentInquiry.name, submissionData);
      } else {
        await createLead(submissionData);
      }

      closeSidebar();
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const filteredInquiries = leads
    .filter((inquiry: Lead) => inquiry.custom_job_type === selectedJobType)
    .filter(
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

  console.log("Filtered Inquiries:", filteredInquiries);

  const getUrgencyShortLabel = (urgency: string) => {
    const labels: Record<string, string> = {
      Urgent: "Urgent",
      "High Priority": "High",
      "Medium Priority": "Medium",
      "Low Priority": "Low",
      "Not Urgent": "Normal",
    };
    return labels[urgency] || urgency;
  };

  const formatDateCompact = (date: string | Date) => {
    // Format as "Dec 15" or "Today" etc for mobile
    const today = new Date();
    const inputDate = new Date(date);

    if (inputDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (inputDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return inputDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full pb-20">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-emerald-100">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-emerald-800">
              Inquiry Management
            </h2>
            <button
              className="text-emerald-600 hover:text-emerald-800 text-2xl font-bold"
              onClick={() => openSidebar()}
            >
              +
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-md">
            {/* Desktop View */}
            <div className="hidden md:flex items-center gap-4 w-full">
              {/* Search - Takes 70% width */}
              <div className="relative flex-[7]">
                {" "}
                {/* 70% */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search inquiries..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter - Takes 30% width */}
              <div className="flex items-center gap-2 flex-[3]">
                {" "}
                {/* 30% */}
                <Filter className="h-5 w-5 text-gray-500" />
                <Select
                  value={selectedJobType}
                  onValueChange={setSelectedJobType}
                >
                  <SelectTrigger className="w-full bg-white border border-gray-300">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 ">
                    {jobTypes.map((jobType) => (
                      <SelectItem key={jobType.name} value={jobType.name}>
                        {jobType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex items-center gap-2 w-full">
              {/* Search - 70% width */}
              <div className="relative w-[80%]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 w-full bg-white border border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter - 30% width, icon only */}
              <div className="w-[20%] flex justify-end">
                <Select
                  value={selectedJobType}
                  onValueChange={setSelectedJobType}
                >
                  <SelectTrigger className="w-full  px-2 bg-white border border-gray-300 justify-center">
                    <Filter className="h-4 w-4 text-gray-600" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-md w-[200px]">
                    {jobTypes.map((jobType) => (
                      <SelectItem
                        key={jobType.name}
                        value={jobType.name}
                        className="hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {jobType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry List */}
      <div className="">
        {filteredInquiries.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4 text-gray-500">
            <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-3 md:p-4 mb-2 md:mb-3">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-700 mb-1">
              No inquiries found for {selectedJobType}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">
              Start by creating your first inquiry
            </p>
            <Button
              onClick={() => openSidebar()}
              className="mt-1 md:mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 text-sm md:text-base"
              size="sm"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Create New Inquiry
            </Button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4 p-2 md:p-4">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.name}
                className="bg-gradient-to-br from-white to-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-100 shadow-xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300 cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  openViewModal(inquiry);
                }}
              >
                <div className="flex justify-between items-start gap-2 md:gap-3">
                  <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="bg-emerald-100/50 text-emerald-800 rounded-md md:rounded-lg p-1.5 md:p-2 mt-0.5">
                      <User className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm md:text-base text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                        {inquiry.lead_name}
                      </h4>
                      {/* <p className="text-xs text-gray-500 truncate">
                        {inquiry.email_id}
                      </p> */}
                      {inquiry.custom_job_type && (
                        <div className=" md:mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-full border shadow-none"
                            style={{
                              backgroundColor:
                                getJobTypeColor(inquiry.custom_job_type).bg +
                                "20",
                              color: getJobTypeColor(inquiry.custom_job_type)
                                .text,
                              borderColor: getJobTypeColor(
                                inquiry.custom_job_type
                              ).border,
                            }}
                          >
                            {inquiry.custom_job_type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`tel:${inquiry.mobile_no}`}
                      className="flex items-center justify-center h-7 w-7 md:h-9 md:w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title={`Call ${inquiry.mobile_no}`}
                    >
                      <Phone className="h-3 w-3 md:h-4 md:w-4" />
                    </a>

                    <a
                      href={`mailto:${inquiry.email_id}`}
                      className="flex items-center justify-center h-7 w-7 md:h-9 md:w-9 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title={`Email ${inquiry.email_id}`}
                    >
                      <Mail className="h-3 w-3 md:h-4 md:w-4" />
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 md:h-9 md:w-9 p-0 bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSidebar(inquiry);
                      }}
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>

                {/* Rest of the details */}
                <div className="mt-2 space-y-2">
                  {/* Urgency and Budget - Compact row with dots for urgency */}
                  {(inquiry.custom_project_urgency ||
                    inquiry.custom_budget_range) && (
                    <div className="flex items-center justify-between gap-2">
                      {inquiry.custom_project_urgency && (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getUrgencyColor(
                                inquiry.custom_project_urgency
                              ).bg,
                            }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: getUrgencyColor(
                                inquiry.custom_project_urgency
                              ).text,
                            }}
                          >
                            {getUrgencyShortLabel(
                              inquiry.custom_project_urgency
                            )}
                          </span>
                        </div>
                      )}
                      {inquiry.custom_budget_range && (
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 rounded-md text-xs font-medium shadow-none ml-auto"
                          style={{
                            backgroundColor:
                              getBudgetColor(inquiry.custom_budget_range).bg +
                              "15",
                            color: getBudgetColor(inquiry.custom_budget_range)
                              .text,
                            borderColor:
                              getBudgetColor(inquiry.custom_budget_range)
                                .border + "40",
                          }}
                        >
                          {inquiry.custom_budget_range}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Location - Full width utilization */}
                  {inquiry.custom_map_data && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 leading-tight flex-1">
                        {inquiry.custom_map_data}
                      </span>
                    </div>
                  )}

                  {/* Date - Compact inline format */}
                  {inquiry.custom_preferred_inspection_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {formatDateCompact(
                          inquiry.custom_preferred_inspection_date
                        )}
                      </span>
                    </div>
                  )}
                  {inquiry.status === "Open" ? (
                    <Badge
                      variant="outline"
                      className="text-xs md:text-sm px-2 py-0.5 rounded-md text-emerald-600 border border-emerald-200 bg-emerald-50"
                    >
                      Assigned
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 md:h-9 md:w-9 p-0 bg-white text-blue-600 border border-blue-200 
               hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 
               transition-all duration-200 ease-in-out shadow-sm rounded-md"
                      onClick={() => {
                        navigate("/sales?tab=assign", {
                          state: {
                            inquiry: inquiry,
                            from: "inquiry",
                          },
                        });
                      }}
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="sr-only">Assign</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Add Form Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
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
                                {jobTypes.map((jobType) => (
                                  <SelectItem
                                    key={jobType.name}
                                    value={jobType.name}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {jobType.name}
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
                                {projectUrgency.map((urgency) => (
                                  <SelectItem
                                    key={urgency.name}
                                    value={urgency.name}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                                  >
                                    {urgency.name}
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
                                {projectUrgency.map((urgency) => (
                                  <SelectItem
                                    key={urgency.name}
                                    value={urgency.name}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Location
                            </label>

                            <AddressFinder
                              onSelect={(location) => {
                                if (location) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    // Store only the display_name as a simple string
                                    custom_map_data: location.display_name,
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    custom_map_data: "",
                                  }));
                                }
                              }}
                              initialValue={formData.custom_map_data || ""}
                            />

                            {formData.custom_map_data && (
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Selected:</span>{" "}
                                {formData.custom_map_data}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {section.id === "inspection" && (
                        <div className="grid grid-cols-12 gap-4">
                          {/* Preferred Date - 70% width */}
                          <div className="col-span-8">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
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
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Preferred Time - 30% width */}
                          <div className="col-span-4">
                            <label
                              htmlFor="custom_preferred_inspection_time"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Time
                            </label>
                            <Input
                              type="time"
                              id="custom_preferred_inspection_time"
                              name="custom_preferred_inspection_time"
                              value={
                                formData.custom_preferred_inspection_time || ""
                              }
                              onChange={handleInputChange}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* View Modal */}
      {viewModalOpen && viewInquiry && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Inquiry Details</h3>

                {viewInquiry.status === "Open" ? (
                  <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                    Assigned
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                    onClick={() => {
                      // Navigate to assign tab with the inquiry data
                      navigate("/sales?tab=assign", {
                        state: { inquiry: viewInquiry },
                      });
                    }}
                  >
                    <span className="text-xl md:text-2xl font-semibold text-white">
                      Assign
                    </span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
                  onClick={closeViewModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  Contact Details
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">
                      {viewInquiry.lead_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <a
                      href={`mailto:${viewInquiry.email_id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {viewInquiry.email_id || "-"}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile:</span>
                    <a
                      href={`tel:${viewInquiry.mobile_no}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {viewInquiry.mobile_no || "-"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Home className="h-5 w-5 text-emerald-600" />
                  Job Details
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_job_type || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Range:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_budget_range || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Urgency:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_project_urgency || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-emerald-600" />
                  Property Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_property_type || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Type:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_type_of_building || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Name:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_building_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Building Number:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_building_number || "-"}
                    </span>
                  </div>
                  {viewInquiry.custom_map_data && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="text-sm text-gray-800 mt-1">
                        {viewInquiry.custom_map_data}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspection Schedule */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Inspection Schedule
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Date:</span>
                    <span className="font-medium">
                      {formatDate(viewInquiry.custom_preferred_inspection_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Time:</span>
                    <span className="font-medium">
                      {viewInquiry.custom_preferred_inspection_time || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {viewInquiry.custom_special_requirements && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Special Requirements
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {viewInquiry.custom_special_requirements}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <Button
                onClick={() => {
                  closeViewModal();
                  openSidebar(viewInquiry);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={closeViewModal}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default InquiryPage;
