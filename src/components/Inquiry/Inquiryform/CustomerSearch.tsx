/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Building,
  Home,
  Loader2,
  Mail,
  Phone,
  Search,
  User,
  UserPen,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
// import showToast from "react-hot-showToast";
import { frappeAPI } from "../../../api/frappeClient";
// import { useLeads } from "../../../context/LeadContext";
import {
  capitalizeFirstLetter,
  extractAddressFromSite,
  extractNameFromQuery,
  extractPhoneFromQuery,
  handleKeyDown,
} from "../../../helpers/helper";
import type {
  CustomerSearchResult,
  NewCustomerFormData,
} from "../../../types/inquiryFormdata";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { MultiSelectJobTypes } from "../MultiselectJobtypes";
import type { Lead } from "../../../context/LeadContext";
import { showToast } from "../../../helpers/comman";

interface CustomerSearchProps {
  selectedCustomer: CustomerSearchResult | null;
  onCustomerSelect: (customer: CustomerSearchResult | null) => void;
  onCustomerUpdate: (customerData: any) => void;
  inquiry?: Lead | null;
  jobTypes: any[];
  formData: any;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  selectedCustomer,
  onCustomerSelect,
  onCustomerUpdate,
  jobTypes,
  formData,
}) => {
  // const { createLead, updateLead } = useLeads();

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [customerForm, setCustomerForm] = useState<NewCustomerFormData>({
    name: "",
    email: "",
    phone: "+971 ",
    jobType: jobTypes.length > 0 ? [jobTypes[0].name] : [],
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize search query when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(selectedCustomer.customer_name);
    }
  }, [selectedCustomer]);

  // Update dropdown position when shown
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
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
      setShowDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(capitalizeFirstLetter(query));

    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    setSearchTimeout(
      setTimeout(() => {
        searchCustomers(query);
      }, 300)
    );
  };

  const handleCustomerSelect = async (result: CustomerSearchResult) => {
    onCustomerSelect(result);
    setSearchQuery(result.customer_name);
    setShowDropdown(false);
  };

  const handleClearCustomer = () => {
    onCustomerSelect(null);
    setSearchQuery("");
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setCustomerForm({
      name: extractNameFromQuery(searchQuery),
      email: "",
      phone: extractPhoneFromQuery(searchQuery),
      jobType: jobTypes.length > 0 ? [jobTypes[0].name] : [],
    });
    setShowCustomerModal(true);
    setShowDropdown(false);
  };

  const handleOpenEditModal = () => {
    if (!selectedCustomer) return;

    setModalMode("edit");
    setCustomerForm({
      name: selectedCustomer.customer_name,
      email: selectedCustomer.email_id || "",
      phone: selectedCustomer.mobile_no || "+971 ",
      jobType:
        formData.custom_jobtype ||
        (jobTypes.length > 0 ? [jobTypes[0].name] : []),
    });
    setShowCustomerModal(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input.startsWith("+971 ")) {
      setCustomerForm((prev) => ({ ...prev, phone: "+971 " }));
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

    setCustomerForm((prev) => ({ ...prev, phone: formattedNumber }));
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name.trim()) {
      showToast.error("Customer name is required");
      return;
    }

    if (!customerForm.phone || customerForm.phone.length < 5) {
      showToast.error("Valid mobile number is required");
      return;
    }

    try {
      setIsCreatingCustomer(true);

      const updatedCustomer = {
        customer_name: customerForm.name.trim(),
        mobile_no: customerForm.phone,
        email_id: customerForm.email || "",
        name: selectedCustomer?.name || "",
        lead_name: selectedCustomer?.lead_name || "",
      };

      // Call the parent component's update handler
      onCustomerUpdate({
        customer: updatedCustomer,
        jobType: customerForm.jobType,
        mode: modalMode,
      });

      onCustomerSelect(updatedCustomer);
      setSearchQuery(updatedCustomer.customer_name);
      setShowCustomerModal(false);
      setCustomerForm({
        name: "",
        email: "",
        phone: "+971 ",
        jobType: [],
      });

      showToast.success(`Customer details ${modalMode === "create" ? "created" : "updated"}`);
      
    } catch (error) {
      console.error("Error saving customer:", error);
      showToast.error(`Failed to ${modalMode === "create" ? "create" : "update"} customer`);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

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
    <>
      <div className="space-y-2 col-span-1 md:col-span-3 relative">
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
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between capitalize">
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
      </div>

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
                onChange={(e) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    name: capitalizeFirstLetter(e.target.value),
                  }))
                }
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
                onChange={(e) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
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
    </>
  );
};

export default CustomerSearch;