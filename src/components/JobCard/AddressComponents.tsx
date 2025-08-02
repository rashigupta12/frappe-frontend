/* eslint-disable @typescript-eslint/no-explicit-any */
import debounce from "lodash.debounce";
import { Building, FileText, Loader2, MapPin, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { frappeAPI } from "../../api/frappeClient";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddressSectionProps {
  formData: {
    area: string;
    building_name?: string;
    property_no?: string;
  };
  onAddressChange: (field: string, value: string) => void;
  isReadOnly?: boolean;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  formData,
  onAddressChange,
  isReadOnly = false,
}) => {
  // State for address components
  const [selectedEmirate, setSelectedEmirate] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  
  // State for area search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [isAddingArea, setIsAddingArea] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State for loading emirates, cities, and areas
  const [emirates, setEmirates] = useState<{name: string}[]>([]);
  const [cities, setCities] = useState<{name: string}[]>([]);
  const [areas, setAreas] = useState<{name: string}[]>([]);
  const [isLoading, setIsLoading] = useState({
    emirates: false,
    cities: false,
    areas: false,
  });

  // Fetch emirates on component mount
  useEffect(() => {
    const fetchEmirates = async () => {
      setIsLoading(prev => ({...prev, emirates: true}));
      try {
        const response = await frappeAPI.getEmirate();
        setEmirates(response.data || []);
      } catch (error) {
        console.error("Failed to fetch emirates:", error);
        toast.error("Failed to load emirates");
      } finally {
        setIsLoading(prev => ({...prev, emirates: false}));
      }
    };

    fetchEmirates();
  }, []);

  // Fetch cities when emirate is selected
  const fetchCities = useCallback(async (emirate: string) => {
    if (!emirate) return;
    
    setIsLoading(prev => ({...prev, cities: true}));
    try {
      const response = await frappeAPI.getCity({ emirate });
      setCities(response.data || []);
      setSelectedCity("");
      setSelectedArea("");
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to fetch cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setIsLoading(prev => ({...prev, cities: false}));
    }
  }, []);

  // Fetch areas when city is selected
  const fetchAreas = useCallback(async (city: string) => {
    if (!city) return;
    
    setIsLoading(prev => ({...prev, areas: true}));
    try {
      const response = await frappeAPI.getArea({ city });
      setAreas(response.data || []);
      setSelectedArea("");
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to fetch areas:", error);
      toast.error("Failed to load areas");
    } finally {
      setIsLoading(prev => ({...prev, areas: false}));
    }
  }, []);

  // Debounced search function for areas
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !selectedCity) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await frappeAPI.get(
          `/api/method/eits_app.area_search.search_uae_areas`,
          { params: { area_name: query, city: selectedCity } }
        );

        setSearchResults(response.data?.message?.data || []);
        setShowAddArea(response.data?.message?.data?.length === 0);
      } catch (error) {
        console.error("Error searching areas:", error);
        toast.error("Failed to search areas");
        setSearchResults([]);
        setShowAddArea(true);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [selectedCity]
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

    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Handle area selection from search results
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    setSearchQuery(area);
    setSearchResults([]);
    setShowAddArea(false);
  };

  // Handle adding a new area
  const handleAddNewArea = async () => {
    if (!searchQuery.trim()) {
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
        area_name: searchQuery.trim(),
        city: selectedCity
      });

      if (response.data) {
        toast.success("Area added successfully!");
        await fetchAreas(selectedCity);
        setSelectedArea(searchQuery.trim());
        setSearchQuery(searchQuery.trim());
        setShowAddArea(false);
      }
    } catch (error) {
      console.error("Error creating area:", error);
      toast.error("Failed to create area. Please try again.");
    } finally {
      setIsAddingArea(false);
    }
  };

  // Combine address components into a single string
  const combineAddress = useCallback(
    (emirate: string, city: string, area: string): string => {
      const addressParts = [area, city, emirate].filter(
        (part) => part && part.trim() !== ""
      );
      return addressParts.join(", ");
    },
    []
  );

  // Update combined address whenever components change
  useEffect(() => {
    const combinedAddress = combineAddress(
      selectedEmirate,
      selectedCity,
      selectedArea || searchQuery
    );
    onAddressChange("area", combinedAddress);
  }, [selectedEmirate, selectedCity, selectedArea, searchQuery, combineAddress, onAddressChange]);

  // Parse existing address when formData changes
  useEffect(() => {
    if (formData.area) {
      const parts = formData.area.split(",").map(part => part.trim());
      
      if (parts.length >= 3) {
        const emirate = parts[parts.length - 1];
        const city = parts[parts.length - 2];
        const area = parts.length >= 3 ? parts[parts.length - 3] : "";
        
        // Set emirate if it exists in the emirates list
        const foundEmirate = emirates.find(e => e.name.toLowerCase() === emirate.toLowerCase());
        if (foundEmirate) {
          setSelectedEmirate(foundEmirate.name);
          fetchCities(foundEmirate.name).then(() => {
            const foundCity = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
            if (foundCity) {
              setSelectedCity(foundCity.name);
              fetchAreas(foundCity.name).then(() => {
                const foundArea = areas.find(a => a.name.toLowerCase() === area.toLowerCase());
                if (foundArea) {
                  setSelectedArea(foundArea.name);
                  setSearchQuery(foundArea.name);
                } else if (area) {
                  setSearchQuery(area);
                }
              });
            }
          });
        }
      }
    }
  }, [formData.area, emirates, cities, areas, fetchCities, fetchAreas]);

  return (
    <div className="space-y-4">
      {/* Building Name and Property Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="building_name" className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            Building Name
          </Label>
          <Input
            id="building_name"
            name="building_name"
            value={formData.building_name || ""}
            onChange={(e) => onAddressChange("building_name", e.target.value)}
            placeholder="Enter building name"
            disabled={isReadOnly}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="property_no" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Property Number
          </Label>
          <Input
            id="property_no"
            name="property_no"
            value={formData.property_no || ""}
            onChange={(e) => onAddressChange("property_no", e.target.value)}
            placeholder="Enter property number"
            disabled={isReadOnly}
            className="w-full"
          />
        </div>
      </div>

      {/* Emirate and City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            Emirate
          </Label>
          <Select
            value={selectedEmirate}
            onValueChange={(value) => {
              setSelectedEmirate(value);
              fetchCities(value);
            }}
            disabled={isReadOnly || isLoading.emirates}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoading.emirates ? "Loading..." : "Select emirate"} />
            </SelectTrigger>
            <SelectContent>
              {emirates.map((emirate) => (
                <SelectItem key={emirate.name} value={emirate.name}>
                  {emirate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            City
          </Label>
          <Select
            value={selectedCity}
            onValueChange={(value) => {
              setSelectedCity(value);
              fetchAreas(value);
            }}
            disabled={isReadOnly || !selectedEmirate }
          >
            <SelectTrigger className="w-full">
              <SelectValue 
                placeholder={
                  !selectedEmirate 
                    ? "Select emirate first" 
                    : isLoading.cities 
                    ? "Loading..." 
                    : "Select city"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Area Search */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          Area
        </Label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  !selectedCity 
                    ? "Select city first" 
                    : "Search for area..."
                }
                disabled={isReadOnly || !selectedCity }
                className="w-full"
              />
              
              {/* Search results dropdown */}
              {searchQuery && !showAddArea && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    searchResults.map((area) => (
                      <div
                        key={area.name}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAreaSelect(area.name)}
                      >
                        {area.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Add Area button */}
            {showAddArea && searchQuery && (
              <Button
                type="button"
                onClick={handleAddNewArea}
                disabled={isReadOnly || isAddingArea}
                className="whitespace-nowrap"
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
          
          {/* Help text */}
          {!selectedCity && searchQuery && (
            <p className="mt-1 text-sm text-gray-500">
              Please select a city first to search for areas
            </p>
          )}
          {searchQuery && !isSearching && searchResults.length === 0 && !showAddArea && (
            <p className="mt-1 text-sm text-gray-500">
              No areas found matching "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Combined Address Display */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          Combined Address
        </Label>
        <Input
          value={formData.area || ""}
          readOnly
          placeholder="Address will be combined automatically"
          className="w-full bg-gray-50"
        />
      </div>
    </div>
  );
};

export default AddressSection;