/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useLeads } from "../../context/LeadContext";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";

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
  getPropertyArea
}) => {
  const { 
    emirates, 
    cities, 
    areas, 
    fetchEmirates, 
    fetchCities, 
    fetchAreas, 
    addressLoading 
  } = useLeads();

  // Local state for selected address components
  const [selectedEmirate, setSelectedEmirate] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [showOtherAreaInput, setShowOtherAreaInput] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  console.log("getPropertyArea", getPropertyArea);
  console.log("formData", formData);

  // Load emirates on component mount
  useEffect(() => {
    fetchEmirates();
  }, [fetchEmirates]);

  // Parse and prefill address components when formData changes
  useEffect(() => {
    if (getPropertyArea && !hasPrefilled && emirates.length > 0) {
      const parts = getPropertyArea.split(',').map((part: string) => part.trim());

      // Address format: "unit 204, fdjh, Burj Khalifa, Dubai, Dubai"
      // Parts: [number, building_name, area, city, emirate]
      if (parts.length >= 3) {
        const emirate = parts[parts.length - 1]; // Last part is emirate
        const city = parts[parts.length - 2]; // Second last is city
        const area = parts.length >= 3 ? parts[parts.length - 3] : ""; // Third last is area
        const building_name = parts.length >= 4 ? parts[parts.length - 4] : ""; // Fourth last is building name
        const number = parts.length >= 5 ? parts[parts.length - 5] : ""; // Fifth last is number
        
        console.log("Parsed address:", { number, building_name, area, city, emirate });
        
        // Set the emirate if it exists in the emirates list
        const foundEmirate = emirates.find(e => e.name.toLowerCase() === emirate.toLowerCase());
        if (foundEmirate) {
          setSelectedEmirate(foundEmirate.name);
          
          // Fetch cities for this emirate
          fetchCities(foundEmirate.name).then(() => {
            // Wait a bit for cities to be populated, then check
            setTimeout(() => {
              const foundCity = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
              if (foundCity) {
                setSelectedCity(foundCity.name);
                
                // Fetch areas for this city
                fetchAreas(foundCity.name).then(() => {
                  // Wait a bit for areas to be populated, then check
                  setTimeout(() => {
                    const foundArea = areas.find(a => a.name.toLowerCase() === area.toLowerCase());
                    if (foundArea) {
                      setSelectedArea(foundArea.name);
                      setShowOtherAreaInput(false);
                      setNewAreaName("");
                    } else if (area) {
                      // If area doesn't exist in dropdown but has a value, show "other" input
                      setShowOtherAreaInput(true);
                      setNewAreaName(area);
                      setSelectedArea("");
                    }
                    setHasPrefilled(true);
                    setIsInitialLoad(false);
                  }, 100);
                });
              } else {
                setHasPrefilled(true);
                setIsInitialLoad(false);
              }
            }, 100);
          });
        } else {
          setHasPrefilled(true);
          setIsInitialLoad(false);
        }
      } else {
        // Handle incomplete address format
        console.warn("Incomplete address format in custom_property_area:", getPropertyArea);
        setHasPrefilled(true);
        setIsInitialLoad(false);
      }
    } else if (!getPropertyArea) {
      // No existing address, just mark as ready for new input
      setHasPrefilled(true);
      setIsInitialLoad(false);
    }
  }, [getPropertyArea, emirates, cities, areas, fetchCities, fetchAreas, hasPrefilled]);

  // Function to combine address components into a single string
  const combineAddress = useCallback((
    number: string,
    name: string,
    emirate: string,
    city: string,
    area: string
  ): string => {
    const addressParts = [
      number,
      name,
      area,
      city,
      emirate
    ].filter(part => part && part.trim() !== "");
    
    return addressParts.join(", ");
  }, []);

  // Update combined address whenever any address component changes
  useEffect(() => {
    if (!isInitialLoad) { // Only combine after initial prefill is done or for new entries
      const combinedAddress = combineAddress(
        formData.custom_bulding__apartment__villa__office_number || "",
        formData.custom_building_name || "",
        selectedEmirate,
        selectedCity,
        showOtherAreaInput ? newAreaName : selectedArea
      );
      
      // Only update if there's a change to avoid infinite loops
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
    combineAddress,
    handleSelectChange,
    formData.custom_property_area,
    showOtherAreaInput,
    newAreaName,
    isInitialLoad
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback((value: string) => {
    setSelectedEmirate(value);
    setSelectedCity(""); // Reset city when emirate changes
    setSelectedArea(""); // Reset area when emirate changes
    setShowOtherAreaInput(false); // Reset other area input
    setNewAreaName(""); // Reset new area name
    fetchCities(value);
  }, [fetchCities]);

  // Handle city selection
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value);
    setSelectedArea(""); // Reset area when city changes
    setShowOtherAreaInput(false); // Reset other area input
    setNewAreaName(""); // Reset new area name
    fetchAreas(value);
  }, [fetchAreas]);

  // Handle area selection
  const handleAreaChange = useCallback((value: string) => {
    if (value === "other") {
      setShowOtherAreaInput(true);
      setSelectedArea(""); // Clear selected area when choosing "other"
    } else {
      setSelectedArea(value);
      setShowOtherAreaInput(false);
      setNewAreaName(""); // Clear new area name when selecting from dropdown
    }
  }, []);

  // Handle adding a new area
  const handleAddNewArea = async () => {
    if (!newAreaName.trim()) {
      toast.error("Please enter an area name");
      return;
    }

    if (!selectedCity) {
      toast.error("Please select a city first");
      return;
    }

    setIsAddingArea(true);
    try {
      // Create the new area in the database
      const response = await frappeAPI.createArea({
        area_name: newAreaName.trim(),
        city: selectedCity
      });

      if (response.data) {
        toast.success("Area added successfully!");
        
        // Refresh areas for the current city
        await fetchAreas(selectedCity);
        
        // Wait a moment for the areas to be updated, then select the newly added area
        setTimeout(() => {
          setSelectedArea(newAreaName.trim());
          setShowOtherAreaInput(false);
          setNewAreaName("");
        }, 100);
        
      } else {
        throw new Error("Failed to create area");
      }
    } catch (error) {
      console.error("Error creating area:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create area. Please try again."
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
            value={formData.custom_bulding__apartment__villa__office_number || ""}
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
              <SelectValue placeholder={addressLoading ? "Loading..." : "Select emirate"} />
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
              <SelectValue placeholder={
                !selectedEmirate 
                  ? "Select emirate first" 
                  : addressLoading 
                  ? "Loading..." 
                  : "Select city"
              } />
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
            Area
          </label>
          <Select
            value={showOtherAreaInput ? "other" : selectedArea}
            onValueChange={handleAreaChange}
            disabled={!selectedCity || addressLoading}
          >
            <SelectTrigger className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <SelectValue placeholder={
                !selectedCity 
                  ? "Select city first" 
                  : addressLoading 
                  ? "Loading..." 
                  : "Select area"
              } />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {areas.map((area) => (
                <SelectItem
                  key={area.name}
                  value={area.name}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
                >
                  {area.name}
                </SelectItem>
              ))}
              <SelectItem 
                value="other" 
                className="px-4 py-2 text-sm text-gray-700 hover:bg-emerald-100 focus:bg-emerald-100 cursor-pointer"
              >
                Other (Not listed)
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Other Area Input */}
          {showOtherAreaInput && (
            <div className="mt-2 flex gap-2">
              <Input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Enter new area name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                onClick={handleAddNewArea}
                disabled={isAddingArea || !newAreaName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
            </div>
          )}
        </div>
      </div>

      {/* Combined Address Row (single column) */}
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