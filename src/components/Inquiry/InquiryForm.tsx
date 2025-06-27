"use client";

import {
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  Phone,
  Save,
  X,
  User,
  Loader2,
} from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useEffect, useState } from "react";
import { type Lead, type LeadFormData, useLeads } from "../../context/LeadContext";
import {
  budgetRanges,
  buildingTypes,
  formatSubmissionData,
  propertyTypes,
  validatePhoneNumber,
} from "../../helpers/helper";
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
import { Label } from "../ui/label";
import { useAssignStore } from "../../store/assign";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

type FormSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
};

type PriorityLevel = "Low" | "Medium" | "High";

interface InquiryFormProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: Lead | null;
}

const defaultFormData: LeadFormData = {
  lead_name: "",
  email_id: "",
  mobile_no: "",
  custom_job_type: "",
  custom_property_type: "Residential",
  custom_type_of_building: "Villa",
  custom_building_name: "",
  custom_budget_range: "AED 100 - AED 500",
  custom_project_urgency: "",
  custom_preferred_inspection_date: null,
  custom_alternative_inspection_date: null,
  custom_preferred_inspection_time: "",
  custom_special_requirements: "",
  custom_map_data: "",
  custom_building_number: "",
  custom_alternative_inspection_time: "",
  utm_source: "",
};

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
    id: "inspection",
    title: "Preferred Date and Time",
    icon: <CalendarIcon className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "inspector",
    title: "Assign Inspector",
    icon: <User className="h-4 w-4" />,
    completed: false,
  },
  {
    id: "additional",
    title: "Additional Information",
    icon: <FileText className="h-4 w-4" />,
    completed: true,
  },
];

