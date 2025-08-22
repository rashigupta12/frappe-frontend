
/* eslint-disable @typescript-eslint/no-explicit-any */
// In PropertyAddressSection.tsx

import debounce from "lodash.debounce";
import { Loader2, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react"; // Added useRef
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
  getPropertyArea: string;
}

const TestSection: React.FC<PropertyAddressSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  getPropertyArea,
}) => {
  const { emirates, fetchEmirates, addressLoading } = useLeads();
  // console.log("getPropertyArea:", getPropertyArea); // Console logs removed for cleaner code
  // console.log("formData:", formData);

  // Local state for address components
  const [selectedEmirate, setSelectedEmirate] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [initialGetPropertyArea] = useState(getPropertyArea);

  // Area states
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [areaResults, setAreaResults] = useState<any[]>([]);
  const [isAreaSearching, setIsAreaSearching] = useState(false);
  // Removed: const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);

  // Community states
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [communityResults, setCommunityResults] = useState<any[]>([]);
  const [isCommunitySearching, setIsCommunitySearching] = useState(false);
  // Removed: const [showAddCommunity, setShowAddCommunity] = useState(false);
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
    setSelectedEmirate(formData.custom_emirate || "");
    setSelectedArea(formData.custom_area || "");
    setSelectedCommunity(formData.custom_community || "");

    setAreaSearchQuery(formData.custom_area || "");
    setCommunitySearchQuery(formData.custom_community || "");

    // Handle the initial getPropertyArea for existing leads if formData is empty
    if (!formData.custom_emirate && initialGetPropertyArea) {
      const parts = initialGetPropertyArea.split(",").map((part) => part.trim());
      // Ensure there are enough parts before destructuring
      if (parts.length >= 3) { // Adjusted to check for at least emirate, area, community
        const [emirate, area, community] = parts;
        setSelectedEmirate(emirate);
        setSelectedArea(area);
        setSelectedCommunity(community);
        setAreaSearchQuery(area);
        setCommunitySearchQuery(community);
      }
    }
  }, [formData, initialGetPropertyArea]);

  // console.log("selectedEmirate:", selectedEmirate, "selectedArea:", selectedArea, "selectedCommunity:", selectedCommunity); // Console logs removed

  // Non-debounced area search function
  const searchArea = useCallback(
    async (query: string) => {
      if (!query.trim() || !selectedEmirate) {
        setAreaResults([]);
        setIsAreaSearching(false);
        // setShowAddArea(false); // Removed
        return;
      }

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

        if (response.message?.status === "success") {
          const results = response.message.data || [];
          setAreaResults(results);
          // setShowAddArea(results.length === 0); // Removed
        } else {
          console.warn("Unexpected response format:", response.data);
          setAreaResults([]);
          // setShowAddArea(true); // Removed
        }
      } catch (error) {
        console.error("Error searching areas:", error);
        setAreaResults([]);
        // setShowAddArea(true); // Removed
      } finally {
        setIsAreaSearching(false);
      }
    },
    [selectedEmirate] // Dependencies for searchArea
  );

  // Debounced area search ref
  const debouncedAreaSearchRef = useRef(debounce(searchArea, 500));

  // Non-debounced community search function
  const searchCommunity = useCallback(
    async (query: string) => {
      if (!query.trim() || !selectedArea) {
        setCommunityResults([]);
        setIsCommunitySearching(false);
        // setShowAddCommunity(false); // Removed
        return;
      }

      try {
        const response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.community_search.search_uae_communities?community_name=${encodeURIComponent(
            query
          )}&uae_area=${encodeURIComponent(selectedArea)}`
        );

        if (response.message?.status === "success") {
          setCommunityResults(response.message.data || []);
          // setShowAddCommunity(response.message.data.length === 0); // Removed
        } else {
          setCommunityResults([]);
          // setShowAddCommunity(true); // Removed
        }
      } catch (error) {
        console.error("Community search error:", error);
        setCommunityResults([]);
        // setShowAddCommunity(true); // Removed
      } finally {
        setIsCommunitySearching(false);
      }
    },
    [selectedArea] // Dependencies for searchCommunity
  );

  // Debounced community search ref
  const debouncedCommunitySearchRef = useRef(debounce(searchCommunity, 500));

  // Handle area search changes
  useEffect(() => {
    if (areaSearchQuery.trim() && selectedEmirate) {
      setIsAreaSearching(true);
      // setShowAddArea(false); // Removed
      debouncedAreaSearchRef.current(areaSearchQuery);
    } else {
      setAreaResults([]);
      // setShowAddArea(false); // Removed
      setIsAreaSearching(false);
    }

    const debounced = debouncedAreaSearchRef.current;
    return () => {
      debounced.cancel(); // Cancel any pending debounced calls on unmount or re-render
    };
  }, [areaSearchQuery, selectedEmirate, debouncedAreaSearchRef]);

  // Handle community search changes
  useEffect(() => {
    if (communitySearchQuery.trim() && selectedArea) {
      setIsCommunitySearching(true);
      // setShowAddCommunity(false); // Removed
      debouncedCommunitySearchRef.current(communitySearchQuery);
    } else {
      setCommunityResults([]);
      // setShowAddCommunity(false); // Removed
      setIsCommunitySearching(false);
    }

    const debounced = debouncedCommunitySearchRef.current;
    return () => {
      debounced.cancel(); // Cancel any pending debounced calls on unmount or re-render
    };
  }, [communitySearchQuery, selectedArea, debouncedCommunitySearchRef]); // Added debouncedCommunitySearchRef to dependencies

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
      formData.custom_emirate || "",
      formData.custom_area || "",
      formData.custom_community || "",
      formData.custom_street_name || "",
      formData.custom_property_name__number || ""
    );

    if (combinedAddress !== formData.custom_property_area) {
      handleSelectChange("custom_property_area", combinedAddress);
    }
  }, [
    formData.custom_emirate,
    formData.custom_area,
    formData.custom_community,
    formData.custom_street_name,
    formData.custom_property_name__number,
    combineAddress,
    handleSelectChange,
    formData.custom_property_area,
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback((value: string) => {
    setSelectedEmirate(value);
    handleSelectChange("custom_emirate", value);

    // Reset dependent fields
    setSelectedArea("");
    setAreaSearchQuery("");
    handleSelectChange("custom_area", "");

    setSelectedCommunity("");
    setCommunitySearchQuery("");
    handleSelectChange("custom_community", "");

    setAreaResults([]);
    setCommunityResults([]);
    // setShowAddArea(false); // Removed
    // setShowAddCommunity(false); // Removed
  }, [handleSelectChange]);

  // Handle area selection
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setAreaSearchQuery(area);
    handleSelectChange("custom_area", area);
    setAreaResults([]);
    // setShowAddArea(false); // Removed

    // Reset community when area changes
    setSelectedCommunity("");
    setCommunitySearchQuery("");
    handleSelectChange("custom_community", "");
    setCommunityResults([]);
    // setShowAddCommunity(false); // Removed
  };

  // Handle community selection
  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setCommunitySearchQuery(community);
    handleSelectChange("custom_community", community);
    setCommunityResults([]);
    // setShowAddCommunity(false); // Removed
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
    handleSelectChange("custom_property_category", value);
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
        handleSelectChange("custom_property_category", newCategoryName.trim());
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
          value={formData.custom_property_category || ""}
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
              onChange={(e) => {
                setAreaSearchQuery(e.target.value);
                if (e.target.value === "") {
                  setSelectedArea("");
                  handleSelectChange("custom_area", "");
                  setAreaResults([]);
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!selectedEmirate}
            />

            {(isAreaSearching || (areaResults.length > 0 && !selectedArea)) && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isAreaSearching ? (
                  <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : (
                  areaResults.map((area) => (
                    <div
                      key={area.name || area.area_name}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                      onClick={() => {
                        handleAreaSelect(area.area_name || area.name);
                      }}
                    >
                      {area.area_name || area.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {!isAreaSearching &&
            areaSearchQuery &&
            selectedEmirate &&
            areaResults.length === 0 &&
            !selectedArea && (
              <Button
                onClick={() => handleAddNewArea(areaSearchQuery)}
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
              onChange={(e) => {
                setCommunitySearchQuery(e.target.value);
                if (e.target.value === "") {
                  setSelectedCommunity("");
                  handleSelectChange("custom_community", "");
                  setCommunityResults([]);
                }
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={!selectedArea}
            />

            {(isCommunitySearching || (communityResults.length > 0 && !selectedCommunity)) && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isCommunitySearching ? (
                  <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>

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
            htmlFor="custom_street_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Custom Street Name
          </label>
          <Input
            type="text"
            id="custom_street_name"
            name="custom_street_name"
            value={formData.custom_street_name || ""}
            onChange={handleInputChange}
            placeholder="Enter street name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label
            htmlFor="custom_property_name__number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Property Number
          </label>
          <Input
            type="text"
            id="custom_property_name__number"
            name="custom_property_name__number"
            value={formData.custom_property_name__number || ""}
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
          value={formData.custom_property_area || ""}
          readOnly
          placeholder="Address will be combined automatically"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm bg-gray-50 text-gray-600 cursor-not-allowed"
          title="This field is automatically generated from the address components above"
        />
      </div>
    </div>
  );
};

export default TestSection;