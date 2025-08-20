/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Building,
  Home,
  Loader2,
  Mail,
  Phone,
  Search,
  User,
  UserPen,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";
import { useLeads } from "../../context/LeadContext";
import {
  capitalizeFirstLetter,
  formatSubmissionData,
} from "../../helpers/helper";
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
import { MultiSelectJobTypes } from "./MultiselectJobtypes";

interface CustomerData {
  customer_name: string;
  email_id: string;
  mobile_no: string;
  customer_id: string;
  lead_id: string;
  name: string;
  custom_jobtype?: string[];
  site_name?: string;
  address_details?: {
    emirate?: string;
    area?: string;
    community?: string;
    street_name?: string;
    property_number?: string;
    combined_address?: string;
    property_category?: string;
    property_type?: string;
  };
}

interface CustomerSearchProps {
  selectedCustomer: CustomerData | null;
  onCustomerSelect: (customer: CustomerData) => void;
  onCustomerClear: () => void;
  formData?: any;
  className?: string;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  selectedCustomer,
  onCustomerSelect,
  onCustomerClear,
  formData,
  className = "",
}) => {
  const { jobTypes, createLead, updateLead } = useLeads();

  // Refs for dropdown positioning
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Replace the customerForm state declaration
  const [customerForm, setCustomerForm] = useState<{
    name: string;
    email: string;
    phone: string;
    jobType: string[];
    lead_id: string;
  }>({
    name: "",
    email: "",
    phone: "+971 ",
    jobType: [],
    lead_id: "",
  });

  // Initialize job types when jobTypes change
  // Initialize job types when jobTypes change
  useEffect(() => {
    if (jobTypes.length > 0 && customerForm.jobType.length === 0) {
      setCustomerForm((prev) => ({
        ...prev,
        jobType: [jobTypes[0].name],
      }));
    }
  }, [customerForm.jobType.length, jobTypes]);

  // Initialize search query from selected customer
  useEffect(() => {
    if (selectedCustomer) {
      const displayText = `${selectedCustomer.customer_name}${
        selectedCustomer.mobile_no ? ` | ${selectedCustomer.mobile_no}` : ""
      }${selectedCustomer.email_id ? ` | ${selectedCustomer.email_id}` : ""}`;
      setSearchQuery(displayText);
    } else {
      setSearchQuery("");
    }
  }, [selectedCustomer]);

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;

    const inputRect = inputRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    setDropdownPosition({
      top: inputRect.bottom + scrollTop,
      left: inputRect.left + scrollLeft,
      width: inputRect.width,
    });
  }, []);

  // Update dropdown position when showing
  useEffect(() => {
    if (showDropdown) {
      calculateDropdownPosition();
      const handleResize = () => calculateDropdownPosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize);
      };
    }
  }, [showDropdown, calculateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Customer search function
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.site_address_search.search_site_addresses?search_term=${encodeURIComponent(
          query
        )}`
      );

      if (!response.message?.data) {
        throw new Error("Invalid response structure");
      }

      const results = response.message.data;
      const transformedResults = results.map((result: any) => {
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
            combined_address:
              result.custom_combine_address ||
              extractAddressFromSite(result.site_name),
            property_category: result.custom_property_category,
            property_type: result.custom_property_type,
          },
          match_info: result.match_info,
        };
      });

      setSearchResults(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchCustomers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (result: any) => {
    const customerData: CustomerData = {
      customer_name: result.customer_name,
      email_id: result.email_id || "",
      mobile_no: result.mobile_no || "+971 ",
      customer_id: result.name || "",
      lead_id: result.custom_lead_name || result.lead_details?.name || "",
      name: result.lead_details?.name || result.name || "",
      address_details: result.address_details,
    };

    onCustomerSelect(customerData);
    setShowDropdown(false);
  };

  // Utility functions
  const extractPhoneFromQuery = (query: string): string => {
    const phoneRegex = /(\+971\s?\d{1,2}\s?\d{3}\s?\d{4}|\d{9,10})/;
    const match = query.match(phoneRegex);
    if (match) {
      let phone = match[0];
      if (!phone.startsWith("+971")) {
        phone = "+971 " + phone.replace(/\D/g, "");
      }
      return phone;
    }
    return "+971 ";
  };

  const extractNameFromQuery = (query: string): string => {
    const phoneRegex = /(\+971\s?\d{1,2}\s?\d{3}\s?\d{4}|\d{9,10})/g;
    return query.replace(phoneRegex, "").trim();
  };

  const extractAddressFromSite = (siteName: string) => {
    if (!siteName) return "";
    const dashIndex = siteName.indexOf("-");
    if (dashIndex !== -1) {
      const afterDash = siteName.substring(dashIndex + 1);
      if (/^\d/.test(afterDash)) {
        return afterDash.trim();
      }
    }
    return siteName;
  };

  // Phone formatting
  const formatPhoneNumber = (input: string) => {
    if (!input.startsWith("+971 ")) {
      return "+971 ";
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

    return formattedNumber;
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    const extractedName = extractNameFromQuery(searchQuery);
    const extractedPhone = extractPhoneFromQuery(searchQuery);

    setCustomerForm({
      name: extractedName,
      email: "",
      phone: extractedPhone,
      jobType: jobTypes.length > 0 ? [jobTypes[0].name] : [],
      lead_id: "",
    });

    setModalMode("create");
    setShowCustomerModal(true);
    setShowDropdown(false);
  };
const handleOpenEditModal = () => {
  if (!selectedCustomer) return;

  setCustomerForm({
    name: selectedCustomer.customer_name || "",
    email: selectedCustomer.email_id || "",
    phone: selectedCustomer.mobile_no || "+971 ",
    jobType: (selectedCustomer.custom_jobtype as string[]) || 
             (formData?.custom_jobtype as string[]) || 
             [],
    lead_id: selectedCustomer.lead_id || selectedCustomer.name || "",
  });

  setModalMode("edit");
  setShowCustomerModal(true);
};


  // Form input handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({
      ...prev,
      [name]: name === "email" ? value : capitalizeFirstLetter(value),
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setCustomerForm((prev) => ({ ...prev, phone: formattedPhone }));
  };

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

  // Save/Update customer - FIXED VERSION
  const handleSaveCustomer = async () => {
    // Validation
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!customerForm.phone || customerForm.phone.length < 5) {
      toast.error("Valid mobile number is required");
      return;
    }

    if (!customerForm.jobType || customerForm.jobType.length === 0) {
      toast.error("At least one job type is required");
      return;
    }

    try {
      setIsCreatingCustomer(true);

      // Prepare the lead data using the same structure as InquiryForm
      const leadData = {
        lead_name: customerForm.name.trim(),
        email_id: customerForm.email || "",
        mobile_no: customerForm.phone,
        custom_job_type: customerForm.jobType, // This should match your API expectation
        custom_budget_range: formData?.custom_budget_range || "",
        custom_project_urgency: formData?.custom_project_urgency || "",
        source: formData?.source || "",
        custom_property_name__number:
          formData?.custom_property_name__number || "",
        custom_emirate: formData?.custom_emirate || "",
        custom_area: formData?.custom_area || "",
        custom_community: formData?.custom_community || "",
        custom_street_name: formData?.custom_street_name || "",
        custom_property_area: formData?.custom_property_area || "",
        custom_property_category: formData?.custom_property_category || "",
        custom_special_requirements:
          formData?.custom_special_requirements || "",
        custom_reference_name: formData?.custom_reference_name || "",
      };

      // Format the data using the same helper function as InquiryForm
      const formattedData = formatSubmissionData(leadData);

      let result;
      if (modalMode === "create") {
        result = await createLead(formattedData);
        if (!result) {
          throw new Error("Failed to create lead");
        }
      } else {
        result = await updateLead(customerForm.lead_id, formattedData);
        if (!result) {
          throw new Error("Failed to update lead");
        }
        // For update, the result might not include all fields, so merge with existing data
        result = {
          ...formattedData,
          ...result,
          name: result.name || customerForm.lead_id,
        };
      }

      // Create the customer data object for the parent component
      // Create the customer data object for the parent component
const updatedCustomer: CustomerData = {
  customer_name: result.lead_name || customerForm.name,
  email_id: result.email_id || customerForm.email,
  mobile_no: result.mobile_no || customerForm.phone,
  customer_id: result.name || customerForm.lead_id,
  lead_id: result.name || customerForm.lead_id,
  name: result.name || customerForm.lead_id,
  custom_jobtype: customerForm.jobType, // Ensure this is included
};

      // Update the parent component
      onCustomerSelect(updatedCustomer);
      setShowCustomerModal(false);

      // Update the search query display
      const displayText = `${updatedCustomer.customer_name}${
        updatedCustomer.mobile_no ? ` | ${updatedCustomer.mobile_no}` : ""
      }${updatedCustomer.email_id ? ` | ${updatedCustomer.email_id}` : ""}`;
      setSearchQuery(displayText);

      toast.success(
        `Lead "${customerForm.name}" ${
          modalMode === "create" ? "created" : "updated"
        } successfully!`
      );
    } catch (error) {
      console.error(
        `Error ${modalMode === "create" ? "creating" : "updating"} customer:`,
        error
      );

      // Better error handling
      let errorMessage = `Failed to ${modalMode} lead. Please try again.`;
      if (error && typeof error === "object") {
        if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        } else if ("error" in error) {
          errorMessage = (error as { error: string }).error;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Clear customer
  const handleClearCustomer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    onCustomerClear();
  };

  // Dropdown content component
  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 9999,
      }}
    >
      {isSearching ? (
        <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Searching customers...
        </div>
      ) : searchResults.length > 0 ? (
        <div className="overflow-y-auto max-h-[calc(60vh-100px)]">
          {searchResults.map((result, index) => (
            <div
              key={`customer-result-${index}`}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCustomerSelect(result)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium truncate text-gray-900">
                    {result.customer_name}
                  </p>
                  {(result.mobile_no || result.email_id) && (
                    <div className="text-xs text-gray-500 space-x-2 mt-1">
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
                  {result.site_name && (
                    <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                      <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="break-words text-xs leading-tight">
                          {extractAddressFromSite(result.site_name)}
                        </p>
                      </div>
                    </div>
                  )}
                  {(result.address_details?.property_category ||
                    result.address_details?.property_type) && (
                    <div className="mt-2 flex gap-2">
                      {result.address_details?.property_category && (
                        <span className="inline-flex items-center px-2 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Building className="h-3 w-3 mr-1" />
                          {result.address_details.property_category}
                        </span>
                      )}
                      {result.address_details?.property_type && (
                        <span className="inline-flex items-center px-2 rounded-full text-xs bg-green-100 text-green-800">
                          {result.address_details.property_type}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between border-t border-gray-100"
            onClick={handleOpenCreateModal}
          >
            <div>
              <p className="text-xs text-gray-500">
                Click to add a new customer
              </p>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
              Add New
            </span>
          </div>
        </div>
      ) : searchQuery ? (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          onClick={handleOpenCreateModal}
        >
          <div>
            <p className="font-medium">No customer found for "{searchQuery}"</p>
            <p className="text-xs text-gray-500">Click to add a new customer</p>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
            Add New
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="customer_search" className="text-gray-700">
        <div className="flex items-center gap-2 text-base font-medium">
          <User className="h-4 w-4 text-gray-500" />
          <span>
            Customer{" "}
            <span className="text-gray-500 font-normal">
              (name/email/phone)
            </span>
            <span className="text-red-500 ml-1">*</span>
          </span>
        </div>
      </Label>

      <div className="relative">
        {selectedCustomer ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between">
            <div className="flex-1 text-sm">
              <span className="font-medium">
                {selectedCustomer.customer_name}
              </span>
              {selectedCustomer.mobile_no && (
                <span className="text-gray-500">
                  {" "}
                  | {selectedCustomer.mobile_no}
                </span>
              )}
              {selectedCustomer.email_id && (
                <span className="text-gray-500">
                  {" "}
                  | {selectedCustomer.email_id}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="p-1 hover:bg-gray-200 rounded"
                title="Edit customer"
              >
                <UserPen className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={handleClearCustomer}
                className="p-1 hover:bg-gray-200 rounded"
                title="Clear customer"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
            <Input
              ref={inputRef}
              id="customer_search"
              name="customer_search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, phone or email"
              required
              className="pl-9 pr-10"
              onFocus={() => {
                if (searchQuery && !showDropdown) {
                  searchCustomers(searchQuery);
                }
              }}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-gray-500" />
            )}
          </div>
        )}
      </div>

      {/* Render dropdown as portal */}
      {showDropdown &&
        typeof document !== "undefined" &&
        createPortal(<DropdownContent />, document.body)}

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add New Lead" : "Edit Lead"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? "Fill in the details to add a new lead"
                : "Update the lead details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
                disabled={isCreatingCustomer}
              />
            </div>

            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                name="phone"
                value={customerForm.phone}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
                placeholder="+971 XX XXX XXXX"
                maxLength={17}
                required
                disabled={isCreatingCustomer}
              />
            </div>

            <div>
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Email
              </Label>
              <Input
                type="email"
                name="email"
                value={customerForm.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                disabled={isCreatingCustomer}
              />
            </div>

            <div className="space-y-2">
              <Label className="block text-md font-medium text-gray-700 mb-1">
                Job Types <span className="text-red-500">*</span>
              </Label>
              <MultiSelectJobTypes
                jobTypes={jobTypes}
                selectedJobTypes={customerForm.jobType}
                onSelectionChange={(selected: string[]) => {
                  setCustomerForm((prev) => ({
                    ...prev,
                    jobType: selected,
                  }));
                }}
                placeholder="Select job types"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomerModal(false)}
              disabled={isCreatingCustomer}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isCreatingCustomer}
            >
              {isCreatingCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modalMode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : modalMode === "create" ? (
                "Save Lead"
              ) : (
                "Update Lead"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSearch;
