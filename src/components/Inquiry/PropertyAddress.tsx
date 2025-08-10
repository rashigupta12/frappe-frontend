/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Plus, Search, Home, Edit } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
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
  };
}

interface AddressSearchResult {
  custom_property_category?: string;
  custom_emirate?: string;
  custom_area?: string;
  custom_community?: string;
  custom_street_name?: string;
  custom_property_number?: string;
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
  // For internal form state
  custom_uae_area?: string;
  custom_property_name__number?: string;
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
  } = fieldNames;

  const { emirates, fetchEmirates } = useLeads();

  // State for address search
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [addressSearchResults, setAddressSearchResults] = useState<
    AddressSearchResult[]
  >([]);
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState<AddressSearchResult>({
    custom_property_category: formData[propertyCategoryField] || "",
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

  // Area and community search states
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [isAreaSearching, setIsAreaSearching] = useState(false);
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [isCommunitySearching, setIsCommunitySearching] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchEmirates();
    fetchPropertyCategories();
  }, [fetchEmirates]);

  // Update address form when formData changes
  useEffect(() => {
    setAddressForm({
      custom_property_category: formData[propertyCategoryField] || "",
      custom_emirate: formData[emirateField] || "",
      custom_area: formData[areaField] || "",
      custom_community: formData[communityField] || "",
      custom_street_name: formData[streetNameField] || "",
      custom_property_number: formData[propertyNumberField] || "",
    });
  }, [
    formData,
    propertyCategoryField,
    emirateField,
    areaField,
    communityField,
    streetNameField,
    propertyNumberField,
  ]);

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
        "/api/resource/property Category"
      );
      console.log(response)
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
        const allResults: any[] = [];
        const addressEndpoint =
          "/api/method/eits_app.site_address_search.search_site_addresses";
        const queryLower = query.toLowerCase().trim();

        const searchPromises: Promise<any>[] = [];

        if (queryLower.length >= 2) {
          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_area=${encodeURIComponent(query)}`
              )
              .then((response) => ({
                type: "area",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "area", data: [] }))
          );

          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_community=${encodeURIComponent(
                  query
                )}`
              )
              .then((response) => ({
                type: "community",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "community", data: [] }))
          );

          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?custom_street_name=${encodeURIComponent(
                  query
                )}`
              )
              .then((response) => ({
                type: "street",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "street", data: [] }))
          );

          if (/^\d+$/.test(query)) {
            searchPromises.push(
              frappeAPI
                .makeAuthenticatedRequest(
                  "GET",
                  `${addressEndpoint}?custom_property_number=${encodeURIComponent(
                    query
                  )}`
                )
                .then((response) => ({
                  type: "property",
                  data: response.message?.data || [],
                }))
                .catch(() => ({ type: "property", data: [] }))
            );
          }

          const knownEmirates = [
            "dubai",
            "abu dhabi",
            "sharjah",
            "ajman",
            "umm al quwain",
            "ras al khaimah",
            "fujairah",
          ];

          if (
            knownEmirates.some(
              (emirate) =>
                emirate.includes(queryLower) ||
                queryLower.includes(emirate.replace(/\s/g, "")) ||
                emirate.toLowerCase() === queryLower
            )
          ) {
            searchPromises.push(
              frappeAPI
                .makeAuthenticatedRequest(
                  "GET",
                  `${addressEndpoint}?custom_emirate=${encodeURIComponent(
                    query
                  )}`
                )
                .then((response) => ({
                  type: "emirate",
                  data: response.message?.data || [],
                }))
                .catch(() => ({ type: "emirate", data: [] }))
            );
          }

          searchPromises.push(
            frappeAPI
              .makeAuthenticatedRequest(
                "GET",
                `${addressEndpoint}?search_term=${encodeURIComponent(query)}`
              )
              .then((response) => ({
                type: "combined_address",
                data: response.message?.data || [],
              }))
              .catch(() => ({ type: "combined_address", data: [] }))
          );

          const searchResults = await Promise.all(searchPromises);

          searchResults.forEach((result) => {
            if (result.data && Array.isArray(result.data)) {
              const transformedData = result.data.map((address: any) => ({
                ...address,
                search_type: "address",
                found_via: result.type,
                customer_name: address.site_name || generateCombinedAddress(address),
                address_details: {
                  emirate: address.custom_emirate,
                  area: address.custom_area,
                  community: address.custom_community,
                  street_name: address.custom_street_name,
                  property_number: address.custom_property_number,
                  combined_address: address.custom_combined_address || generateCombinedAddress(address),
                },
              }));
              allResults.push(...transformedData);
            }
          });
        }

        const uniqueResults = allResults.filter((result, index, self) => {
          return (
            index ===
            self.findIndex(
              (r) =>
                generateCombinedAddress(r) === generateCombinedAddress(result)
            )
          );
        });

        setAddressSearchResults(uniqueResults);
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
    const updates = {
      [propertyCategoryField]: address.custom_property_category || "",
      [emirateField]: address.custom_emirate || "",
      [areaField]: address.custom_area || "",
      [communityField]: address.custom_community || "",
      [streetNameField]: address.custom_street_name || "",
      [propertyNumberField]: address.custom_property_number || "",
    };

    Object.entries(updates).forEach(([field, value]) => {
      handleSelectChange(field, value);
    });

    setAddressForm({
      custom_property_category: address.custom_property_category || "",
      custom_emirate: address.custom_emirate || "",
      custom_area: address.custom_area || "",
      custom_community: address.custom_community || "",
      custom_street_name: address.custom_street_name || "",
      custom_property_number: address.custom_property_number || "",
    });

    const combinedAddress = generateCombinedAddress(address);
    handleSelectChange(propertyAreaField, combinedAddress);

    setAddressSearchQuery("");
    setAddressSearchResults([]);
    setShowAddressDropdown(false);
  };

  const handleOpenAddressDialog = () => {
    setShowAddressDialog(true);
  };

  const handleSaveAddress = () => {
    const updates = {
      [propertyCategoryField]: addressForm.custom_property_category || "",
      [emirateField]: addressForm.custom_emirate || "",
      [areaField]: addressForm.custom_area || "",
      [communityField]: addressForm.custom_community || "",
      [streetNameField]: addressForm.custom_street_name || "",
      [propertyNumberField]: addressForm.custom_property_number || "",
    };

    Object.entries(updates).forEach(([field, value]) => {
      handleSelectChange(field, value);
    });

    const combinedAddress = generateCombinedAddress(addressForm);
    handleSelectChange(propertyAreaField, combinedAddress);

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
        "/api/resource/property Category",
        {
          custom_title: newCategoryName.trim(),
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

  return (
    <div className="space-y-4">
      {/* Address Search - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Site Address
        </label>
        <div className="relative">
          <div className="flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by emirate, area, community, street name, or property number..."
              value={addressSearchQuery}
              onChange={handleAddressSearchChange}
              className="w-full pl-9 pr-10"
            />
            {isAddressSearching && (
              <Loader2 className="absolute right-3 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {showAddressDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
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
                            {address.customer_name ||
                              generateCombinedAddress(address)}
                          </p>
                          {generateCombinedAddress(address) && (
                            <div className="text-xs text-gray-500 mt-1 flex items-start">
                              <Home className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                              <span className="break-all">
                                {generateCombinedAddress(address)}
                              </span>
                            </div>
                          )}
                        </div>
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
                    <p className="text-xs text-gray-500">
                      Click to add a new address
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex-shrink-0">
                    Add New
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Combined Address Display - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Combined Address
        </label>
        <div className="relative">
          <Input
            type="text"
            value={formData[propertyAreaField] || ""}
            readOnly
            onClick={handleOpenAddressDialog}
            placeholder="Click to set address"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs shadow-sm bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100"
            title="Click to edit address details"
          />
          <button
            onClick={handleOpenAddressDialog}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            title="Edit address"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white">
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
                onValueChange={(value) => {
                  setAddressForm((prev) => ({
                    ...prev,
                    custom_property_category: value,
                  }));
                  setShowAddCategory(value === "Other");
                }}
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
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNewCategory}
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

            {/* Emirate */}
            <div className="space-y-2">
              <Label>Emirate</Label>
              <Select
                value={addressForm.custom_emirate || ""}
                onValueChange={(value) => {
                  setAddressForm((prev) => ({
                    ...prev,
                    custom_emirate: value,
                    custom_area: "", // Reset area when emirate changes
                    custom_community: "", // Reset community when emirate changes
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
                    const value = e.target.value;
                    setAddressForm((prev) => ({
                      ...prev,
                      custom_area: value,
                      custom_community: value ? prev.custom_community : "",
                    }));
                    if (addressForm.custom_emirate && value) {
                      searchAreas(addressForm.custom_emirate, value);
                    }
                  }}
                  className="w-full"
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
                      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
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
              <div className="relative">
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
                  className="w-full"
                />
                {isCommunitySearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {communityResults.length > 0 && (
                <div className="mt-1 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                  {communityResults.map((community) => (
                    <div
                      key={community.name}
                      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
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
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    custom_street_name: e.target.value,
                  }))
                }
                placeholder="Enter street name"
              />
            </div>

            {/* Property Number */}
            <div className="space-y-2">
              <Label>Property Number</Label>
              <Input
                type="text"
                value={addressForm.custom_property_number || ""}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    custom_property_number: e.target.value,
                  }))
                }
                placeholder="Enter property number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddressDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAddress}>Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyAddressSection;