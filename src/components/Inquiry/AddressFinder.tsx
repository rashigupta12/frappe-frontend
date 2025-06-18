/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader, X } from 'lucide-react';

interface AddressSuggestion {
  id: string;
  display_name: string;
  clean_display_name: string;
  lat: number;
  lon: number;
  type: string;
  class: string;
  importance: number;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state_district?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface AddressFinderProps {
  onSelect?: (location: AddressSuggestion | null) => void;
  initialValue?: string;
  className?: string;
}

const AddressFinder: React.FC<AddressFinderProps> = ({ 
  onSelect, 
  initialValue = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<AddressSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRequestTime = useRef<number>(0);


   useEffect(() => {
    if (initialValue) {
      try {
        const parsed = JSON.parse(initialValue);
        if (parsed.clean_display_name) {
          setQuery(parsed.clean_display_name);
          setSelectedLocation(parsed);
        }
      } catch (e) {
        // If initialValue is not JSON, treat it as plain text
        setQuery(initialValue);
      }
    }
  }, [initialValue]);
  // Memoized debounce function to limit API calls
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    // If there's more space above and not enough space below, show dropdown above
    if (spaceBelow < 240 && spaceAbove > spaceBelow) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  }, []);

  // Memoized search function with rate limiting and CORS proxy - REMOVED COUNTRY RESTRICTION
  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Rate limiting: ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    lastRequestTime.current = Date.now();

    setLoading(true);
    setError('');
    
    try {
      // Using allorigins.win proxy - REMOVED countrycodes=in for worldwide search
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?` + 
        `format=json` +
        `&q=${encodeURIComponent(searchQuery)}` +
        `&limit=8` +
        `&addressdetails=1` +
        `&extratags=1` +
        `&dedupe=1` +
        `&polygon_geojson=0`;

      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(nominatimUrl)}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const proxyData = await response.json();
      const data = JSON.parse(proxyData.contents);
      
      if (data?.length > 0) {
        const formattedSuggestions = data.map((item: any, index: number) => {
          const address = item.address || {};
          const parts = [];
          
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.neighbourhood) parts.push(address.neighbourhood);
          if (address.suburb) parts.push(address.suburb);
          if (address.city_district) parts.push(address.city_district);
          if (address.city || address.town || address.village) {
            parts.push(address.city || address.town || address.village);
          }
          if (address.state_district && address.state_district !== (address.city || address.town)) {
            parts.push(address.state_district);
          }
          if (address.state) parts.push(address.state);
          if (address.country) parts.push(address.country);
          if (address.postcode) parts.push(`${address.postcode}`);
          
          const cleanDisplayName = parts.length > 0 ? parts.join(', ') : item.display_name;
          
          return {
            id: item.place_id || `location_${index}`,
            display_name: item.display_name,
            clean_display_name: cleanDisplayName,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type || 'location',
            class: item.class || '',
            importance: item.importance || 0,
            address: {
              house_number: address.house_number,
              road: address.road,
              neighbourhood: address.neighbourhood,
              suburb: address.suburb,
              city_district: address.city_district,
              city: address.city || address.town || address.village,
              state_district: address.state_district,
              state: address.state,
              country: address.country,
              postcode: address.postcode
            }
          };
        });
        
        const sortedSuggestions = formattedSuggestions.sort((a: AddressSuggestion, b: AddressSuggestion) => {
          const queryLower = searchQuery.toLowerCase();
          const aCity = (a.address.city || '').toLowerCase();
          const bCity = (b.address.city || '').toLowerCase();
          const aCountry = (a.address.country || '').toLowerCase();
          const bCountry = (b.address.country || '').toLowerCase();
          
          if (aCity.includes(queryLower)) {
            return -1;
          }
          if (bCity.includes(queryLower)) {
            return 1;
          }
          if (aCountry.includes(queryLower)) {
            return -1;
          }
          if (bCountry.includes(queryLower)) {
            return 1;
          }
          return (b.importance || 0) - (a.importance || 0);
        });
        
        setSuggestions(sortedSuggestions);
        setShowSuggestions(true);
        setError('');
        // Calculate position after setting suggestions
        setTimeout(calculateDropdownPosition, 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setError('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch locations. Please check your internet connection.';
      setError(errorMessage);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, [calculateDropdownPosition]);

  // Memoized debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => searchAddresses(searchQuery), 500),
    [debounce, searchAddresses]
  );

  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query.trim());
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setError('');
    }
  }, [query, debouncedSearch]);

  const handleSuggestionClick = useCallback((suggestion: AddressSuggestion) => {
    setQuery(suggestion.clean_display_name);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    setError('');
    if (onSelect) {
      onSelect(suggestion);
    }
    // Force a re-render by resetting suggestions
    setSuggestions([]);
  }, [onSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value === '') {
      setSelectedLocation(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setError('');
      if (onSelect) {
        onSelect(null);
      }
    }
  }, [onSelect]);

  const handleInputFocus = useCallback(() => {
    if (query.length > 1 && suggestions.length === 0) {
      debouncedSearch(query);
    }
    if (suggestions.length > 0) {
      setShowSuggestions(true);
      setTimeout(calculateDropdownPosition, 0);
    }
  }, [query, suggestions.length, debouncedSearch, calculateDropdownPosition]);

  const clearInput = useCallback(() => {
    setQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
    if (onSelect) {
      onSelect(null);
    }
    inputRef.current?.focus();
  }, [onSelect]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle window resize and scroll to recalculate dropdown position
  useEffect(() => {
    const handleResize = () => {
      if (showSuggestions) {
        calculateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (showSuggestions) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSuggestions, calculateDropdownPosition]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Enter location, city, or postal code"
          className="w-full px-4 py-2 pl-10 pr-8 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 transition-colors"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        {loading && (
          <Loader className="absolute right-8 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin" />
        )}
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown with improved positioning and z-index */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`
            fixed z-[9999] w-full bg-white shadow-xl rounded-md border border-gray-200 max-h-64 overflow-y-auto
            ${dropdownPosition === 'top' 
              ? 'bottom-full mb-1' 
              : 'top-full mt-1'
            }
          `}
          style={{
            left: inputRef.current?.getBoundingClientRect().left || 0,
            width: inputRef.current?.getBoundingClientRect().width || 'auto',
            top: dropdownPosition === 'bottom' 
              ? (inputRef.current?.getBoundingClientRect().bottom || 0) + 4
              : undefined,
            bottom: dropdownPosition === 'top' 
              ? window.innerHeight - (inputRef.current?.getBoundingClientRect().top || 0) + 4
              : undefined,
          }}
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="flex-shrink-0 w-4 h-4 mt-0.5 text-blue-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 line-clamp-2">
                    {suggestion.clean_display_name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {suggestion.address.country && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {suggestion.address.country}
                      </span>
                    )}
                    {suggestion.address.postcode && (
                      <span className="text-xs text-gray-500">
                        {suggestion.address.postcode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Selected location info */}
      {selectedLocation && (
        <div className="mt-2 p-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Location selected: {selectedLocation.address.city || 'Unknown'}, {selectedLocation.address.country || 'Unknown'}</span>
          </div>
          <div className="mt-1 text-gray-600">
            Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressFinder;