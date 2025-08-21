/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  UserPen,
  UserPlus,
  X
} from "lucide-react";
import { useState } from "react";
import type { InspectorAvailability, PriorityLevel } from "../../../types/inquiryFormdata";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { RestrictedTimeClock } from "../ResticritedtimeSlot";
import { timeToMinutes } from "../../../lib/timeUtils";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import UserAvailability from "../../ui/UserAvailability";




interface InspectionAssignmentProps {
  date: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedInspector: InspectorAvailability | null;
  selectedSlot: { start: string; end: string } | null;
  requestedTime: string;
  duration: string;
  priority: PriorityLevel;
  onInspectorSelect: (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
  ) => void;
  onSlotSelect: (slot: { start: string; end: string }) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: string) => void;
  onPriorityChange: (priority: PriorityLevel) => void;
  showEndTimeWarning: boolean;
  onEndTimeWarningClose: () => void;
  calculateEndTime: () => string | null;
  validateRequestedTime: () => boolean;
}

const InspectionAssignment: React.FC<InspectionAssignmentProps> = ({
  date,
  onDateSelect,
  selectedInspector,
  selectedSlot,
  requestedTime,
  duration,
  priority,
  onInspectorSelect,
  onSlotSelect,
  onTimeChange,
  onDurationChange,
  onPriorityChange,
  showEndTimeWarning,
  onEndTimeWarningClose,
  calculateEndTime,
  // validateRequestedTime,
}) => {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateSelect(selectedDate);
    if (selectedDate) {
      setTimeout(() => {
        setShowAvailabilityModal(true);
      }, 300);
    }
  };

  const handleInspectorSelection = (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
  ) => {
    onInspectorSelect(email, availabilityData, modifiedSlots);
    setShowAvailabilityModal(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-700 text-md font-medium mb-1">
            Select Inspection Date{" "}
            <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={date ? format(date, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const selectedDate = e.target.value
                  ? new Date(e.target.value)
                  : undefined;
                handleDateSelect(selectedDate);
              }}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm appearance-none"
            />
            <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {date && (
          <div className="space-y-2">
            <Label className="text-gray-700 text-md font-medium mb-1">
              Inspector Selected
            </Label>
            <div className="flex items-center justify-between">
              {selectedInspector ? (
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-sm">
                      {selectedInspector.user_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedInspector.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-md font-medium text-black">
                  Select inspector
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAvailabilityModal(true)}
              >
                {selectedInspector ? (
                  <UserPen className="w-4 h-4 text-black" />
                ) : (
                  <UserPlus className="w-3 h-3 text-black" />
                )}
              </Button>
            </div>
          </div>
        )}

        {selectedInspector &&
          selectedInspector.availability.free_slots.length > 0 && (
            <div className="space-y-2 px-5 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Label className="text-gray-700 text-md font-medium mb-1">
                Available Time Slots
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedInspector.availability.free_slots.map(
                  (slot, index) => (
                    <Button
                      type="button"
                      key={index}
                      variant={
                        selectedSlot?.start === slot.start &&
                        selectedSlot?.end === slot.end
                          ? "outline"
                          : "default"
                      }
                      className="justify-center h-auto py-1.5 px-2 text-xs"
                      onClick={() =>
                        onSlotSelect({
                          start: slot.start,
                          end: slot.end,
                        })
                      }
                    >
                      {slot.start} - {slot.end}
                    </Button>
                  )
                )}
              </div>
            </div>
          )}

        {selectedSlot && (
          <div className="space-y-3 p-3 ">
            <Label className="text-gray-700 text-md font-medium mb-1">
              Finalize Time & Duration
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 time-picker-container">
                <Label className="text-xs text-gray-600">
                  Start Time *
                </Label>
                <RestrictedTimeClock
                  value={requestedTime}
                  onChange={onTimeChange}
                  minTime={selectedSlot.start}
                  maxTime={selectedSlot.end}
                  className="text-sm h-8"
                  selectedDate={date}
                />
              </div>

              <div className="space-y-1 w-full">
                <Label className="text-xs text-gray-600">
                  Duration *
                </Label>
                <div className="flex w-full ">
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max={(() => {
                      if (!selectedSlot || !requestedTime)
                        return 8;
                      const requestedMinutes =
                        timeToMinutes(requestedTime);
                      const slotEndMinutes = timeToMinutes(
                        selectedSlot.end
                      );
                      const remainingMinutes =
                        slotEndMinutes - requestedMinutes;
                      const maxHours = remainingMinutes / 60;
                      return Math.max(
                        0.5,
                        Math.floor(maxHours * 2) / 2
                      );
                    })()}
                    value={duration}
                    onChange={(e) => onDurationChange(e.target.value)}
                    placeholder="1.5"
                    className="text-sm h-8 rounded-r-none "
                  />
                  <span className="flex items-center justify-center px-3 text-xs text-gray-700 border border-l-0 rounded-r-md bg-gray-50">
                    Hrs
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-600">
                  End Time
                </Label>
                <Input
                  type="text"
                  value={calculateEndTime() ?? ""}
                  className="text-sm h-8 bg-gray-100"
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-700 text-md font-medium mb-1">
            Priority
          </Label>
          <Select
            value={priority}
            onValueChange={onPriorityChange}
          >
            <SelectTrigger className="w-full bg-white border border-gray-300">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-300">
              <SelectItem value="Low">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Low
                </span>
              </SelectItem>
              <SelectItem value="Medium">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Medium
                </span>
              </SelectItem>
              <SelectItem value="High">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  High
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <UserAvailability
          date={date || new Date()}
          onClose={() => setShowAvailabilityModal(false)}
          onSelectInspector={handleInspectorSelection}
        />
      )}

      {/* End Time Warning Modal */}
      {showEndTimeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">End Time Warning</h3>
              <button
                onClick={onEndTimeWarningClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-gray-700">
              The calculated end time ({calculateEndTime()}) is after 6:00 PM.
              Time shouldn't extend beyond 6:00 PM.
            </p>

            <div className="flex justify-end">
              <Button
                onClick={onEndTimeWarningClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                OK, I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InspectionAssignment;