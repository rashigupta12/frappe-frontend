import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Building,
  Home,
  Loader2,
  Mail,
  Phone,
  Search,
  // User,
  UserPen,
  X
} from "lucide-react";
import type { LeadFormData } from "../../../context/LeadContext";
import { capitalizeFirstLetter, extractAddressFromSite } from "../../../helpers/helper";
import type { CustomerSearchResult } from "../../../types/inquiryFormdata";
import { Input } from "../../ui/input";
// import { Label } from "../../ui/label";

interface CustomerSearchSectionProps {
  selectedCustomer: CustomerSearchResult | null;
  searchQuery: string;
  searchResults: CustomerSearchResult[];
  isSearching: boolean;
  showDropdown: boolean;
  dropdownPosition: { top: number; left: number; width: number };
  showReferenceInput: boolean;
  formData: LeadFormData;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomerSelect: (result: CustomerSearchResult) => void;
  onClearCustomer: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setDropdownPosition: (position: { top: number; left: number; width: number }) => void;
}

export const CustomerSearchSection: React.FC<CustomerSearchSectionProps> = ({
  selectedCustomer,
  searchQuery,
  searchResults,
  isSearching,
  showDropdown,
  dropdownPosition,
  // showReferenceInput,
  // formData,
  onSearchChange,
  onCustomerSelect,
  onClearCustomer,
  onOpenCreateModal,
  onOpenEditModal,
  // handleInputChange,
  setDropdownPosition,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showDropdown, searchResults, setDropdownPosition]);

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto z-50"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: '300px',
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
              onClick={() => onCustomerSelect(result)}
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
            onClick={onOpenCreateModal}
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
          onClick={onOpenCreateModal}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2 col-span-1 md:col-span-3 relative">
        {/* <Label htmlFor="customer_search" className="text-gray-700">
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
        </Label> */}

        <div className="relative">
          {selectedCustomer ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-between">
              <div className="flex-1 text-sm">
                <span className="font-medium">
                  {capitalizeFirstLetter(selectedCustomer.customer_name)}
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
                  onClick={onOpenEditModal}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Edit customer"
                >
                  <UserPen className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={onClearCustomer}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Clear customer"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-gray-400 z-10" />
              <Input
                ref={inputRef}
                id="customer_search"
                name="customer_search"
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search by Customer Name, Phone or Email"
                required
                className="pl-9 pr-10"
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

      
    </div>
  );
};