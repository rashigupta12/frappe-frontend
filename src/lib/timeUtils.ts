/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/timeUtils.ts

// Basic time conversion functions
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Time comparison functions
export const isTimeBetween = (time: string, start: string, end: string): boolean => {
  const timeMins = timeToMinutes(time);
  const startMins = timeToMinutes(start);
  const endMins = timeToMinutes(end);
  return timeMins >= startMins && timeMins <= endMins;
};

export const doTimeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

// Working hours validation
export const isValidWorkTime = (time: string): boolean => {
  return isTimeBetween(time, '09:00', '18:00');
};

// Slot generation functions
export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  interval: number
): Array<{start: string, end: string}> => {
  const slots: Array<{start: string, end: string}> = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  while (current + interval <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + interval)
    });
    current += interval;
  }
  
  return slots;
};

export const isWithinWorkingHours = (startTime: string, endTime: string): boolean => {
  return isTimeBetween(startTime, '09:00', '18:00') && 
         isTimeBetween(endTime, '09:00', '18:00');
};

// New function to process API response
export const processAvailabilityData = (data: any[]) => {
  return data.map(inspector => {
    // If inspector has no occupied slots, use their free slots directly
    if (inspector.availability.occupied_slots.length === 0) {
      return {
        ...inspector,
        availableSlots: inspector.availability.free_slots
      };
    }

    // Otherwise, calculate available slots between occupied slots
    const availableSlots = [];
    let lastEnd = '09:00';

    // Sort occupied slots by start time
    const occupiedSlots = [...inspector.availability.occupied_slots].sort((a, b) => 
      timeToMinutes(a.start) - timeToMinutes(b.start)
    );

    for (const slot of occupiedSlots) {
      if (timeToMinutes(lastEnd) < timeToMinutes(slot.start)) {
        availableSlots.push({
          start: lastEnd,
          end: slot.start,
          duration_hours: (timeToMinutes(slot.start) - timeToMinutes(lastEnd)) / 60
        });
      }
      lastEnd = slot.end;
    }

    // Add remaining time after last occupied slot
    if (timeToMinutes(lastEnd) < timeToMinutes('18:00')) {
      availableSlots.push({
        start: lastEnd,
        end: '18:00',
        duration_hours: (timeToMinutes('18:00') - timeToMinutes(lastEnd)) / 60
      });
    }

    return {
      ...inspector,
      availableSlots
    };
  });
};