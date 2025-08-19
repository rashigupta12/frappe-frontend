import { Clock } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface RestrictedTimeClockProps {
  value: string;
  onChange: (time: string) => void;
  minTime: string;
  maxTime: string;
  className?: string;
}

export const RestrictedTimeClock: React.FC<RestrictedTimeClockProps> = ({
  value,
  onChange,
  minTime,
  maxTime,
  className = ""
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
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Generate available hours
  const getAvailableHours = (): number[] => {
    const hours: number[] = [];
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const minHour = Math.floor(minMinutes / 60);
    const maxHour = Math.floor(maxMinutes / 60);
    
    for (let h = minHour; h <= maxHour; h++) {
      // Skip 18:00 (6 PM)
      if (h === 18) continue;
      hours.push(h);
    }
    return hours;
  };

  // Generate available minutes for selected hour
  const getAvailableMinutes = (hour: number): number[] => {
    const minMinutes = timeToMinutes(minTime);
    const maxMinutes = timeToMinutes(maxTime);
    const minutes: number[] = [];
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;
    
    // Determine the actual start and end minutes for this hour
    const actualStart = Math.max(minMinutes, hourStart);
    const actualEnd = Math.min(maxMinutes, hourEnd);
    
    // Generate 15-minute intervals
    for (let m = actualStart; m < actualEnd; m += 15) {
      const minute = m % 60;
      minutes.push(minute);
    }
    
    return minutes;
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    const availableMinutes = getAvailableMinutes(hour);
    if (availableMinutes.length > 0) {
      setSelectedMinute(availableMinutes[0]);
      const newTime = `${hour.toString().padStart(2, '0')}:${availableMinutes[0].toString().padStart(2, '0')}`;
      onChange(newTime);
    }
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
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Create portal for dropdown to escape container clipping
  const DropdownPortal = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-50" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Clock Interface */}
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 w-40"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
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
                      className={`w-full px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedMinute === minute 
                          ? 'bg-emerald-100 text-emerald-700 font-medium' 
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      :{minute.toString().padStart(2, '0')}
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
        <span className={value ? 'text-gray-900 text-xs ' : 'text-gray-500 text-xs'}>
          {value ? formatDisplayTime(value) : 'Select time'}
        </span>
        <Clock className="h-3.5 w-3.5 text-gray-400 " />
      </div>

      <DropdownPortal />
    </div>
  );
};