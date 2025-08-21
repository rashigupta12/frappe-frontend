/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Home,
  Loader2,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { frappeAPI } from "../../../api/frappeClient";
import { useAuth } from "../../../context/AuthContext";
import {
  useLeads,
  type Lead,
  type LeadFormData,
} from "../../../context/LeadContext";
import {
  budgetRanges,
  capitalizeFirstLetter,
  convertJobTypesToFormFormat,
  defaultFormData,
  formatSubmissionData,
  getCurrentTime,
  type FormSection,
} from "../../../helpers/helper";
import { timeToMinutes } from "../../../lib/timeUtils";
import { useAssignStore } from "../../../store/assign";
import { Button } from "../../ui/button";
// import { Input } from "../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { ConfirmationModal } from "../ConfirmationModal";
// import { MultiSelectJobTypes } from "./MultiselectJobtypes";
import PropertyAddressSection from "../PropertyAddress";

import type {
  CustomerSearchResult,
  InspectorAvailability,
  PriorityLevel,
} from "../../../types/inquiryFormdata";
import CustomerSearch from "./CustomerSearch";
import InspectionAssignment from "./InspectionAssignment";


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
    // jobTypes,
    fetchJobTypes,
    fetchProjectUrgency,
    projectUrgency,
    // utmSource,
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

  // Customer states
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);

  // Inspector assignment states
  const [selectedInspector, setSelectedInspector] =
    useState<InspectorAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [requestedTime, setRequestedTime] = useState("");
  const [duration, setDuration] = useState("0.5");
  const [showEndTimeWarning, setShowEndTimeWarning] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const navigate = useNavigate();

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

        if (totalMinutes > 18 * 60) {
          setShowEndTimeWarning(true);
        } else {
          setShowEndTimeWarning(false);
        }
      }
    }
  }, [requestedTime, duration]);

  useEffect(() => {
    if (inquiry && hasFetchedInitialData) {
      setFormData({
        ...defaultFormData,
        ...inquiry,
        custom_jobtype: convertJobTypesToFormFormat(inquiry.custom_jobtype),
        custom_project_urgency: inquiry.custom_project_urgency || "",
        source: inquiry.source || "",
        custom_preferred_inspection_date: inquiry.custom_preferred_inspection_date
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

      if (inquiry.lead_name) {
        setSelectedCustomer({
          customer_name: inquiry.lead_name,
          mobile_no: inquiry.mobile_no || "+971 ",
          email_id: inquiry.email_id || "",
          name: inquiry.name || "",
          lead_name: inquiry.name,
        });
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

  const handleCustomerSelect = (customer: CustomerSearchResult | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      // Update form data with customer information
      setFormData((prev) => ({
        ...prev,
        lead_name: customer.customer_name,
        email_id: customer.email_id || "",
        mobile_no: customer.mobile_no || "+971 ",
        customer_id: customer.name || "",
        lead_id: customer.lead_name || "",
      }));

      // If address details are available, populate property fields
      if (customer.address_details) {
        setFormData((prev) => ({
          ...prev,
          custom_property_category:
            customer.address_details?.property_category || "",
          custom_emirate: customer.address_details?.emirate || "",
          custom_community: customer.address_details?.community || "",
          custom_area: customer.address_details?.area || "",
          custom_street_name: customer.address_details?.street_name || "",
          custom_property_name__number:
            customer.address_details?.property_number || "",
          custom_property_area: customer.address_details?.combined_address || "",
          custom_property_type: customer.address_details?.property_type || "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        lead_name: "",
        email_id: "",
        mobile_no: "+971 ",
        customer_id: "",
        lead_id: "",
      }));
    }
  };

  const handleCustomerUpdate = async (updateData: any) => {
    const { customer, jobType, mode } = updateData;
    
    // For new inquiries, just update local state
    if (!inquiry) {
      setFormData((prev) => ({
        ...prev,
        lead_name: customer.customer_name,
        email_id: customer.email_id,
        mobile_no: customer.mobile_no,
        custom_jobtype: jobType,
      }));
      return;
    }

    // For existing inquiries, update the lead
    try {
      const leadId = formData.name || selectedCustomer?.name;
      if (!leadId) {
        throw new Error("No lead ID found for update");
      }

      const freshLead = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Lead/${leadId}`
      );

      if (!freshLead?.data) {
        throw new Error("Could not fetch fresh lead data");
      }

      const apiJobTypeFormat = jobType.map((job: string) => ({ job_type: job }));

      const newLeadData = {
        ...freshLead.data,
        lead_name: customer.customer_name.trim(),
        email_id: customer.email_id || "",
        mobile_no: customer.mobile_no,
        custom_jobtype: apiJobTypeFormat,
      };

      Object.keys(newLeadData).forEach(key => {
        if (newLeadData[key] === undefined) {
          delete newLeadData[key];
        }
      });

      let updatedLead;
      if (mode === "create") {
        const formattedData = formatSubmissionData({
          lead_name: customer.customer_name.trim(),
          email_id: customer.email_id || "",
          mobile_no: customer.mobile_no,
          custom_jobtype: jobType,
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

      const convertedJobTypes = Array.isArray(updatedLead.custom_jobtype)
        ? updatedLead.custom_jobtype.map((item: any) => 
            typeof item === 'string' ? item : item.job_type
          )
        : jobType;

      setFormData((prev: LeadFormData) => ({
        ...prev,
        ...updatedLead,
        custom_jobtype: convertedJobTypes,
        custom_preferred_inspection_date: updatedLead.custom_preferred_inspection_date
          ? new Date(updatedLead.custom_preferred_inspection_date)
          : prev.custom_preferred_inspection_date,
      }));

      if (updatedLead.custom_preferred_inspection_date) {
        setDate(new Date(updatedLead.custom_preferred_inspection_date));
      }

      setShowReferenceInput(
        updatedLead.source === "Reference" ||
        updatedLead.source === "Supplier Reference"
      );

    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  };

  const validateForm = (): boolean => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let submissionData = formatSubmissionData(formData);
      
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
        await updateLead(existingLeadId, submissionData);
        toast.success("Inquiry updated successfully!");
      } else {
        const newInquiry = await createLead(submissionData);
        toast.success("Inquiry created successfully!");
        
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
    // Full validation logic remains the same
    if (!selectedCustomer) {
      toast.error("Please complete customer details: Customer selection is required");
      setActiveSection("contact");
      return;
    }

    if (!formData.custom_jobtype || formData.custom_jobtype.length === 0) {
      toast.error("Please complete job details: At least one job type is required");
      setActiveSection("job");
      return;
    }

    // All other validations...
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
      toast.error("Please complete customer details: Source of inquiry is required");
      setActiveSection("contact");
      return;
    }

    if ((formData.source === "Reference" || formData.source === "Supplier Reference") && !formData.custom_reference_name) {
      toast.error("Please complete customer details: Reference name is required");
      setActiveSection("contact");
      return;
    }

    // Property validation
    const propertyFields = [
      { field: 'custom_property_name__number', message: 'Property number is required' },
      { field: 'custom_property_category', message: 'Property category is required' },
      { field: 'custom_property_area', message: 'Property area is required' },
      { field: 'custom_street_name', message: 'Street name is required' },
      { field: 'custom_emirate', message: 'Emirate is required' },
      { field: 'custom_community', message: 'Community is required' },
      { field: 'custom_area', message: 'Area is required' }
    ];

    for (const { field, message } of propertyFields) {
      if (!formData[field as keyof LeadFormData]) {
        toast.error(`Please complete property details: ${message}`);
        setActiveSection("property");
        return;
      }
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
      toast.error(`Requested time must be within the selected slot (${selectedSlot?.start} - ${selectedSlot?.end})`);
      setActiveSection("inspector");
      return;
    }

    const endTime = calculateEndTime();
    if (endTime) {
      const [hours, minutes] = endTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;

      if (totalMinutes > 18 * 60) {
        toast.error("Inspection cannot end after 6:00 PM. Please adjust the start time or duration.");
        setShowEndTimeWarning(true);
        setActiveSection("inspector");
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    setShowConfirmModal(false);

    try {
      const existingLeadId = inquiry?.name || formData.name;
      let inquiryName: string;

      if (existingLeadId) {
        const submissionData = formatSubmissionData(formData);
        await updateLead(existingLeadId, submissionData);
        inquiryName = existingLeadId;
        toast.success("Inquiry updated successfully!");
      } else {
        const submissionData = formatSubmissionData(formData);
        
        if (!inquiry && selectedCustomer) {
          submissionData.lead_name = selectedCustomer.customer_name;
          submissionData.email_id = selectedCustomer.email_id || "";
          submissionData.mobile_no = selectedCustomer.mobile_no || "+971 ";
        }

        const newInquiry = await createLead(submissionData);
        inquiryName = newInquiry.name;
        toast.success("Inquiry created successfully!");
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

      let employeeName = "";
      const employeeResponse = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Employee?filters=[["user_id","=","${selectedInspector!.email}"]]`
      );

      if (employeeResponse?.data?.length > 0) {
        employeeName = employeeResponse.data[0].name;
      } else {
        throw new Error(`Could not find employee record for ${selectedInspector!.email}`);
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
      toast.error("Failed to complete assignment");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Inspector assignment handlers
  const handleInspectorSelect = (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
  ) => {
    const inspector = availabilityData.find(
      (inspector) => inspector.email === email
    );
    if (inspector) {
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
  };

  const handleTimeChange = (time: string) => {
    setRequestedTime(time);
    setFormData((prev) => ({
      ...prev,
      custom_preferred_inspection_time: time,
    }));
  };

  const handleDurationChange = (newDuration: string) => {
    setDuration(newDuration);
    setFormData((prev) => ({
      ...prev,
      custom_duration: newDuration,
    }));
  };

  const validateRequestedTime = () => {
    if (!requestedTime || !selectedSlot) return false;

    const requestedMinutes = timeToMinutes(requestedTime);
    const slotStartMinutes = timeToMinutes(selectedSlot.start);
    const slotEndMinutes = timeToMinutes(selectedSlot.end);
    const durationMinutes = Math.round(parseFloat(duration) * 60);

    if (
      requestedMinutes < slotStartMinutes ||
      requestedMinutes >= slotEndMinutes
    ) {
      return false;
    }

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

    if (endMinutes >= 24 * 60) return null;

    const hours = Math.floor(endMinutes / 60);
    const minutes = endMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {inquiry ? "Edit Inquiry" : "Create New Inquiry"}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-2">
              {updatedSections.map((section) => (
                <div
                  key={section.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-100 border border-blue-200"
                      : "bg-white hover:bg-gray-100"
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.completed && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {activeSection === section.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details Section */}
              {activeSection === "contact" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Customer Details</h3>
                  <CustomerSearch
                    onCustomerSelect={handleCustomerSelect}
                    onCustomerUpdate={handleCustomerUpdate}
                    selectedCustomer={selectedCustomer}
                    formData={formData}
                    inquiry={inquiry}
                    jobTypes={jobTypes}
                  />
                  

                  {/* Source Selection */}
                  <div>
                    <Label htmlFor="source">Source of Inquiry *</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => handleSelectChange("source", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Urgency */}
                  <div>
                    <Label htmlFor="custom_project_urgency">Project Urgency *</Label>
                    <Select
                      value={formData.custom_project_urgency}
                      onValueChange={(value) => handleSelectChange("custom_project_urgency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectUrgency?.map((urgency) => (
                          <SelectItem key={urgency.name} value={urgency.name}>
                            {urgency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Requirements */}
                  <div>
                    <Label htmlFor="custom_special_requirements">Special Requirements</Label>
                    <Textarea
                      id="custom_special_requirements"
                      name="custom_special_requirements"
                      value={formData.custom_special_requirements}
                      onChange={handleInputChange}
                      placeholder="Enter any special requirements"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Property Information Section */}
              {activeSection === "property" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Property Information</h3>
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
                </div>
              )}

              {/* Inspector Assignment Section */}
              {activeSection === "inspector" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Assign Inspector</h3>
                  <InspectionAssignment
                    date={date}
                    priority={priority}
                    selectedInspector={selectedInspector}
                    selectedSlot={selectedSlot}
                    requestedTime={requestedTime}
                    duration={duration}
                    showEndTimeWarning={showEndTimeWarning}
                    onDateSelect={handleDateSelect}
                    onPriorityChange={setPriority}
                    onInspectorSelect={handleInspectorSelect}
                    onSlotSelect={handleSlotSelect}
                    onTimeChange={handleTimeChange}
                    onDurationChange={handleDurationChange}
                    calculateEndTime={calculateEndTime}
                    validateRequestedTime={validateRequestedTime} onEndTimeWarningClose={function (): void {
                      throw new Error("Function not implemented.");
                    } }                  />
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Completed: {updatedSections.filter(s => s.completed).length} of {updatedSections.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || createTodoLoading}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !validateForm()}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Inquiry
            </Button>

            <Button
              type="button"
              onClick={handleAssignAndSave}
              disabled={loading || createTodoLoading || !selectedInspector}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {createTodoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <User className="h-4 w-4" />
              Assign & Save
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedInspector && (
        <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmAssignment}
        onCancel={() => setShowConfirmModal(false)}
        title="Confirm Inspector Assignment"
        message={`Are you sure you want to assign ${
          selectedInspector?.user_name
        } for the inspection on ${
          date ? format(date, "MMM dd, yyyy") : ""
        } at ${requestedTime}? Once assigned, customer details cannot be modified for this inquiry.`}
      />
      )}
    </div>
  );
};

export default InquiryForm;