const InquiryForm: React.FC<InquiryFormProps> = ({ isOpen, onClose, inquiry }) => {
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
    // clearError,
    success: assignSuccess,
  } = useAssignStore();

  const [activeSection, setActiveSection] = useState<string>("contact");
  const [phoneNumber, setPhoneNumber] = useState("+971 ");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [inspectorEmail, setInspectorEmail] = useState("");
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({ ...defaultFormData });

  // Update section completion status
  const updatedSections = sections.map(section => {
    switch (section.id) {
      case "contact":
        return {
          ...section,
          completed: !!formData.lead_name && !!formData.email_id && !!formData.mobile_no,
        };
      case "job":
        return { ...section, completed: !!formData.custom_job_type };
      case "property":
        return {
          ...section,
          completed: !!formData.custom_property_type && !!formData.custom_type_of_building,
        };
      case "inspection":
        return {
          ...section,
          completed: !!formData.custom_preferred_inspection_date && !!formData.custom_preferred_inspection_time,
        };
      case "inspector":
        return { ...section, completed: !!inspectorEmail };
      default:
        return section;
    }
  });

  // Fetch initial data
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
  }, [isOpen, hasFetchedInitialData]);

  // Set default values when data is loaded
  useEffect(() => {
    if (hasFetchedInitialData && !inquiry) {
      setFormData(prev => ({
        ...prev,
        custom_job_type: jobTypes[0]?.name || "",
        custom_project_urgency: projectUrgency[0]?.name || "",
        utm_source: utmSource[0]?.name || "",
      }));
    }
  }, [hasFetchedInitialData, jobTypes, projectUrgency, utmSource, inquiry]);

  // Load inquiry data when editing
  useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_job_type: inquiry.custom_job_type || jobTypes[0]?.name || "",
        custom_project_urgency: inquiry.custom_project_urgency || projectUrgency[0]?.name || "",
        utm_source: inquiry.utm_source || utmSource[0]?.name || "",
        custom_preferred_inspection_date: inquiry.custom_preferred_inspection_date
          ? new Date(inquiry.custom_preferred_inspection_date)
          : null,
        custom_alternative_inspection_date: inquiry.custom_alternative_inspection_date
          ? new Date(inquiry.custom_alternative_inspection_date)
          : null,
      });
      setPhoneNumber(inquiry.mobile_no || "+971 ");
      setDate(inquiry.custom_preferred_inspection_date ? new Date(inquiry.custom_preferred_inspection_date) : new Date());
    }
  }, [inquiry, hasFetchedInitialData, jobTypes, projectUrgency, utmSource]);

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setPhoneNumber("+971 ");
    setInspectorEmail("");
    setPriority("Medium");
    setDate(new Date());
    setHasFetchedInitialData(false);
  };

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? "" : sectionId);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [name]: date || null }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setPhoneNumber("+971 ");
      setFormData(prev => ({ ...prev, mobile_no: "+971 " }));
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

    setPhoneNumber(formattedNumber);
    setFormData(prev => ({ ...prev, mobile_no: formattedNumber }));
    validatePhoneNumber(formattedNumber);
  };

  const validateForm = (): boolean => {
    if (!formData.lead_name) {
      alert("Name is required");
      return false;
    }
    if (!formData.email_id) {
      alert("Email is required");
      return false;
    }
    if (!formData.mobile_no) {
      alert("Mobile number is required");
      return false;
    }
    if (!formData.custom_job_type) {
      alert("Job type is required");
      return false;
    }
    return true;
  };

  const saveLead = async (): Promise<string | undefined> => {
    try {
      const submissionData = formatSubmissionData(formData);
      
      if (inquiry?.name) {
        await updateLead(inquiry.name, submissionData);
        return inquiry.name;
      } else {
        const newInquiry = await createLead(submissionData);
        return newInquiry.name;
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      alert("Failed to save lead. Please try again.");
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
    }
  };

  const handleAssignAndSave = async () => {
    if (!validateForm()) return;
    
    if (!inspectorEmail) {
      alert("Please select an inspector");
      return;
    }

    if (!date) {
      alert("Please select an inspection date");
      return;
    }

    try {
      const inquiryName = await saveLead();
      if (!inquiryName) return;

      const preferredDate = format(date, "yyyy-MM-dd");
      
      await createTodo({
        assigned_by: user?.username || "sales_rep@eits.com",
        inquiry_id: inquiryName,
        inspector_email: inspectorEmail,
        description: formData.custom_special_requirements || "",
        priority: priority,
        preferred_date: preferredDate,
      });

      alert("Inspector assigned successfully!");
      onClose();
    } catch (error) {
      console.error("Error assigning inspector:", error);
      alert("Failed to assign inspector. Please try again.");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-4 text-white">
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
                <Section
                  key={section.id}
                  section={section}
                  activeSection={activeSection}
                  toggleSection={toggleSection}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                  handleDateChange={handleDateChange}
                  handlePhoneChange={handlePhoneChange}
                  phoneNumber={phoneNumber}
                  jobTypes={jobTypes}
                  projectUrgency={projectUrgency}
                  utmSource={utmSource}
                  inspectors={inspectors}
                  inspectorsLoading={inspectorsLoading}
                  assignError={assignError}
                  assignSuccess={assignSuccess}
                  date={date}
                  priority={priority}
                  setDate={setDate}
                  setPriority={setPriority}
                  inspectorEmail={inspectorEmail}
                  setInspectorEmail={setInspectorEmail}
                  handleAssignAndSave={handleAssignAndSave}
                  createTodoLoading={createTodoLoading}
                  loading={loading}
                />
              ))}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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

