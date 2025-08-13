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
import { minutesToTime, timeToMinutes } from "../../lib/timeUtils";

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
    availabilityData: InspectorAvailability[]
  ) => void; // Modified to pass availability data
}

const UserAvailability = ({
  date,
  onClose,
  onSelectInspector,
}: UserAvailabilityProps) => {
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
    const [hours, minutes] = timeStr.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };
  const calculateAvailableSlots = (inspector: InspectorAvailability) => {
    const workStart = timeToMinutes("09:00");
    const workEnd = timeToMinutes("18:00");
    const occupiedSlots = inspector.availability.occupied_slots;

    // Sort occupied slots by start time
    const sortedOccupied = [...occupiedSlots].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );

    const availableSlots: AvailabilitySlot[] = [];
    let lastEnd = workStart;

    for (const slot of sortedOccupied) {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      if (slotStart - lastEnd >= 30) {
        availableSlots.push({
          start: minutesToTime(lastEnd),
          end: minutesToTime(slotStart - 30),
          duration_hours: (slotStart - 30 - lastEnd) / 60,
        });
      }

      lastEnd = slotEnd + 30; // Add 30-minute buffer after occupied slot
    }

    // Add remaining time after last occupied slot
    if (lastEnd < workEnd) {
      availableSlots.push({
        start: minutesToTime(lastEnd),
        end: minutesToTime(workEnd),
        duration_hours: (workEnd - lastEnd) / 60,
      });
    }

    return availableSlots;
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
              {availability.map((inspector) => (
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
                      {inspector.availability.is_completely_free ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3 mr-1" />
                          Partial
                        </span>
                      )}
                      {onSelectInspector && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => {
                            onSelectInspector(inspector.email, availability);
                            onClose();
                          }}
                          disabled={!inspector.availability.free_slots.length}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Availability Details */}
                  <div className="flex gap-3">
                    {/* Free Slots */}
                    {/* {inspector.availability.free_slots.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-emerald-700 mb-1 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Available Times
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {inspector.availability.free_slots.map((slot, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                            >
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                              {slot.duration_hours && (
                                <span className="text-gray-600 ml-1">
                                  ({slot.duration_hours}h)
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )} */}

                    {inspector.availability.free_slots.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-emerald-700 mb-1 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Available Times (with 30-minute buffers)
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {calculateAvailableSlots(inspector).map(
                            (slot, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                              >
                                {formatTime(slot.start)} -{" "}
                                {formatTime(slot.end)}
                                {slot.duration_hours && (
                                  <span className="text-gray-600 ml-1">
                                    ({slot.duration_hours.toFixed(1)}h)
                                  </span>
                                )}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Occupied Slots */}
                    {inspector.availability.occupied_slots.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Busy Times
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {inspector.availability.occupied_slots.map(
                            (slot, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                              >
                                {formatTime(slot.start)} -{" "}
                                {formatTime(slot.end)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* No availability message */}
                    {inspector.availability.free_slots.length === 0 &&
                      inspector.availability.occupied_slots.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No schedule information available
                        </p>
                      )}
                  </div>
                </div>
              ))}

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

// // components/UserAvailability.tsx
// import { X } from "lucide-react";
// import { Button } from "../ui/button";
// import { useEffect, useState } from "react";
// import { frappeAPI } from "../../api/frappeClient";
// import { Loader2 } from "lucide-react";
// import { Clock } from "lucide-react";
// import { CheckCircle2 } from "lucide-react";
// import { XCircle } from "lucide-react";
// import { format } from "date-fns";

// interface AvailabilitySlot {
//   start: string;
//   end: string;
//   duration_hours?: number;
// }

// interface InspectorAvailability {
//   user_id: string;
//   user_name: string;
//   email: string;
//   date: string;
//   availability: {
//     occupied_slots: AvailabilitySlot[];
//     free_slots: AvailabilitySlot[];
//     is_completely_free: boolean;
//     total_occupied_hours: number;
//   };
// }

// interface UserAvailabilityProps {
//   date: Date;
//   onClose: () => void;
//   onSelectInspector?: (email: string, availabilityData: InspectorAvailability[]) => void;
//   // Optional props for overlap checking
//   proposedStartTime?: string; // Format: "HH:MM"
//   proposedEndTime?: string;   // Format: "HH:MM"
// }

// const UserAvailability = ({
//   date,
//   onClose,
//   onSelectInspector,
//   proposedStartTime,
//   proposedEndTime
// }: UserAvailabilityProps) => {
//   const [availability, setAvailability] = useState<InspectorAvailability[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Time utility functions
//   const timeToMinutes = (timeStr: string): number => {
//     const [hours, minutes] = timeStr.split(':').map(Number);
//     return hours * 60 + minutes;
//   };

//   const minutesToTime = (minutes: number): string => {
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
//   };

//   const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
//     const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
//     return minutesToTime(totalMinutes);
//   };

//   const subtractMinutesFromTime = (timeStr: string, minutesToSubtract: number): string => {
//     const totalMinutes = timeToMinutes(timeStr) - minutesToSubtract;
//     return minutesToTime(Math.max(0, totalMinutes));
//   };

//   // Check if two time ranges overlap (including 30-minute buffer)
//   const hasTimeOverlap = (
//     start1: string,
//     end1: string,
//     start2: string,
//     end2: string,
//     bufferMinutes: number = 30
//   ): boolean => {
//     const start1Minutes = timeToMinutes(start1);
//     const end1Minutes = timeToMinutes(end1);
//     const start2Minutes = timeToMinutes(start2);
//     const end2Minutes = timeToMinutes(end2);

//     // Add buffer to the ranges
//     const bufferedStart1 = start1Minutes - bufferMinutes;
//     const bufferedEnd1 = end1Minutes + bufferMinutes;
//     const bufferedStart2 = start2Minutes - bufferMinutes;
//     const bufferedEnd2 = end2Minutes + bufferMinutes;

//     // Check for overlap
//     return !(bufferedEnd1 <= bufferedStart2 || bufferedEnd2 <= bufferedStart1);
//   };

//   // Check if a proposed time slot conflicts with busy times
//   const hasConflictWithBusyTimes = (
//     proposedStart: string,
//     proposedEnd: string,
//     busySlots: AvailabilitySlot[]
//   ): boolean => {
//     return busySlots.some(slot =>
//       hasTimeOverlap(proposedStart, proposedEnd, slot.start, slot.end, 30)
//     );
//   };

//   // Get available time slots that don't conflict with the proposed time
//   const getValidFreeSlots = (
//     freeSlots: AvailabilitySlot[],
//     proposedStart?: string,
//     proposedEnd?: string
//   ): AvailabilitySlot[] => {
//     if (!proposedStart || !proposedEnd) {
//       return freeSlots;
//     }

//     return freeSlots.filter(slot =>
//       !hasTimeOverlap(proposedStart, proposedEnd, slot.start, slot.end, 30)
//     );
//   };

//   // Check if inspector is available for the proposed time
//   const isInspectorAvailableForProposedTime = (inspector: InspectorAvailability): boolean => {
//     if (!proposedStartTime || !proposedEndTime) {
//       return inspector.availability.free_slots.length > 0;
//     }

//     // Check if proposed time conflicts with busy slots
//     const hasConflict = hasConflictWithBusyTimes(
//       proposedStartTime,
//       proposedEndTime,
//       inspector.availability.occupied_slots
//     );

//     if (hasConflict) {
//       return false;
//     }

//     // Check if proposed time falls within any free slot (with buffer)
//     return inspector.availability.free_slots.some(slot => {
//       const slotStart = timeToMinutes(slot.start);
//       const slotEnd = timeToMinutes(slot.end);
//       const proposedStart = timeToMinutes(proposedStartTime);
//       const proposedEnd = timeToMinutes(proposedEndTime);

//       // Proposed time should be completely within the free slot with buffer
//       return (
//         proposedStart >= slotStart &&
//         proposedEnd <= slotEnd &&
//         (proposedStart - slotStart >= 30 || slotStart === 0) && // 30-min buffer from start
//         (slotEnd - proposedEnd >= 30 || slotEnd === 24 * 60) // 30-min buffer to end
//       );
//     });
//   };

//   useEffect(() => {
//     const fetchAvailability = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const formattedDate = format(date, "yyyy-MM-dd");
//         const response = await frappeAPI.makeAuthenticatedRequest(
//           "GET",
//           `/api/method/eits_app.inspector_availability.get_employee_availability?date=${formattedDate}`
//         );
//         console.log("Availability response:", response.message.data);
//         if (response.message && response.message.status === "success") {
//           setAvailability(response.message.data);
//         } else {
//           setError("Failed to fetch availability data");
//         }
//       } catch (err) {
//         console.error("Error fetching availability:", err);
//         setError("Failed to fetch availability data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAvailability();
//   }, [date]);

//   const formatTime = (timeStr: string) => {
//     const [hours, minutes] = timeStr.split(':');
//     const hourNum = parseInt(hours, 10);
//     const period = hourNum >= 12 ? 'PM' : 'AM';
//     const displayHour = hourNum % 12 || 12;
//     return `${displayHour}:${minutes} ${period}`;
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
//       <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
//           <div>
//             <h3 className="text-base font-semibold text-gray-900">Inspector Availability</h3>
//             <p className="text-xs text-gray-500 mt-0.5">{format(date, "MMM dd, yyyy")}</p>
//             {proposedStartTime && proposedEndTime && (
//               <p className="text-xs text-blue-600 mt-0.5">
//                 Checking for: {formatTime(proposedStartTime)} - {formatTime(proposedEndTime)}
//               </p>
//             )}
//           </div>
//           <Button
//             variant="ghost"
//             size="sm"
//             className="h-8 w-8 p-0 rounded-full hover:bg-gray-200"
//             onClick={onClose}
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto">
//           {loading ? (
//             <div className="flex justify-center items-center h-32">
//               <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
//             </div>
//           ) : error ? (
//             <div className="text-red-500 text-center py-8 text-sm">{error}</div>
//           ) : (
//             <div className="space-y-3 p-4">
//               {availability.map((inspector) => {
//                 const isAvailableForProposed = isInspectorAvailableForProposedTime(inspector);
//                 const validFreeSlots = getValidFreeSlots(
//                   inspector.availability.free_slots,
//                   proposedStartTime,
//                   proposedEndTime
//                 );

//                 return (
//                   <div
//                     key={inspector.user_id}
//                     className={`bg-gray-50 rounded-lg p-3 border ${
//                       proposedStartTime && proposedEndTime
//                         ? isAvailableForProposed
//                           ? 'border-emerald-200 bg-emerald-50'
//                           : 'border-red-200 bg-red-50'
//                         : 'border-gray-200'
//                     }`}
//                   >
//                     {/* Inspector Header */}
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex-1 min-w-0">
//                         <h4 className="font-medium text-gray-900 text-sm truncate">
//                           {inspector.user_name}
//                         </h4>
//                         <p className="text-xs text-gray-500 truncate">{inspector.email}</p>
//                       </div>
//                       <div className="flex items-center gap-2 shrink-0 ml-2">
//                         {proposedStartTime && proposedEndTime ? (
//                           isAvailableForProposed ? (
//                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
//                               <CheckCircle2 className="h-3 w-3 mr-1" />
//                               Available
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
//                               <XCircle className="h-3 w-3 mr-1" />
//                               Conflict
//                             </span>
//                           )
//                         ) : inspector.availability.is_completely_free ? (
//                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
//                             <CheckCircle2 className="h-3 w-3 mr-1" />
//                             Available
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
//                             <Clock className="h-3 w-3 mr-1" />
//                             Partial
//                           </span>
//                         )}
//                         {onSelectInspector && (
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             className="text-xs h-7 px-2"
//                             onClick={() => {
//                               onSelectInspector(inspector.email, availability);
//                               onClose();
//                             }}
//                             disabled={
//                               proposedStartTime && proposedEndTime
//                                 ? !isAvailableForProposed
//                                 : !inspector.availability.free_slots.length
//                             }
//                           >
//                             Select
//                           </Button>
//                         )}
//                       </div>
//                     </div>

//                     {/* Conflict Warning */}
//                     {proposedStartTime && proposedEndTime && !isAvailableForProposed && (
//                       <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-md">
//                         <p className="text-xs text-red-700 flex items-center">
//                           <XCircle className="h-3 w-3 mr-1" />
//                           Time conflict: Proposed time overlaps with busy schedule or insufficient buffer time (30 min required)
//                         </p>
//                       </div>
//                     )}

//                     {/* Availability Details */}
//                     <div className="flex gap-3">
//                       {/* Free Slots */}
//                       {(proposedStartTime && proposedEndTime ? validFreeSlots : inspector.availability.free_slots).length > 0 && (
//                         <div>
//                           <h5 className="text-xs font-medium text-emerald-700 mb-1 flex items-center">
//                             <CheckCircle2 className="h-3 w-3 mr-1" />
//                             {proposedStartTime && proposedEndTime ? 'Available Times (No Conflict)' : 'Available Times'}
//                           </h5>
//                           <div className="flex flex-wrap gap-1">
//                             {(proposedStartTime && proposedEndTime ? validFreeSlots : inspector.availability.free_slots).map((slot, index) => (
//                               <span
//                                 key={index}
//                                 className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
//                               >
//                                 {formatTime(slot.start)} - {formatTime(slot.end)}
//                                 {slot.duration_hours && (
//                                   <span className="text-gray-600 ml-1">
//                                     ({slot.duration_hours}h)
//                                   </span>
//                                 )}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Occupied Slots */}
//                       {inspector.availability.occupied_slots.length > 0 && (
//                         <div>
//                           <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
//                             <XCircle className="h-3 w-3 mr-1" />
//                             Busy Times
//                           </h5>
//                           <div className="flex flex-wrap gap-1">
//                             {inspector.availability.occupied_slots.map((slot, index) => {
//                               const hasConflictWithProposed = proposedStartTime && proposedEndTime &&
//                                 hasTimeOverlap(proposedStartTime, proposedEndTime, slot.start, slot.end, 30);

//                               return (
//                                 <span
//                                   key={index}
//                                   className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
//                                     hasConflictWithProposed
//                                       ? 'bg-red-200 text-red-800 border border-red-300'
//                                       : 'bg-gray-100 text-gray-700'
//                                   }`}
//                                 >
//                                   {formatTime(slot.start)} - {formatTime(slot.end)}
//                                   {hasConflictWithProposed && (
//                                     <XCircle className="h-3 w-3 ml-1 text-red-600" />
//                                   )}
//                                 </span>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       )}

//                       {/* No availability message */}
//                       {inspector.availability.free_slots.length === 0 && inspector.availability.occupied_slots.length === 0 && (
//                         <p className="text-xs text-gray-500 text-center py-2">No schedule information available</p>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}

//               {availability.length === 0 && !loading && (
//                 <div className="text-center py-8">
//                   <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
//                   <p className="text-sm text-gray-500">No inspectors found for this date</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserAvailability;
