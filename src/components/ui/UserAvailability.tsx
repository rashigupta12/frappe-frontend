// components/UserAvailability.tsx
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { frappeAPI } from "../../api/frappeClient";
import { Loader2 } from "lucide-react";
import { Clock } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { timeToMinutes } from "../../lib/timeUtils";

interface AvailabilitySlot {
  start: string;
  end: string;
  duration_hours?: number;
}

interface InspectorAvailability {
  user_id: string;
  user_name: string;
  email: string;
  date: string;
  availability: {
    occupied_slots: AvailabilitySlot[];
    free_slots: AvailabilitySlot[];
    is_completely_free: boolean;
    total_occupied_hours: number;
  };
}

interface UserAvailabilityProps {
  date: Date;
  onClose: () => void;
  onSelectInspector?: (
    email: string,
    availabilityData: InspectorAvailability[],
    modifiedSlots: AvailabilitySlot[]
  ) => void;
}

const UserAvailability = ({
  date,
  onClose,
  onSelectInspector,
}: UserAvailabilityProps) => {
  const [availability, setAvailability] = useState<InspectorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // Get current time in HH:mm format
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setCurrentTime(`${hours}:${minutes}`);
  }, []);

  // const handleInspectorSelect = (
  //   email: string,
  //   availabilityData: InspectorAvailability[],
  //   modifiedSlots: AvailabilitySlot[] // Add this parameter
  // ) => {
  //   if (onSelectInspector) {
  //     onSelectInspector(email, availabilityData, modifiedSlots);
  //   }
  // };

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await frappeAPI.makeAuthenticatedRequest(
          "GET",
          `/api/method/eits_app.inspector_availability.get_employee_availability?date=${formattedDate}`
        );
        console.log("Availability response:", response.message.data);
        if (response.message && response.message.status === "success") {
          setAvailability(response.message.data);
        } else {
          setError("Failed to fetch availability data");
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError("Failed to fetch availability data");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [date]);

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Check if the selected date is today
  const isToday = () => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Filter free slots and adjust them to show remaining time if current time is within a slot
  const filterFutureSlots = (slots: AvailabilitySlot[]): AvailabilitySlot[] => {
    // If it's not today, return all slots
    if (!isToday()) {
      return slots;
    }

    // If it's today and we don't have current time yet, return empty array
    if (!currentTime) return [];

    const currentMinutes = timeToMinutes(currentTime);

    return slots.reduce<AvailabilitySlot[]>((filteredSlots, slot) => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      if (slotEnd <= currentMinutes) {
        // Slot has already ended - exclude it
        return filteredSlots;
      }

      if (slotStart > currentMinutes) {
        // Slot is in the future - include as-is
        filteredSlots.push(slot);
      } else {
        // Current time is within this slot - create a modified slot from current time to end time
        const minutesToEnd = slotEnd - currentMinutes;
        filteredSlots.push({
          start: currentTime,
          end: slot.end,
          duration_hours: minutesToEnd / 60,
        });
      }

      return filteredSlots;
    }, []);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Inspector Availability
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(date, "MMM dd, yyyy")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8 text-sm">{error}</div>
          ) : (
            <div className="space-y-3 p-4">
              {availability.map((inspector) => {
                const futureFreeSlots = filterFutureSlots(
                  inspector.availability.free_slots
                );
                const hasFutureSlots = futureFreeSlots.length > 0;

                return (
                  <div
                    key={inspector.user_id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    {/* Inspector Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {inspector.user_name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {inspector.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {hasFutureSlots ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        ) : null}
                        {onSelectInspector && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              onSelectInspector(
                                inspector.email,
                                availability,
                                futureFreeSlots
                              );
                              onClose();
                            }}
                            disabled={!hasFutureSlots}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Availability Details */}
                    <div className="flex gap-3">
                      {/* Free Slots */}
                      {hasFutureSlots ? (
                        <div>
                          <h5 className="text-xs font-medium text-emerald-700 mb-1 flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Available Times
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {futureFreeSlots.map((slot, index) => {
                              const durationHours =
                                (timeToMinutes(slot.end) -
                                  timeToMinutes(slot.start)) /
                                60;
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                                >
                                  {formatTime(slot.start)} -{" "}
                                  {formatTime(slot.end)}
                                  <span className="text-gray-600 ml-1">
                                    ({durationHours.toFixed(1)}h)
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">
                          {isToday()
                            ? "No available time slots remaining today"
                            : "No available time slots for this date"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {availability.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No inspectors found for this date
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAvailability;
