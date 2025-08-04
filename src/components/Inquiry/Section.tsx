/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Phone,
  User
} from "lucide-react";
import {
  // type Lead,
  type LeadFormData,
} from "../../context/LeadContext";
import {
  budgetRanges,
  buildingTypes,
  // defaultFormData,
  // formatSubmissionData,
  propertyTypes,
  type FormSection,
  type PriorityLevel,
} from "../../helpers/helper";
// import { useAssignStore } from "../../store/assign";
import { Button } from "../ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "../ui/dialog";
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

// Extracted Section component for better organization
interface SectionProps {
  section: FormSection;
  activeSection: string;
  toggleSection: (sectionId: string) => void;
  formData: LeadFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDateChange: (name: string, date: Date | undefined) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneNumber: string;
  jobTypes: { name: string }[];
  projectUrgency: { name: string }[];
  utmSource: { name: string }[];
  inspectors: {
    full_name?: string | null;
    name: string;
  }[];
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
  showReferenceInput: boolean;
  searchQuery: string;
  searchResults: any[];
  showDropdown: boolean;
  isSearching: boolean;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCustomerSelect: (customer: any) => void;
  handleAddNewCustomer: () => void;
  fetchingCustomerDetails: boolean;
  fetchingLeadDetails: boolean;
}

export const Section: React.FC<SectionProps> = ({
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
  showReferenceInput,
  searchQuery,
  searchResults,
  showDropdown,
  isSearching,
  handleSearchChange,
  handleCustomerSelect,
  handleAddNewCustomer,
  fetchingCustomerDetails,
  fetchingLeadDetails,
}) => {
  // console.log("propertyArea:", getPropertyArea);
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
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
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
              <div className="space-y-2 col-span-1 md:col-span-3 relative">
                {" "}
                {/* Added relative here */}
                <Label
                  htmlFor="customer_search"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">
                    Customer{" "}
                    <span className="text-gray-500">(name/email/phone)</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {(fetchingCustomerDetails || fetchingLeadDetails) && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="customer_search"
                    name="customer_search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search by name, phone, or email"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 pr-10 text-black w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                    {" "}
                    {/* Changed to overflow-y-auto */}
                    {searchResults.length > 0 ? (
                      searchResults.map((customer) => (
                        <div
                          key={customer.name}
                          className="px-4 pt-2  hover:bg-gray-100 cursor-pointer flex items-center min-w-0"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="min-w-0 overflow-hidden flex-1">
                            {" "}
                            {/* Added flex-1 */}
                            <p className="font-medium truncate">
                              {customer.customer_name || customer.name}
                            </p>
                            <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 mt-1">
                              {" "}
                              {/* Changed to column on mobile */}
                              {customer.mobile_no && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.mobile_no}
                                  </span>
                                </span>
                              )}
                              {customer.email_id && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.email_id}
                                  </span>
                                </span>
                              )}
                              {customer.lead_name && (
                                <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs inline-flex items-center mt-1 sm:mt-0">
                                  Has Property
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0 ml-2">
                            Select
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between min-w-0"
                        onClick={handleAddNewCustomer}
                      >
                        <div className="min-w-0 overflow-hidden">
                          <p className="font-medium truncate">
                            No customers found for "{searchQuery}"
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            Click to add a new customer
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
                          Add New
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.lead_name && (
                <>
                  {/* <div>
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
                      placeholder="Enter Name"
                    />
                  </div> */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                      <span className="text-red-500"> *</span>
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
                      required
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
                      placeholder="Enter Email"
                    />
                  </div>
                </>
              )}
              <div>
                <label
                  htmlFor="utm_source"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Source Of Inquiry <span className="text-red-500">*</span>
                </label>

                <Select
                  value={formData.utm_source || ""}
                  onValueChange={(value) => {
                    handleSelectChange("utm_source", value);
                  }}
                >
                  <SelectTrigger
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    id="utm_source"
                  >
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {[...utmSource]
                      .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by name
                      .map((utms) => (
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

                {showReferenceInput && (
                  <div className="mt-4">
                    <label
                      htmlFor="custom_reference_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Reference Name <span className="text-red-500">*</span>
                    </label>
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

              <div>
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
            // In the PropertyAddressSection props
            <PropertyAddressSection
              formData={formData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              propertyTypes={propertyTypes}
              buildingTypes={buildingTypes}
              getPropertyArea={formData.custom_property_area || ""} // Use formData directly
            />
          )}

          {/* {section.id === "inspection" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={
                    date
                      ? format(date, "yyyy-MM-dd")
                      : formData.custom_preferred_inspection_date
                      ? new Date(formData.custom_preferred_inspection_date)
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
                  value={
                    formData.custom_preferred_inspection_time ||
                    getCurrentTime()
                  }
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )} */}
          {section.id === "additional" && (
            <div>
              <div className="grid grid-cols-12 gap-4 mb-2">
                {/* Date Field */}
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={
                        date
                          ? format(date, "yyyy-MM-dd")
                          : formData.custom_preferred_inspection_date
                          ? new Date(formData.custom_preferred_inspection_date)
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={
                        {
                          // Hide browser default icons
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        } as React.CSSProperties
                      }
                    />
                    {/* Custom Calendar Icon - Clickable */}
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        // Focus and click the input to trigger date picker
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
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Time Field */}
                <div className="col-span-6">
                  <label
                    htmlFor="custom_preferred_inspection_time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Time
                  </label>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      style={
                        {
                          // Hide browser default icons
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        } as React.CSSProperties
                      }
                    />
                    {/* Custom Clock Icon - Clickable */}
                    <div
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                      onClick={() => {
                        // Focus and click the input to trigger time picker
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
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

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
                          ? new Date(formData.custom_preferred_inspection_date)
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
                    (showReferenceInput && !formData.custom_reference_name)
                  }
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
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
        </div>
      </div>
    </div>
  );
};