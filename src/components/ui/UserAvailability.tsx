// components/UserAvailability.tsx
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { frappeAPI } from "../../api/frappeClient";
import { Loader2 } from "lucide-react";
import { Clock } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { XCircle } from "lucide-react";
import { format } from "date-fns"; // Added missing import

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
  onSelectInspector?: (email: string, availabilityData: InspectorAvailability[]) => void; // Modified to pass availability data
}

const UserAvailability = ({ date, onClose, onSelectInspector }: UserAvailabilityProps) => {
  const [availability, setAvailability] = useState<InspectorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const [hours, minutes] = timeStr.split(':');
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Inspector Availability for {date.toDateString()}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div className="space-y-6">
            {availability.map((inspector) => (
              <div key={inspector.user_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {inspector.user_name}
                    </h4>
                    <p className="text-sm text-gray-500">{inspector.email}</p>
                  </div>
                  <div className="flex items-center">
                    {inspector.availability.is_completely_free ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Fully Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Partially Available
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Available Slots
                    </h5>
                    {inspector.availability.free_slots.length > 0 ? (
                      <ul className="space-y-2">
                        {inspector.availability.free_slots.map((slot, index) => (
                          <li key={index} className="flex items-center">
                            <Clock className="h-4 w-4 text-emerald-500 mr-2" />
                            <span className="text-sm">
                              {formatTime(slot.start)} - {formatTime(slot.end)} 
                              {slot.duration_hours && (
                                <span className="text-gray-500 ml-2">
                                  ({slot.duration_hours} hr)
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No available slots</p>
                    )}
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Busy Slots
                    </h5>
                    {inspector.availability.occupied_slots.length > 0 ? (
                      <ul className="space-y-2">
                        {inspector.availability.occupied_slots.map((slot, index) => (
                          <li key={index} className="flex items-center">
                            <Clock className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-sm">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No busy slots</p>
                    )}
                  </div>
                </div>

                {onSelectInspector && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectInspector(inspector.email, availability); // Pass availability data
                        onClose();
                      }}
                      disabled={!inspector.availability.free_slots.length}
                    >
                      Select Inspector
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvailability;