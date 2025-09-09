/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  InspectorAvailability,
  PriorityLevel,
} from "../../../types/inspectionType";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Loader2,
  UserPen,
  UserPlus,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { RestrictedTimeClock } from "../ResticritedtimeSlot";
import UserAvailability from "../../ui/UserAvailability";
import { TimeWarningModal } from "./TimeWarningModal";

interface InspectorAssignmentSectionProps {
  date: Date | undefined;
  selectedInspector: InspectorAvailability | null;
  selectedSlot: { start: string; end: string } | null;
  requestedTime: string;
  endTime: string;
  priority: PriorityLevel;
  validationErrors: { startTime: boolean; endTime: boolean };
  createTodoLoading: boolean;
  loading: boolean;
  showAvailabilityModal: boolean;
  onDateSelect: (selectedDate: Date | undefined) => void;
  onSlotSelect: (slot: { start: string; end: string }) => void;
  onStartTimeChange: (newTime: string) => void;
  onEndTimeChange: (newEndTime: string) => void;
  onPriorityChange: (value: string) => void;
  onShowAvailabilityModal: () => void;
  onHideAvailabilityModal: () => void;
  onInspectorSelect: (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: { start: string; end: string; duration_hours?: number }[]
  ) => void;
  onAssignAndSave: () => void;
  calculateDuration: () => number;
  getDefaultStartTime: () => string;
  getEndTimeConstraints: () => { minTime: string; maxTime: string };
}

export const InspectorAssignmentSection: React.FC<
  InspectorAssignmentSectionProps
> = ({
  date,
  selectedInspector,
  selectedSlot,
  requestedTime,
  endTime,
  priority,
  validationErrors,
  createTodoLoading,
  loading,
  showAvailabilityModal,
  onDateSelect,
  onSlotSelect,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
  onShowAvailabilityModal,
  onHideAvailabilityModal,
  onInspectorSelect,
  onAssignAndSave,
  calculateDuration,
  getDefaultStartTime,
  getEndTimeConstraints,
}) => {
  const [showTimeWarningModal, setShowTimeWarningModal] = useState(false);

  const handleAssignAndSave = () => {
    if (timeToMinutes(endTime) > timeToMinutes("18:00")) {
      setShowTimeWarningModal(true);
      return;
    }
    onAssignAndSave();
  };

  return (
    <div className="space-y-6">
      {/* Inspection Date Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-800">
          Select Inspection Date <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={date ? format(date, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const selectedDate = e.target.value
                ? new Date(e.target.value)
                : undefined;
              onDateSelect(selectedDate);
            }}
            className="w-full text-sm rounded-md shadow-sm pr-10 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {date && (
        <div className="space-y-2">
          {/* Inspector Details & Selection Button */}
          <div className="flex items-center justify-between">
            {selectedInspector ? (
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium text-sm text-gray-800">
                    {selectedInspector.user_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedInspector.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-800">
                Select inspector
              </div>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onShowAvailabilityModal}
              className="rounded-full h-8 w-8 p-0 border-gray-300 hover:bg-emerald-50"
            >
              {selectedInspector ? (
                <UserPen className="w-4 h-4 text-emerald-600" />
              ) : (
                <UserPlus className="w-4 h-4 text-emerald-600" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Available Time Slots */}
      {selectedInspector &&
        selectedInspector.availability.free_slots.length > 0 && (
          <div className="space-y-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-inner">
            <Label className="text-sm font-semibold text-gray-800">
              Available Time Slots
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {selectedInspector.availability.free_slots.map((slot, index) => (
                <Button
                  type="button"
                  key={index}
                  variant={
                    selectedSlot?.start === slot.start &&
                    selectedSlot?.end === slot.end
                      ? "default"
                      : "outline"
                  }
                  className="justify-center h-auto py-2 px-3 text-xs rounded-md"
                  onClick={() =>
                    onSlotSelect({
                      start: slot.start,
                      end: slot.end,
                    })
                  }
                >
                  {slot.start} - {slot.end}
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Finalize Time & Duration */}
      {selectedSlot && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-800">
            Finalize Time & Duration
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Start Time *</Label>
              <RestrictedTimeClock
                value={requestedTime}
                onChange={onStartTimeChange}
                minTime={
                  selectedSlot
                    ? (() => {
                        const defaultStart = getDefaultStartTime();
                        const slotStart = selectedSlot.start;
                        return timeToMinutes(defaultStart) >
                          timeToMinutes(slotStart)
                          ? defaultStart
                          : slotStart;
                      })()
                    : getDefaultStartTime()
                }
                maxTime={selectedSlot.end}
                className={`text-sm h-8 rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 ${
                  validationErrors.startTime ? "border-red-500" : ""
                }`}
                selectedDate={date}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">End Time *</Label>
              <RestrictedTimeClock
                value={endTime}
                onChange={onEndTimeChange}
                minTime={getEndTimeConstraints().minTime}
                maxTime={getEndTimeConstraints().maxTime}
                className={`text-sm h-8 rounded-md shadow-sm border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 ${
                  validationErrors.endTime ? "border-red-500" : ""
                }`}
                selectedDate={date}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Duration</Label>
              <Input
                type="text"
                value={
                  calculateDuration() > 0
                    ? `${calculateDuration().toFixed(1)} hrs`
                    : ""
                }
                className="text-sm h-8 bg-gray-100 border-gray-300 rounded-md"
                disabled
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Priority Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-800">Priority</Label>
        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-full bg-white border border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200">
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

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleAssignAndSave}
          className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-md shadow-md transition-all duration-300"
          disabled={loading || createTodoLoading}
        >
          {createTodoLoading || loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loading ? "Saving & Assigning..." : "Assigning..."}
            </>
          ) : (
            "Save & Assign Inspector"
          )}
        </Button>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <UserAvailability
          date={date || new Date()}
          onClose={onHideAvailabilityModal}
          onSelectInspector={onInspectorSelect}
        />
      )}

      {/* Time Warning Modal */}
      <TimeWarningModal
        isOpen={showTimeWarningModal}
        onClose={() => setShowTimeWarningModal(false)}
      />
    </div>
  );
};

// Helper function to convert time to minutes (needs to be imported)
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};