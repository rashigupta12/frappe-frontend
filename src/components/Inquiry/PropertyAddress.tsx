/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Plus, Search, Home, Edit, MapPin } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";
import { frappeAPI } from "../../api/frappeClient";
import { useLeads } from "../../context/LeadContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { capitalizeFirstLetter } from "../../helpers/helper";

interface PropertyAddressSectionProps {
  formData: any;
  handleSelectChange: (name: string, value: string) => void;
  fieldNames?: {
    emirate?: string;
    area?: string;
    community?: string;
    streetName?: string;
    propertyNumber?: string;
    propertyArea?: string;
    propertyCategory?: string;
    propertyType?: string;
  };
}

interface AddressSearchResult {
  custom_property_category?: string;
  custom_emirate?: string;
  custom_area?: string;
  custom_community?: string;
  custom_street_name?: string;
  custom_property_number?: string;
  custom_property_type?: string;
  name?: string;
  custom_combined_address?: string;
  search_type?: string;
  found_via?: string;
  customer_name?: string;
  mobile_no?: string;
  email_id?: string;
  lead_name?: string;
  address_details?: any;
  site_name?: string;
}

const PropertyAddressSection: React.FC<PropertyAddressSectionProps> = ({
  formData,
  handleSelectChange,
  fieldNames = {},
}) => {
  // Destructure field names with defaults
  const {
    emirate: emirateField = "custom_emirate",
    area: areaField = "custom_area",
    community: communityField = "custom_community",
    streetName: streetNameField = "custom_street_name",
    propertyNumber: propertyNumberField = "custom_property_number",
    propertyArea: propertyAreaField = "custom_property_area",
    propertyCategory: propertyCategoryField = "custom_property_category",
    propertyType: propertyTypeField = "custom_property_type",
  } = fieldNames;

  const { emirates, fetchEmirates } = useLeads();

  // Refs for dropdown positioning
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State for address search
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [addressSearchResults, setAddressSearchResults] = useState<
    AddressSearchResult[]
  >([]);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Address form state
  const [addressForm, setAddressForm] = useState<AddressSearchResult>({
    custom_property_category: formData[propertyCategoryField] || "",
    custom_property_type: formData[propertyTypeField] || "",
    custom_emirate: formData[emirateField] || "",
    custom_area: formData[areaField] || "",
    custom_community: formData[communityField] || "",
    custom_street_name: formData[streetNameField] || "",
    custom_property_number: formData[propertyNumberField] || "",
  });

  // Property category states
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Property type states
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Area and community search states
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [isAreaSearching, setIsAreaSearching] = useState(false);
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [isCommunitySearching, setIsCommunitySearching] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [isAddingType, setIsAddingType] = useState(false);

  // Calculate dropdown position when it should be shown
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
    if (showAddressDropdown) {
      calculateDropdownPosition();
      // Recalculate on scroll or resize
      const handleResize = () => calculateDropdownPosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize);
      };
    }
  }, [showAddressDropdown, calculateDropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowAddressDropdown(false);
      }
    };

    if (showAddressDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddressDropdown]);

  // Fetch initial data
  useEffect(() => {
    fetchEmirates();
    fetchPropertyCategories();
  }, [fetchEmirates]);

  // Update address form when formData changes
  useEffect(() => {
    setAddressForm({
      custom_property_category: formData[propertyCategoryField] || "",
      custom_property_type: formData[propertyTypeField] || "",
      custom_emirate: formData[emirateField] || "",
      custom_area: formData[areaField] || "",
      custom_community: formData[communityField] || "",
      custom_street_name: formData[streetNameField] || "",
      custom_property_number: formData[propertyNumberField] || "",
    });

    // Set the search query to the combined address if it exists
    if (formData[propertyAreaField]) {
      setAddressSearchQuery(formData[propertyAreaField]);
    }
  }, [
    formData,
    propertyCategoryField,
    propertyTypeField,
    emirateField,
    areaField,
    communityField,
    streetNameField,
    propertyNumberField,
    propertyAreaField,
  ]);

  // Fetch property types when category changes
  useEffect(() => {
    if (addressForm.custom_property_category) {
      fetchPropertyTypes(addressForm.custom_property_category);
    } else {
      setPropertyTypes([]);
    }
  }, [addressForm.custom_property_category]);

  // Function to generate combined address from available fields
  const generateCombinedAddress = useCallback(
    (address: AddressSearchResult) => {
      const addressParts = [
        address.custom_emirate,
        address.custom_area,
        address.custom_community,
        address.custom_street_name,
        address.custom_property_number,
      ].filter((part) => part && part.trim() !== "");

      return addressParts.join(", ");
    },
    []
  );

  // Function to fetch property categories
  const fetchPropertyCategories = async () => {
    setIsAddingCategory(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        "/api/resource/Category"
      );
      if (response.data) {
        setPropertyCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching property categories:", error);
      toast.error("Failed to load property categories");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // Function to fetch property types based on category
  const fetchPropertyTypes = async (category: string) => {
    if (!category) {
      setPropertyTypes([]);
      return;
    }

    setIsLoadingTypes(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/resource/Type?filters=[["category","=","${category}"]]`
      );
      if (response.data) {
        setPropertyTypes(response.data);
      } else {
        setPropertyTypes([]);
      }
    } catch (error) {
      console.error("Error fetching property types:", error);
      toast.error("Failed to load property types");
      setPropertyTypes([]);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  // Enhanced address search function
  const searchAddresses = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setAddressSearchResults([]);
        setIsAddressSearching(false);
        setShowAddressDropdown(false);
        return;
      }

      setIsAddressSearching(true);
      setShowAddressDropdown(true);

      try {
        const response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.site_address_search.search_site_addresses?search_term=${encodeURIComponent(
            query
          )}`
        );

        if (response.message?.status === "success") {
          // Filter unique addresses based on combined address
          const uniqueResults = response.message.data.reduce(
            (acc: AddressSearchResult[], current: AddressSearchResult) => {
              const combined =
                current.custom_combined_address ||
                generateCombinedAddress(current);
              const isDuplicate = acc.some(
                (item) =>
                  (item.custom_combined_address ||
                    generateCombinedAddress(item)) === combined
              );
              if (!isDuplicate) {
                acc.push({
                  ...current,
                  search_type: "address",
                  found_via: "combined",
                  address_details: {
                    emirate: current.custom_emirate,
                    area: current.custom_area,
                    community: current.custom_community,
                    street_name: current.custom_street_name,
                    property_number: current.custom_property_number,
                    combined_address: combined,
                    custom_combined_address: current.custom_combined_address,
                    propertycategory: current.custom_property_category,
                    propertytype: current.custom_property_type,
                  },
                });
              }
              return acc;
            },
            []
          );

          setAddressSearchResults(uniqueResults);
        } else {
          setAddressSearchResults([]);
        }
      } catch (error) {
        console.error("Address search error:", error);
        setAddressSearchResults([]);
        toast.error("Failed to search addresses. Please try again.");
      } finally {
        setIsAddressSearching(false);
      }
    },
    [generateCombinedAddress]
  );

  const handleAddressSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setAddressSearchQuery(query);

    if (query === "") {
      setAddressSearchResults([]);
      setShowAddressDropdown(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchAddresses(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleAddressSelect = (address: AddressSearchResult) => {
    const combinedAddress =
      address.custom_combined_address || generateCombinedAddress(address);

    const updates = {
      [propertyCategoryField]: address.custom_property_category || "",
      [propertyTypeField]: address.custom_property_type || "",
      [emirateField]: address.custom_emirate || "",
      [areaField]: address.custom_area || "",
      [communityField]: address.custom_community || "",
      [streetNameField]: address.custom_street_name || "",
      [propertyNumberField]: address.custom_property_number || "",
      [propertyAreaField]: combinedAddress,
    };

    Object.entries(updates).forEach(([field, value]) => {
      handleSelectChange(field, value);
    });

    setAddressForm({
      custom_property_category: address.custom_property_category || "",
      custom_property_type: address.custom_property_type || "",
      custom_emirate: address.custom_emirate || "",
      custom_area: address.custom_area || "",
      custom_community: address.custom_community || "",
      custom_street_name: address.custom_street_name || "",
      custom_property_number: address.custom_property_number || "",
    });

    setAddressSearchQuery(combinedAddress);
    setAddressSearchResults([]);
    setShowAddressDropdown(false);
  };

  const handleOpenAddressDialog = () => {
    setShowAddressDialog(true);
    setShowAddressDropdown(false);
  };

  // Update the handleSaveAddress function to use this:
  const handleSaveAddress = () => {
    const combinedAddress = generateCombinedAddress(addressForm);

    const updates = {
      [propertyCategoryField]: addressForm.custom_property_category || "",
      [propertyTypeField]: addressForm.custom_property_type || "",
      [emirateField]: addressForm.custom_emirate || "",
      [areaField]: addressForm.custom_area || "",
      [communityField]: addressForm.custom_community || "",
      [streetNameField]: addressForm.custom_street_name || "",
      [propertyNumberField]: addressForm.custom_property_number || "",
      [propertyAreaField]: combinedAddress,
    };

    Object.entries(updates).forEach(([field, value]) => {
      handleSelectChange(field, value);
    });

    setAddressSearchQuery(combinedAddress);
    setShowAddressDialog(false);
    toast.success("Address updated successfully");
  };

  const searchAreas = async (emirate: string, query: string) => {
    if (!emirate || !query.trim()) {
      setAreaResults([]);
      return;
    }

    setIsAreaSearching(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.area_search.search_uae_areas?area_name=${encodeURIComponent(
          query
        )}&emirate=${encodeURIComponent(emirate)}`
      );

      if (response.message?.status === "success") {
        setAreaResults(response.message.data || []);
      } else {
        setAreaResults([]);
      }
    } catch (error) {
      console.error("Area search error:", error);
      setAreaResults([]);
    } finally {
      setIsAreaSearching(false);
    }
  };

  const searchCommunities = async (area: string, query: string) => {
    if (!area || !query.trim()) {
      setCommunityResults([]);
      return;
    }

    setIsCommunitySearching(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        `/api/method/eits_app.community_search.search_uae_communities?community_name=${encodeURIComponent(
          query
        )}&uae_area=${encodeURIComponent(area)}`
      );

      if (response.message?.status === "success") {
        setCommunityResults(response.message.data || []);
      } else {
        setCommunityResults([]);
      }
    } catch (error) {
      console.error("Community search error:", error);
      setCommunityResults([]);
    } finally {
      setIsCommunitySearching(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    setIsAddingCategory(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/Category",
        {
          property_category: newCategoryName.trim(),
        }
      );

      if (response.data) {
        toast.success("Property category added successfully!");
        await fetchPropertyCategories();
        setAddressForm((prev) => ({
          ...prev,
          custom_property_category: newCategoryName.trim(),
        }));
        setNewCategoryName("");
        setShowAddCategory(false);
      }
    } catch (error) {
      console.error("Error creating property category:", error);
      toast.error("Failed to create property category. Please try again.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleAddNewType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Please enter a type name");
      return;
    }

    if (!addressForm.custom_property_category) {
      toast.error("Please select a property category first");
      return;
    }

    setIsAddingType(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/Type",
        {
          category: addressForm.custom_property_category,
          type: newTypeName.trim(),
        }
      );

      if (response.data) {
        toast.success("Property type added successfully!");
        await fetchPropertyTypes(addressForm.custom_property_category);
        setAddressForm((prev) => ({
          ...prev,
          custom_property_type: newTypeName.trim(),
        }));
        setNewTypeName("");
        setShowAddType(false);
      }
    } catch (error) {
      console.error("Error creating property type:", error);
      toast.error("Failed to create property type. Please try again.");
    } finally {
      setIsAddingType(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setAddressForm((prev) => ({
      ...prev,
      custom_property_category: value,
      custom_property_type: "", // Reset property type when category changes
    }));
    setShowAddCategory(value === "Other");
  };

  const getUniqueCategories = () => {
    const uniqueCategories = propertyCategories.filter(
      (category, index, self) =>
        index === self.findIndex((c) => c.name === category.name)
    );

    const hasOtherCategory = uniqueCategories.some(
      (cat) => cat.name.toLowerCase() === "other"
    );

    const sortedCategories = uniqueCategories.sort((a, b) => {
      if (a.name.toLowerCase() === "other") return 1;
      if (b.name.toLowerCase() === "other") return -1;
      return a.name.localeCompare(b.name);
    });

    return { uniqueCategories: sortedCategories, hasOtherCategory };
  };

  const { uniqueCategories, hasOtherCategory } = getUniqueCategories();

  // Fixed handlers for clear and edit buttons
  const handleClearAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddressSearchQuery("");
    setAddressSearchResults([]);
    setShowAddressDropdown(false);

    // Clear all address-related fields
    const clearUpdates = {
      [propertyCategoryField]: "",
      [propertyTypeField]: "",
      [emirateField]: "",
      [areaField]: "",
      [communityField]: "",
      [streetNameField]: "",
      [propertyNumberField]: "",
      [propertyAreaField]: "",
    };

    Object.entries(clearUpdates).forEach(([field, value]) => {
      handleSelectChange(field, value);
    });

    // Also clear the address form state
    setAddressForm({
      custom_property_category: "",
      custom_property_type: "",
      custom_emirate: "",
      custom_area: "",
      custom_community: "",
      custom_street_name: "",
      custom_property_number: "",
    });
  };

  const handleEditAddress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenAddressDialog();
  };

  // Check if we have a valid address - improved logic
  const hasValidAddress = Boolean(
    (formData[propertyAreaField] && formData[propertyAreaField].trim()) ||
      (addressSearchQuery && addressSearchQuery.trim())
  );

  // Dropdown component that will be rendered as portal
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
      {isAddressSearching ? (
        <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Searching addresses...
        </div>
      ) : addressSearchResults.length > 0 ? (
        <div className="overflow-y-auto max-h-[calc(60vh-100px)]">
          {addressSearchResults.map((address, index) => (
            <div
              key={`address-${index}`}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleAddressSelect(address)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {address.custom_combined_address ||
                      generateCombinedAddress(address)}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <div className="flex items-start">
                      <Home className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                      <span className="break-all">
                        {address.custom_combined_address ||
                          generateCombinedAddress(address)}
                      </span>
                    </div>

                    {/* Property info below address */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {address.custom_property_category && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {address.custom_property_category}
                        </span>
                      )}
                      {address.custom_property_type && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {address.custom_property_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* <div className="flex items-center sp">
                  {address.custom_property_category && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {address.custom_property_category}
                    </span>
                  )}
                  {address.custom_property_type && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {address.custom_property_type}
                    </span>
                  )}
                  </div> */}
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2 flex-shrink-0">
                  {address.found_via}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : addressSearchQuery ? (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          onClick={handleOpenAddressDialog}
        >
          <div>
            <p className="font-medium">
              No addresses found for "{addressSearchQuery}"
            </p>
            <p className="text-xs text-gray-500">Click to add a new address</p>
          </div>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
            Add New
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Address Search - Single Field */}
      <div className="w-full">
        <label className="block text-sm font-medium text-black mb-1">
          <MapPin className="inline-block mr-1 pb-1 h-4 w-4 text-black" />
          Site Address
        </label>
        <div className="relative">
          <div className="flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400 " />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by emirate, area, community, street name, or property number..."
              value={addressSearchQuery}
              onChange={handleAddressSearchChange}
              className="w-full pl-9 pr-20 capitalize"
              onFocus={() => {
                if (addressSearchQuery && !showAddressDropdown) {
                  searchAddresses(addressSearchQuery);
                }
              }}
            />

            {/* Action buttons container */}
            <div className="absolute right-3 flex items-center space-x-1 z-10">
              {isAddressSearching && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}

              {/* Always show buttons when we have any address data or search query */}
              {!isAddressSearching &&
                (hasValidAddress || addressSearchQuery.trim()) && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditAddress}
                      className="text-black hover:text-blue-500  p-1 flex-shrink-0"
                      title="Edit address"
                    >
                      <Edit className="h-4 w-4 " />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAddress}
                      className="text-black hover:text-gray-600 p-1 flex-shrink-0"
                      title="Clear address"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* Render dropdown as portal to avoid clipping */}
        {showAddressDropdown &&
          typeof document !== "undefined" &&
          createPortal(<DropdownContent />, document.body)}
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[600px] bg-[#eef0f2]">
          <DialogHeader>
            <DialogTitle>
              {addressSearchQuery ? "Add New Address" : "Edit Address"}
            </DialogTitle>
            <DialogDescription>
              {addressSearchQuery
                ? "Fill in the details to add a new address"
                : "Update the address details below"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Property Category */}
            <div className="space-y-2">
              <Label>Property Category</Label>
              <Select
                value={addressForm.custom_property_category || ""}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select property category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                  {!hasOtherCategory && (
                    <SelectItem value="Other">Other (Add New)</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {showAddCategory && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter new category name"
                    value={newCategoryName}
                    onChange={(e) => {
                      const value = e.target.value;

                      // allow only if empty OR contains at least one letter or digit
                      const hasAlphaNumeric = /[a-zA-Z0-9]/.test(value);

                      if (value === "" || hasAlphaNumeric) {
                        setNewCategoryName(capitalizeFirstLetter(value));
                      }
                    }}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddNewCategory();
                    }}
                    disabled={isAddingCategory || !newCategoryName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isAddingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={addressForm.custom_property_type || ""}
                onValueChange={(value) => {
                  if (value === "Other") {
                    setShowAddType(true);
                  } else {
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_property_type: value,
                    }));
                    setShowAddType(false);
                  }
                }}
                disabled={
                  !addressForm.custom_property_category || isLoadingTypes
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !addressForm.custom_property_category
                        ? "Select property category first"
                        : isLoadingTypes
                        ? "Loading property types..."
                        : "Select property type"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {propertyTypes.length > 0 ? (
                    <>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other (Add New)</SelectItem>
                    </>
                  ) : (
                    addressForm.custom_property_category &&
                    !isLoadingTypes && (
                      <SelectItem value="Other">Other (Add New)</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {showAddType && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter new type name"
                    value={newTypeName}
                    onChange={(e) => {
                      const value = e.target.value;

                      // allow only if empty OR contains at least one letter or digit
                      const hasAlphaNumeric = /[a-zA-Z0-9]/.test(value);

                      if (value === "" || hasAlphaNumeric) {
                        setNewTypeName(capitalizeFirstLetter(value));
                      }
                    }}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewType();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddNewType();
                    }}
                    disabled={isAddingType || !newTypeName.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isAddingType ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {isLoadingTypes && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading property types...
                </div>
              )}
            </div>

            {/* Emirate */}
            <div className="space-y-2">
              <Label>Emirate</Label>
              <Select
                value={addressForm.custom_emirate || ""}
                onValueChange={(value) => {
                  setAddressForm((prev) => ({
                    ...prev,
                    custom_emirate: value,
                    custom_area: "",
                    custom_community: "",
                  }));
                }}
              >
                <SelectTrigger className="w-full ">
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent className="bg-white ">
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate.name} value={emirate.name}>
                      {emirate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label>Area</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={
                    !addressForm.custom_emirate
                      ? "Select emirate first"
                      : "Search for area..."
                  }
                  value={addressForm.custom_area || ""}
                  onChange={(e) => {
                    const value = capitalizeFirstLetter(e.target.value);
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_area: value,
                      custom_community: value ? prev.custom_community : "",
                    }));
                    if (addressForm.custom_emirate && value) {
                      searchAreas(addressForm.custom_emirate, value);
                    }
                  }}
                  className="w-full text-sm"
                />
                {isAreaSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {areaResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                  {areaResults.map((area) => (
                    <div
                      key={area.name}
                      className="px-3 py-2  hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setAddressForm((prev) => ({
                          ...prev,
                          custom_area: area.area_name || area.name,
                          custom_community: "",
                        }));
                        setAreaResults([]);
                      }}
                    >
                      {area.area_name || area.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Community */}
            <div className="space-y-2">
              <Label>Community</Label>
              <div className="relative text-sm">
                <Input
                  type="text"
                  placeholder={
                    !addressForm.custom_area
                      ? "Select area first"
                      : "Search for community..."
                  }
                  value={addressForm.custom_community || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_community: value,
                    }));
                    if (addressForm.custom_area && value) {
                      searchCommunities(addressForm.custom_area, value);
                    }
                  }}
                  className="w-full text-sm"
                />
                {isCommunitySearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {communityResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto capitalize">
                  {communityResults.map((community) => (
                    <div
                      key={community.name}
                      className="px-3 py-2  hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setAddressForm((prev) => ({
                          ...prev,
                          custom_community: community.community_name,
                        }));
                        setCommunityResults([]);
                      }}
                    >
                      {community.community_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Street Name */}
            <div className="space-y-2">
              <Label>Street Name</Label>
              <Input
                type="text"
                value={addressForm.custom_street_name || ""}
                onChange={(e) => {
                  const value = e.target.value;

                  // allow only if empty OR contains at least one letter or digit
                  const hasAlphaNumeric = /[a-zA-Z0-9]/.test(value);

                  if (value === "" || hasAlphaNumeric) {
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_street_name: capitalizeFirstLetter(value),
                    }));
                  }
                }}
                placeholder="Enter street name"
                className="text-sm capitalize"
              />
            </div>

            {/* Property Number */}
            <div className="space-y-2">
              <Label>Property Number</Label>
              <Input
                type="text"
                value={addressForm.custom_property_number || ""}
                onChange={(e) => {
                  const value = e.target.value;

                  // allow only if empty OR contains at least one letter or digit
                  const hasAlphaNumeric = /[a-zA-Z0-9]/.test(value);

                  if (value === "" || hasAlphaNumeric) {
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_property_number: capitalizeFirstLetter(value),
                    }));
                  }
                }}
                placeholder="Enter property number"
                className="text-sm capitalize"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row">
            <Button
              variant="outline"
              className="w-[50%]"
              onClick={() => setShowAddressDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAddress}
              variant="outline"
              className="bg-green-700 text-white w-[50%]"
            >
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyAddressSection;
