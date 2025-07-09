/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useLeads } from "../../context/LeadContext";


interface PropertyAddressSectionProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  propertyTypes: string[];
  buildingTypes: string[];
}

const PropertyAddressSection: React.FC<PropertyAddressSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  propertyTypes,
  buildingTypes,
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

  // Load emirates on component mount
  useEffect(() => {
    fetchEmirates();
  }, [fetchEmirates]);

  // Function to combine address components into a single string
  const combineAddress = useCallback((
    addressLine1: string,
    addressLine2: string,
    area: string,
    city: string,
    emirate: string
  ): string => {
    const addressParts = [
      addressLine1,
      addressLine2,
      area,
      city,
      emirate
    ].filter(part => part && part.trim() !== "");
    
    return addressParts.join(", ");
  }, []);

  // Update combined address whenever any address component changes
  useEffect(() => {
    const combinedAddress = combineAddress(
      formData.custom_building_name || "",
      formData.custom_bulding__apartment__villa__office_number || "",
      selectedArea,
      selectedCity,
      selectedEmirate
    );
    
    // Only update if there's a change to avoid infinite loops
    if (combinedAddress !== formData.propertyarea) {
      handleSelectChange("propertyarea", combinedAddress);
    }
  }, [
    
    formData.custom_bulding__apartment__villa__office_number,
    formData.custom_building_name,
    selectedArea,
    selectedCity,
    selectedEmirate,
    combineAddress,
    handleSelectChange,
    formData.propertyarea
  ]);

  // Handle emirate selection
  const handleEmirateChange = useCallback((value: string) => {
    setSelectedEmirate(value);
    setSelectedCity(""); // Reset city when emirate changes
    setSelectedArea(""); // Reset area when emirate changes
    fetchCities(value);
  }, [fetchCities]);

  // Handle city selection
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value);
    setSelectedArea(""); // Reset area when city changes
    fetchAreas(value);
  }, [fetchAreas]);

  // Handle area selection
  const handleAreaChange = useCallback((value: string) => {
    setSelectedArea(value);
  }, []);

  return (
    <div>
      {/* Property Type and Building Type Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Address Line 1 and 2 Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
            placeholder="Enter address line 1 (e.g., Unit number, Floor)"
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
            placeholder="Enter address line 2 (e.g., Building name, Street)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        

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
                  { emirate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* City and Area Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area
          </label>
          <Select
            value={selectedArea}
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
                  { area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Combined Address Preview (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Combined Address
          </label>
          <Input
            type="text"
            value={formData.propertyarea || ""}
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