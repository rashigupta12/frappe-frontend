// // components/UserAvailability.tsx
// import { X } from "lucide-react";
// import { Button } from "../ui/button";
// import { useEffect, useState } from "react";
// import { frappeAPI } from "../../api/frappeClient";
// import { Loader2 } from "lucide-react";
// import { Clock } from "lucide-react";
// import { CheckCircle2 } from "lucide-react";
// import { XCircle } from "lucide-react";
// import { format } from "date-fns"; // Added missing import

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
//   onSelectInspector?: (email: string, availabilityData: InspectorAvailability[]) => void; // Modified to pass availability data
// }

// const UserAvailability = ({ date, onClose, onSelectInspector }: UserAvailabilityProps) => {
//   const [availability, setAvailability] = useState<InspectorAvailability[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

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
//               {availability.map((inspector) => (
//                 <div key={inspector.user_id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//                   {/* Inspector Header */}
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1 min-w-0">
//                       <h4 className="font-medium text-gray-900 text-sm truncate">
//                         {inspector.user_name}
//                       </h4>
//                       <p className="text-xs text-gray-500 truncate">{inspector.email}</p>
//                     </div>
//                     {inspector.availability.is_completely_free ? (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 shrink-0 ml-2">
//                         <CheckCircle2 className="h-3 w-3 mr-1" />
//                         Available
//                       </span>
//                     ) : (
//                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 shrink-0 ml-2">
//                         <Clock className="h-3 w-3 mr-1" />
//                         Partial
//                       </span>
//                     )}
//                   </div>

//                   {/* Availability Details */}
//                   <div className="flex  gap-2 ">
//                     {/* Free Slots */}
//                     {inspector.availability.free_slots.length > 0 && (
//                       <div>
//                         <h5 className="text-xs font-medium text-emerald-700 mb-1 flex items-center">
//                           <CheckCircle2 className="h-3 w-3 mr-1" />
//                           Available Times
//                         </h5>
//                         <div className="flex flex-wrap gap-1">
//                           {inspector.availability.free_slots.map((slot, index) => (
//                             <span
//                               key={index}
//                               className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
//                             >
//                               {formatTime(slot.start)} - {formatTime(slot.end)}
//                               {slot.duration_hours && (
//                                 <span className="text-emerald-600 ml-1">
//                                   ({slot.duration_hours}h)
//                                 </span>
//                               )}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* Occupied Slots */}
//                     {inspector.availability.occupied_slots.length > 0 && (
//                       <div>
//                         <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
//                           <XCircle className="h-3 w-3 mr-1" />
//                           Busy Times
//                         </h5>
//                         <div className="flex flex-wrap gap-1">
//                           {inspector.availability.occupied_slots.map((slot, index) => (
//                             <span
//                               key={index}
//                               className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-50 text-red-700 border border-red-200"
//                             >
//                               {formatTime(slot.start)} - {formatTime(slot.end)}
//                             </span>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* No availability message */}
//                     {inspector.availability.free_slots.length === 0 && inspector.availability.occupied_slots.length === 0 && (
//                       <p className="text-xs text-gray-500 text-center py-2">No schedule information available</p>
//                     )}
//                   </div>

//                   {/* Select Button */}
//                   {onSelectInspector && (
//                     <div className="mt-3 pt-2 border-t border-gray-200">
//                       <Button
//                         size="sm"
//                         className="w-full text-xs h-8"
//                         onClick={() => {
//                           onSelectInspector(inspector.email, availability);
//                           onClose();
//                         }}
//                         disabled={!inspector.availability.free_slots.length}
//                       >
//                         {inspector.availability.free_slots.length > 0 ? 'Select Inspector' : 'No Availability'}
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               ))}

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Inspector Availability</h3>
            <p className="text-xs text-gray-500 mt-0.5">{format(date, "MMM dd, yyyy")}</p>
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
                <div key={inspector.user_id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {/* Inspector Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {inspector.user_name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{inspector.email}</p>
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
                    {inspector.availability.free_slots.length > 0 && (
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
                    )}

                    {/* Occupied Slots */}
                    {inspector.availability.occupied_slots.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-700 mb-1 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Busy Times
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {inspector.availability.occupied_slots.map((slot, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
                            >
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No availability message */}
                    {inspector.availability.free_slots.length === 0 && inspector.availability.occupied_slots.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">No schedule information available</p>
                    )}
                  </div>


                </div>
              ))}

              {availability.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No inspectors found for this date</p>
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