// Extracted Section component for better organization
const Section = ({
  section,
  activeSection,
  toggleSection,
  formData,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  handlePhoneChange,
  phoneNumber,
  jobTypes,
  projectUrgency,
  utmSource,
  inspectors,
  inspectorsLoading,
  assignError,
  assignSuccess,
  date,
  priority,
  setDate,
  setPriority,
  inspectorEmail,
  setInspectorEmail,
  handleAssignAndSave,
  createTodoLoading,
  loading,
}: {
  section: FormSection;
  activeSection: string;
  toggleSection: (sectionId: string) => void;
  formData: LeadFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDateChange: (name: string, date: Date | undefined) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneNumber: string;
  jobTypes: { name: string }[];
  projectUrgency: { name: string }[];
  utmSource: { name: string }[];
  inspectors: { name: string }[];
  inspectorsLoading: boolean;
  assignError: string | null;
  assignSuccess: boolean;
  date: Date | undefined;
  priority: PriorityLevel;
  setDate: (date: Date | undefined) => void;
  setPriority: (priority: PriorityLevel) => void;
  inspectorEmail: string;
  setInspectorEmail: (email: string) => void;
  handleAssignAndSave: () => Promise<void>;
  createTodoLoading: boolean;
  loading: boolean;
}) => {
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="mobile_no"
                  value={formData.mobile_no || phoneNumber}
                  onChange={handlePhoneChange}
                  onKeyDown={handleKeyDown}
                  placeholder="+971 XX XXX XXXX"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={17}
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
                  htmlFor="utm_source"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Source Of Inquiry{" "}
                  <span className="text-red-500">*</span>
                </label>

                <Select
                  value={formData.utm_source || ""}
                  onValueChange={(value) =>
                    handleSelectChange("utm_source", value)
                  }
                >
                  <SelectTrigger
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="utm_source"
                  >
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {utmSource.map((utms) => (
                      <SelectItem
                        key={utms.name}
                        value={utms.name}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      >
                        {utms.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Urgency
                </label>
                <Select
                  value={formData.custom_project_urgency || ""}
                  onValueChange={(value) =>
                    handleSelectChange("custom_project_urgency", value)
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
            <div>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Select
                    value={formData.custom_property_type || ""}
                    onValueChange={(value) =>
                      handleSelectChange("custom_property_type", value)
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <Select
                    value={formData.custom_type_of_building || ""}
                    onValueChange={(value) =>
                      handleSelectChange("custom_type_of_building", value)
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                <div>
                  <label
                    htmlFor="custom_building_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <Input
                    type="text"
                    id="custom_building_name"
                    name="custom_building_name"
                    value={formData.custom_building_name || ""}
                    onChange={handleInputChange}
                    placeholder="Enter Property name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom_building_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Number
                  </label>
                  <Input
                    type="text"
                    id="custom_building_number"
                    name="custom_building_number"
                    value={formData.custom_building_number || ""}
                    onChange={handleInputChange}
                    placeholder="Enter Property number"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>

                  <AddressFinder
                    onSelect={(location) => {
                      if (location) {
                        handleSelectChange("custom_map_data", location.display_name);
                      } else {
                        handleSelectChange("custom_map_data", "");
                      }
                    }}
                    initialValue={formData.custom_map_data || ""}
                  />
                </div>
              </div>
            </div>
          )}

          {section.id === "inspection" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={
                    formData.custom_preferred_inspection_date
                      ? new Date(formData.custom_preferred_inspection_date)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleDateChange(
                      "custom_preferred_inspection_date",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

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
                  value={formData.custom_preferred_inspection_time || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          

          {section.id === "inspector" && (
            <div className="space-y-4">
              {assignError && (
                <div className="text-red-500 text-sm">{assignError}</div>
              )}
              {assignSuccess && (
                <div className="text-emerald-500 text-sm">
                  Inspector assigned successfully!
                </div>
              )}

              <div>
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
                        key={inspector.name}
                        value={inspector.name}
                      >
                        <div className="flex items-center gap-2">
                          <span>{inspector.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Inspection Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white border border-gray-300 text-sm",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          format(date, "PP")
                        ) : (
                          <span>Pick date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-md">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate: Date | undefined) => setDate(selectedDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

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
                    !formData.email_id ||
                    !formData.mobile_no ||
                    !formData.custom_job_type
                  }
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                >
                  {createTodoLoading || loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loading ? "Saving & Assigning..." : "Assigning..."}
                    </>
                  ) : (
                    "Save & Assign Inspector"
                  )}
                </Button>
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
  );
};

export default InquiryForm;