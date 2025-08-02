/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useLeads } from "../../context/LeadContext";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";
import debounce from "lodash.debounce";

interface PropertyAddressSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  propertyTypes: string[];
  buildingTypes: string[];
  getPropertyArea: string;
}

const PropertyAddressSection: React.FC<PropertyAddressSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  propertyTypes,
  buildingTypes,
  getPropertyArea,
}) => {
  const {
    emirates,
    cities,
    areas,
    fetchEmirates,
    fetchCities,
    fetchAreas,
    addressLoading,
  } = useLeads();

  // Local state for selected address components
  const [selectedEmirate, setSelectedEmirate] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Search and add area states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load emirates on component mount
  useEffect(() => {
    fetchEmirates();
  }, [fetchEmirates]);

  // Parse and prefill address components when formData changes
  useEffect(() => {
    if (getPropertyArea && !hasPrefilled && emirates.length > 0) {
      const parts = getPropertyArea
        .split(",")
        .map((part: string) => part.trim());

      if (parts.length >= 3) {
        const emirate = parts[parts.length - 1];
        const city = parts[parts.length - 2];
        const area = parts.length >= 3 ? parts[parts.length - 3] : "";
        const building_name = parts.length >= 4 ? parts[parts.length - 4] : "";
        const number = parts.length >= 5 ? parts[parts.length - 5] : "";

        if (
          number &&
          number !== formData.custom_bulding__apartment__villa__office_number
        ) {
          handleSelectChange(
            "custom_bulding__apartment__villa__office_number",
            number
          );
        }
        if (building_name && building_name !== formData.custom_building_name) {
          handleSelectChange("custom_building_name", building_name);
        }

        const foundEmirate = emirates.find(
          (e) => e.name.toLowerCase() === emirate.toLowerCase()
        );
        if (foundEmirate) {
          setSelectedEmirate(foundEmirate.name);

          fetchCities(foundEmirate.name).then(() => {
            setTimeout(() => {
              const foundCity = cities.find(
                (c) => c.name.toLowerCase() === city.toLowerCase()
              );
              if (foundCity) {
                setSelectedCity(foundCity.name);

                fetchAreas(foundCity.name).then(() => {
                  setTimeout(() => {
                    const foundArea = areas.find(
                      (a) => a.name.toLowerCase() === area.toLowerCase()
                    );
                    if (foundArea) {
                      setSelectedArea(foundArea.name);
                    } else if (area) {
                      setSearchQuery(area);
                      setShowAddArea(true);
                    }
                    setHasPrefilled(true);
                    setIsInitialLoad(false);
                  }, 200);
                });
              } else {
                setHasPrefilled(true);
                setIsInitialLoad(false);
              }
            }, 200);
          });
        } else {
          setHasPrefilled(true);
          setIsInitialLoad(false);
        }
      } else {
        console.warn(
          "Incomplete address format in custom_property_area:",
          getPropertyArea
        );
        setHasPrefilled(true);
        setIsInitialLoad(false);
      }
    } else if (!getPropertyArea) {
      setHasPrefilled(true);
      setIsInitialLoad(false);
    }
  }, [
    getPropertyArea,
    emirates,
    cities,
    areas,
    fetchCities,
    fetchAreas,
    hasPrefilled,
    formData,
    handleSelectChange,
  ]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await frappeAPI.get(
          `/api/method/eits_app.area_search.search_uae_areas`,
          {
            params: { area_name: query },
          }
        );

        if (response.data?.message?.data) {
          setSearchResults(response.data.message.data);
          setShowAddArea(response.data.message.data.length === 0);
        } else {
          setSearchResults([]);
          setShowAddArea(true);
        }
      } catch (error) {
        console.error("Error searching areas:", error);
        toast.error("Failed to search areas");
        setSearchResults([]);
        setShowAddArea(true);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setShowAddArea(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  // Function to combine address components into a single string
  const combineAddress = useCallback(
    (
      number: string,
      name: string,
      emirate: string,
      city: string,
      area: string
    ): string => {
      const addressParts = [number, name, area, city, emirate].filter(
        (part) => part && part.trim() !== ""
      );

      return addressParts.join(", ");
    },
    []
  );

  // Update combined address whenever any address component changes
  useEffect(() => {
    if (!isInitialLoad) {
      const combinedAddress = combineAddress(
        formData.custom_bulding__apartment__villa__office_number || "",
        formData.custom_building_name || "",
        selectedEmirate,
        selectedCity,
        selectedArea || searchQuery
      );

      if (combinedAddress !== formData.custom_property_area) {
        handleSelectChange("custom_property_area", combinedAddress);
      }
    }
  }, [
    formData.custom_bulding__apartment__villa__office_number,
    formData.custom_building_name,
    selectedArea,
    selectedCity,
    selectedEmirate,
    searchQuery,
    combineAddress,
    handleSelectChange,
    formData.custom_property_area,
    isInitialLoad,
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback(
    (value: string) => {
      setSelectedEmirate(value);
      setSelectedCity("");
      setSelectedArea("");
      setSearchQuery("");
      setSearchResults([]);
      setShowAddArea(false);
      fetchCities(value);
    },
    [fetchCities]
  );

  // Handle city selection
  const handleCityChange = useCallback(
    (value: string) => {
      setSelectedCity(value);
      setSelectedArea("");
      setSearchQuery("");
      setSearchResults([]);
      setShowAddArea(false);
      fetchAreas(value);
    },
    [fetchAreas]
  );

  // Handle area selection from search results
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setSearchQuery(area);
    setSearchResults([]);
    setShowAddArea(false);
  };

  // Handle adding a new area
 const handleAddNewArea = async (areaName?: string) => {
  const areaToAdd = areaName || newAreaName;
  
  if (!areaToAdd.trim()) {
    toast.error("Please enter an area name");
    return;
  }

  if (!selectedCity) {
    toast.error("Please select a city first");
    return;
  }

  setIsAddingArea(true);
  try {
    const response = await frappeAPI.createArea({
      area_name: areaToAdd.trim(),
      city: selectedCity
    });

    if (response) {
      toast.success("Area added successfully!");
      await fetchAreas(selectedCity);
      setSelectedArea(areaToAdd.trim());
      setSearchQuery(areaToAdd.trim());
      setNewAreaName("");
      setShowAddArea(false);
    }
  } catch (error) {
    console.error("Error creating area:", error);
    toast.error(
      "Failed to create area. Please try again."
    );
  } finally {
    setIsAddingArea(false);
  }
};
  return (
    <div>
      {/* Property Type and Building Type Row */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Number and Name Row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label
            htmlFor="custom_bulding__apartment__villa__office_number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Number
          </label>
          <Input
            type="text"
            id="custom_bulding__apartment__villa__office_number"
            name="custom_bulding__apartment__villa__office_number"
            value={
              formData.custom_bulding__apartment__villa__office_number || ""
            }
            onChange={handleInputChange}
            placeholder="Enter unit/floor number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
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
            placeholder="Enter building/street name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Emirate and City Row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emirate
          </label>
          <Select
            value={selectedEmirate}
            onValueChange={handleEmirateChange}
            disabled={addressLoading}
          >
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Select
            value={selectedCity}
            onValueChange={handleCityChange}
            disabled={!selectedEmirate || addressLoading}
          >
            <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <SelectValue
                placeholder={
                  !selectedEmirate
                    ? "Select emirate first"
                    : addressLoading
                    ? "Loading..."
                    : "Select city"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {cities.map((city) => (
                <SelectItem
                  key={city.name}
                  value={city.name}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                >
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Area Section */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area{" "}
            <span className="text-xs text-gray-500">
              (Please Select Emirate & City)
            </span>
          </label>

          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={
                    !selectedCity ? "Select city first" : "Search for area..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value === "") {
                      setSelectedArea("");
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={!selectedCity}
                  ref={searchInputRef}
                />

                {/* Search results dropdown */}
                {searchQuery && !showAddArea && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Searching...
                      </div>
                    ) : (
                      searchResults.map((area) => (
                        <div
                          key={area.name}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                          onClick={() => handleAreaSelect(area.name)}
                        >
                          {area.name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Add Area button (shown when no results found) */}
            
              {showAddArea && searchQuery && (
                <Button
                  onClick={() => handleAddNewArea(searchQuery)}
                  disabled={isAddingArea || !searchQuery.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                >
                  {isAddingArea ? (
                    <>
                      <span className="animate-spin mr-2">↻</span>
                      Adding...
                    </>
                  ) : (
                    "Add Area"
                  )}
                </Button>
              )}
            </div>

            {/* No results found message */}
            {searchQuery &&
              !isSearching &&
              searchResults.length === 0 &&
              !showAddArea && (
                <div className="text-xs text-gray-500 mt-1">
                  No areas found. Please select a city to add a new area.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Selected Area Display
      {selectedArea && (
        <div className="mt-2 p-2 bg-gray-100 rounded-md">
          <span className="text-sm font-medium">Selected Area: </span>
          <span className="text-sm">{selectedArea}</span>
        </div>
      )} */}

      {/* Combined Address Row */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
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
    </div>
  );
};

export default PropertyAddressSection;
