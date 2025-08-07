/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
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

interface PropertyAddressSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  getPropertyArea?: string;
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

const PropertyAddressSection: React.FC<PropertyAddressSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  getPropertyArea,
  fieldNames = {},
}) => {
  // Destructure field names with defaults
  const {
    emirate: emirateField = 'custom_emirate',
    area: areaField = 'custom_area',
    community: communityField = 'custom_community',
    streetName: streetNameField = 'custom_street_name',
    propertyNumber: propertyNumberField = 'custom_property_name__number',
    propertyArea: propertyAreaField = 'custom_property_area',
    propertyCategory: propertyCategoryField = 'custom_property_category',
  } = fieldNames;

  const { emirates, fetchEmirates, addressLoading } = useLeads();

  // Local state for address components
  const [selectedEmirate, setSelectedEmirate] = useState<string>(formData[emirateField] || "");
  const [selectedArea, setSelectedArea] = useState<string>(formData[areaField] || "");
  const [selectedCommunity, setSelectedCommunity] = useState<string>(formData[communityField] || "");
  const [initialGetPropertyArea] = useState(getPropertyArea);

  // Area states
  const [areaSearchQuery, setAreaSearchQuery] = useState(formData[areaField] || "");
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [isAreaSearching, setIsAreaSearching] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);

  // Community states
  const [communitySearchQuery, setCommunitySearchQuery] = useState(formData[communityField] || "");
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [isCommunitySearching, setIsCommunitySearching] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [isAddingCommunity, setIsAddingCommunity] = useState(false);

  // Property category states
  const [propertyCategories, setPropertyCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchEmirates();
    fetchPropertyCategories();
  }, [fetchEmirates]);

  // Function to fetch property categories
  const fetchPropertyCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "GET",
        "/api/resource/property Category"
      );
      if (response.data) {
        setPropertyCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching property categories:", error);
      toast.error("Failed to load property categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Effect hook to dynamically pre-fill address fields from formData or initialGetPropertyArea
  useEffect(() => {
    setSelectedEmirate(formData[emirateField] || "");
    setSelectedArea(formData[areaField] || "");
    setSelectedCommunity(formData[communityField] || "");

    setAreaSearchQuery(formData[areaField] || "");
    setCommunitySearchQuery(formData[communityField] || "");

    // Handle the initial getPropertyArea for existing leads if formData is empty
    if (!formData[emirateField] && initialGetPropertyArea) {
      const parts = initialGetPropertyArea.split(",").map((part) => part.trim());
      if (parts.length >= 3) {
        const [emirate, area, community] = parts;
        setSelectedEmirate(emirate);
        setSelectedArea(area);
        setSelectedCommunity(community);
        setAreaSearchQuery(area);
        setCommunitySearchQuery(community);
      }
    }
  }, [formData, initialGetPropertyArea, emirateField, areaField, communityField]);

  // Non-debounced area search function
  const searchArea = useCallback(
    async (query: string) => {
      console.log('Searching for area:', query);
      if (!query.trim() || !selectedEmirate) {
        setAreaResults([]);
        setIsAreaSearching(false);
        setShowAreaDropdown(false);
        return;
      }

      setIsAreaSearching(true);
      setShowAreaDropdown(true);

      try {
        const url = `/api/method/eits_app.area_search.search_uae_areas`;
        const params = new URLSearchParams({
          area_name: query.trim(),
          emirate: selectedEmirate,
        });

        const response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `${url}?${params.toString()}`
        );
        console.log('Area search response:', response);

        if (response.message?.status === "success") {
          const results = response.message.data || [];
          console.log('Area results:', results);
          setAreaResults(results);
          setShowAreaDropdown(results.length > 0 || true); // Always show dropdown when searching
        } else {
          console.warn("Unexpected response format:", response);
          setAreaResults([]);
          setShowAreaDropdown(false);
        }
      } catch (error) {
        console.error("Error searching areas:", error);
        setAreaResults([]);
        setShowAreaDropdown(false);
        toast.error("Failed to search areas");
      } finally {
        setIsAreaSearching(false);
      }
    },
    [selectedEmirate]
  );

  // Non-debounced community search function
  const searchCommunity = useCallback(
    async (query: string) => {
      if (!query.trim() || !selectedArea) {
        setCommunityResults([]);
        setIsCommunitySearching(false);
        setShowCommunityDropdown(false);
        return;
      }

      setIsCommunitySearching(true);
      setShowCommunityDropdown(true);

      try {
        const response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.community_search.search_uae_communities?community_name=${encodeURIComponent(
            query
          )}&uae_area=${encodeURIComponent(selectedArea)}`
        );

        if (response.message?.status === "success") {
          const results = response.message.data || [];
          setCommunityResults(results);
          setShowCommunityDropdown(results.length > 0 || true); // Always show dropdown when searching
        } else {
          setCommunityResults([]);
          setShowCommunityDropdown(false);
        }
      } catch (error) {
        console.error("Community search error:", error);
        setCommunityResults([]);
        setShowCommunityDropdown(false);
      } finally {
        setIsCommunitySearching(false);
      }
    },
    [selectedArea]
  );

  // Handle area search input change - immediate search without debounce
  const handleAreaSearchChange = (value: string) => {
    setAreaSearchQuery(value);
    if (value === "") {
      setSelectedArea("");
      handleSelectChange(areaField, "");
      setAreaResults([]);
      setShowAreaDropdown(false);
    } else if (selectedEmirate) {
      searchArea(value);
    }
  };

  // Handle community search input change - immediate search without debounce
  const handleCommunitySearchChange = (value: string) => {
    setCommunitySearchQuery(value);
    if (value === "") {
      setSelectedCommunity("");
      handleSelectChange(communityField, "");
      setCommunityResults([]);
      setShowCommunityDropdown(false);
    } else if (selectedArea) {
      searchCommunity(value);
    }
  };

  // Function to combine address components
  const combineAddress = useCallback(
    (
      emirate: string,
      area: string,
      community: string,
      streetName: string,
      propertyNumber: string
    ): string => {
      const addressParts = [
        emirate,
        area,
        community,
        streetName,
        propertyNumber,
      ].filter((part) => part && part.trim() !== "");
      return addressParts.join(", ");
    },
    []
  );

  // Update combined address when components change
  useEffect(() => {
    const combinedAddress = combineAddress(
      formData[emirateField] || "",
      formData[areaField] || "",
      formData[communityField] || "",
      formData[streetNameField] || "",
      formData[propertyNumberField] || ""
    );

    if (combinedAddress !== formData[propertyAreaField]) {
      handleSelectChange(propertyAreaField, combinedAddress);
    }
  }, [
    formData,
    combineAddress,
    handleSelectChange,
    emirateField,
    areaField,
    communityField,
    streetNameField,
    propertyNumberField,
    propertyAreaField,
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback((value: string) => {
    setSelectedEmirate(value);
    handleSelectChange(emirateField, value);

    // Reset dependent fields
    setSelectedArea("");
    setAreaSearchQuery("");
    handleSelectChange(areaField, "");

    setSelectedCommunity("");
    setCommunitySearchQuery("");
    handleSelectChange(communityField, "");

    setAreaResults([]);
    setCommunityResults([]);
    setShowAreaDropdown(false);
    setShowCommunityDropdown(false);
  }, [handleSelectChange, emirateField, areaField, communityField]);

  // Handle area selection
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaSearchQuery(area);
    handleSelectChange(areaField, area);
    setAreaResults([]);
    setShowAreaDropdown(false);

    // Reset community when area changes
    setSelectedCommunity("");
    setCommunitySearchQuery("");
    handleSelectChange(communityField, "");
    setCommunityResults([]);
    setShowCommunityDropdown(false);
  };

  // Handle community selection
  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setCommunitySearchQuery(community);
    handleSelectChange(communityField, community);
    setCommunityResults([]);
    setShowCommunityDropdown(false);
  };

  // Handle adding new area
  const handleAddNewArea = async (areaName?: string) => {
    const areaToAdd = areaName || newAreaName;

    if (!areaToAdd.trim()) {
      toast.error("Please enter an area name");
      return;
    }

    if (!selectedEmirate) {
      toast.error("Please select an emirate first");
      return;
    }

    setIsAddingArea(true);
    try {
      const response = await frappeAPI.createArea({
        area_name: areaToAdd.trim(),
        emirate: selectedEmirate,
      });

      if (response) {
        toast.success("Area added successfully!");
        handleAreaSelect(areaToAdd.trim());
        setNewAreaName("");
      }
    } catch (error) {
      console.error("Error creating area:", error);
      toast.error("Failed to create area. Please try again.");
    } finally {
      setIsAddingArea(false);
    }
  };

  // Handle adding new community
  const handleAddNewCommunity = async (communityName?: string) => {
    const communityToAdd = communityName || newCommunityName;

    if (!communityToAdd.trim()) {
      toast.error("Please enter a community name");
      return;
    }

    if (!selectedArea) {
      toast.error("Please select an area first");
      return;
    }

    setIsAddingCommunity(true);
    try {
      const response = await frappeAPI.makeAuthenticatedRequest(
        "POST",
        "/api/resource/UAE Community",
        {
          community_name: communityToAdd.trim(),
          area: selectedArea,
        }
      );

      if (response.data) {
        toast.success("Community added successfully!");
        handleCommunitySelect(communityToAdd.trim());
        setNewCommunityName("");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community. Please try again.");
    } finally {
      setIsAddingCommunity(false);
    }
  };

  // Handle property category change
  const handlePropertyCategoryChange = (value: string) => {
    handleSelectChange(propertyCategoryField, value);
    setShowAddCategory(value === "Other");
  };

  // Handle adding new property category
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
        handleSelectChange(propertyCategoryField, newCategoryName.trim());
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

  // Get unique categories and check for "Other"
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
      {/* Property Category - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Property Category
        </label>
        <Select
          value={formData[propertyCategoryField] || ""}
          onValueChange={handlePropertyCategoryChange}
        >
          <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <SelectValue
              placeholder={
                isLoadingCategories ? "Loading..." : "Select property category"
              }
            />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {uniqueCategories.map((category) => (
              <SelectItem
                key={category.name}
                value={category.name}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
              >
                {category.name}
              </SelectItem>
            ))}
            {!hasOtherCategory && (
              <SelectItem
                value="Other"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
              >
                Other (Add New)
              </SelectItem>
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

      {/* Emirate - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Emirate
        </label>
        <Select value={selectedEmirate} onValueChange={handleEmirateChange}>
          <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <SelectValue
              placeholder={addressLoading ? "Loading..." : "Select emirate"}
            />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {emirates.map((emirate) => (
              <SelectItem
                key={emirate.name}
                value={emirate.name}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
              >
                {emirate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Area{" "}
          <span className="text-xs text-gray-500">
            (Please select Emirate first)
          </span>
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={
                !selectedEmirate ? "Select emirate first" : "Search for area..."
              }
              value={areaSearchQuery}
              onChange={(e) => handleAreaSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!selectedEmirate}
            />

            {/* Area dropdown - always show when there are results or searching */}
            {showAreaDropdown && (isAreaSearching || areaResults.length > 0) && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isAreaSearching ? (
                  <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : areaResults.length > 0 ? (
                  areaResults.map((area) => (
                    <div
                      key={area.name || area.area_name}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      onClick={() => {
                        console.log('Area selected:', area);
                        handleAreaSelect(area.area_name || area.name);
                      }}
                    >
                      {area.area_name || area.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No areas found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Area button */}
          {!isAreaSearching &&
            areaSearchQuery &&
            selectedEmirate &&
            areaResults.length === 0 &&
            !selectedArea && (
              <Button
                onClick={() => {
                  console.log('Adding new area:', areaSearchQuery);
                  handleAddNewArea(areaSearchQuery);
                }}
                disabled={isAddingArea || !areaSearchQuery.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
              >
                {isAddingArea ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Area
                  </>
                )}
              </Button>
            )}
        </div>
      </div>

      {/* Community - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Community{" "}
          <span className="text-xs text-gray-500">
            (Please select Area first)
          </span>
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={
                !selectedArea ? "Select area first" : "Search for community..."
              }
              value={communitySearchQuery}
              onChange={(e) => handleCommunitySearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!selectedArea}
            />

            {/* Community dropdown - always show when there are results or searching */}
            {showCommunityDropdown && (isCommunitySearching || communityResults.length > 0) && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isCommunitySearching ? (
                  <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : communityResults.length > 0 ? (
                  communityResults.map((community) => (
                    <div
                      key={community.name}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 cursor-pointer"
                      onClick={() => {
                        handleCommunitySelect(community.community_name);
                      }}
                    >
                      {community.community_name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No communities found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Community button */}
          {!isCommunitySearching &&
            communitySearchQuery &&
            selectedArea &&
            communityResults.length === 0 &&
            !selectedCommunity && (
              <Button
                onClick={() => handleAddNewCommunity(communitySearchQuery)}
                disabled={isAddingCommunity}
                className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
              >
                {isAddingCommunity ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Community
                  </>
                )}
              </Button>
            )}
        </div>
      </div>

      {/* Custom Street Name and Property Number - Single Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={streetNameField}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Custom Street Name
          </label>
          <Input
            type="text"
            id={streetNameField}
            name={streetNameField}
            value={formData[streetNameField] || ""}
            onChange={handleInputChange}
            placeholder="Enter street name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label
            htmlFor={propertyNumberField}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Property Number
          </label>
          <Input
            type="text"
            id={propertyNumberField}
            name={propertyNumberField}
            value={formData[propertyNumberField] || ""}
            onChange={handleInputChange}
            placeholder="Enter property number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Combined Address Display - Single Row */}
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Combined Address
        </label>
        <Input
          type="text"
          value={formData[propertyAreaField] || ""}
          readOnly
          placeholder="Address will be combined automatically"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
          title="This field is automatically generated from the address components above"
        />
      </div>
    </div>
  );
};

export default PropertyAddressSection;