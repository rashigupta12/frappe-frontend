// utils/timeUtils.ts
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

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

export const isValidWorkTime = (time: string): boolean => {
  const workStart = '09:00';
  const workEnd = '18:00';
  return isTimeBetween(time, workStart, workEnd);
};