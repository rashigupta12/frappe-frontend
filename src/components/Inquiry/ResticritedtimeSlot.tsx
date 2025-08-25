import { Clock } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface RestrictedTimeClockProps {
  value: string;
  onChange: (time: string) => void;
  minTime: string;
  maxTime: string;
  className?: string;
  selectedDate?: Date; // Add this new prop
}

export const RestrictedTimeClock: React.FC<RestrictedTimeClockProps> = ({
  value,
  onChange,
  minTime,
  maxTime,
  className = "",
  selectedDate // Add this prop
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Convert time string to minutes for easier comparison
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if selected date is today
  const isSelectedDateToday = (): boolean => {
    if (!selectedDate) return true; // Default to today if no date provided
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  // Get the next available 15-minute slot from current time
  const getNextAvailable15MinSlot = (): number => {
    const now = new Date();
    const currentMinutes = now.getMinutes();
    
    // Find the next 15-minute interval
    const intervals = [0, 15, 30, 45];
    let nextInterval = intervals.find(interval => interval > currentMinutes);
    
    if (nextInterval === undefined) {
      // If current time is after 45 minutes, go to next hour at 00
      nextInterval = 0;
    }
    
    return nextInterval;
  };

  // Parse current value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      setSelectedHour(hours);
      setSelectedMinute(minutes);
    }
  }, [value]);

  // Update position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate height of dropdown
      
      let top = rect.bottom + window.scrollY;
      
      // If dropdown would go below viewport, position it above the trigger
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top + window.scrollY - dropdownHeight;
      }
      
      setPosition({
        top: Math.max(10, top), // Ensure it's not too close to top edge
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Generate available hours - UPDATED LOGIC
  const getAvailableHours = (): number[] => {
    const hours: number[] = [];
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const minHour = Math.floor(minMinutes / 60);
    const maxHour = Math.floor(maxMinutes / 60);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const isToday = isSelectedDateToday();
    
    for (let h = minHour; h <= maxHour; h++) {
      // Skip 18:00 (6 PM)
      if (h === 18) continue;
      
      // Check if this hour has any valid 15-minute slots (excluding exact maxTime)
      const intervals = [0, 15, 30, 45];
      let hasValidSlots = false;
      
      for (const minute of intervals) {
        const totalMinutes = h * 60 + minute;
        if (totalMinutes >= minMinutes && totalMinutes < maxMinutes) {
          // Only apply current time restrictions if it's today
          if (isToday && h === currentHour) {
            const nextSlot = getNextAvailable15MinSlot();
            if (currentMinutes > 45) {
              break; // No future slots in current hour
            } else if (minute >= nextSlot) {
              hasValidSlots = true;
              break;
            }
          } else if (!isToday || h > currentHour) {
            // For future dates or future hours, all slots are available
            hasValidSlots = true;
            break;
          }
          // Skip past hours entirely when it's today
        }
      }
      
      if (hasValidSlots) {
        hours.push(h);
      }
    }
    return hours;
  };

  // Generate available minutes for selected hour (15-minute intervals) - UPDATED LOGIC
  const getAvailableMinutes = (hour: number): number[] => {
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const intervals = [0, 15, 30, 45];
    const availableMinutes: number[] = [];
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const isToday = isSelectedDateToday();
    
    for (const minute of intervals) {
      const totalMinutes = hour * 60 + minute;
      
      // Check if within the allowed time range (exclude exact maxTime)
      if (totalMinutes >= minMinutes && totalMinutes < maxMinutes) {
        // Only apply current time restrictions if it's today
        if (isToday && hour === currentHour) {
          const nextSlot = getNextAvailable15MinSlot();
          if (currentMinutes > 45) {
            // If current time is past 45 minutes, no slots available in current hour
            continue;
          } else if (minute >= nextSlot) {
            availableMinutes.push(minute);
          }
        } else if (!isToday || hour > currentHour) {
          // For future dates or future hours, all intervals are available
          availableMinutes.push(minute);
        }
        // Skip past hours entirely when it's today
      }
    }
    
    return availableMinutes;
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    const availableMinutes = getAvailableMinutes(hour);
    
    // Automatically select the first available minute
    let initialMinute = 0;
    if (availableMinutes.length > 0) {
      initialMinute = availableMinutes[0];
    }
    
    setSelectedMinute(initialMinute);
    const newTime = `${hour.toString().padStart(2, '0')}:${initialMinute.toString().padStart(2, '0')}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (minute: number) => {
    if (selectedHour !== null) {
      setSelectedMinute(minute);
      const newTime = `${selectedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      onChange(newTime);
      // Close the dropdown after selecting a minute
      setIsOpen(false);
    }
  };

  const formatDisplayTime = (time: string): string => {
    if (!time) return 'Select time';
    // Display in 24-hour format
    return time;
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const dropdownElement = document.querySelector('[data-dropdown="time-clock"]');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Create portal for dropdown to escape container clipping
  const DropdownPortal = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Clock Interface */}
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 w-48"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          data-dropdown="time-clock"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Hours Column */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 text-center">Hours</h4>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {getAvailableHours().map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    className={`w-full py-2 text-sm hover:bg-gray-100 transition-colors ${
                      selectedHour === hour 
                        ? 'bg-emerald-100 text-emerald-700 font-medium' 
                        : 'text-gray-700'
                    }`}
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2 text-center">Minutes</h4>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {selectedHour !== null ? (
                  getAvailableMinutes(selectedHour).map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      className={`w-full px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                        selectedMinute === minute 
                          ? 'bg-emerald-100 text-emerald-700 font-medium' 
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">
                    Select hour first
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  };

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <div
        className="w-full bg-white border border-gray-700 rounded-md px-2 py-2 text-xs cursor-pointer flex items-center justify-between hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? 'text-gray-900 text-xs ' : 'text-gray-500 text-xs '}>
          {value ? formatDisplayTime(value) : 'Select'}
        </span>
        <Clock className="h-3.5 w-3.5 text-gray-400 " />
      </div>

      <DropdownPortal />
    </div>
  );
};