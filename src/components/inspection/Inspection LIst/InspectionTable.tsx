// InspectionTable.tsx
import { Button } from "../../ui/button";
import { Eye, UserPenIcon } from "lucide-react";
import { StatusDropdown } from "./StatusDropdown";
import type { InspectionTableProps } from "./types";

export const InspectionTable = ({
  inspections,
  onStatusChange,
  onNavigate,
  updatingStatus,
  loading,
}: InspectionTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }


  console.log(inspections)

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-gray-500">
        <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-4 mb-3">
          <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">No inspections found</h3>
        <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="overflow-y-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-36">
                Date & Time
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-36">
                Customer
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-32">
                Status
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-32">
                Property Type
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-40">
                Areas
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200">
                Notes
              </th>
              <th className="py-3 px-2 text-center font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inspections.map((inspection) => (
              <tr key={inspection.name} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="py-3 px-4 align-top">
                  <div className="text-gray-700">
                    <div className="font-medium">
                      {inspection.inspection_date
                        ? new Date(inspection.inspection_date).toLocaleDateString("en-GB")
                        : "Not specified"}
                    </div>
                    {inspection.inspection_time && (
                      <div className="text-xs text-gray-500">{inspection.inspection_time}</div>
                    )}
                  </div>
                </td>

                <td className="py-3 px-2 align-top">
                  <div className="font-semibold text-emerald-700 capitalize">
                    {inspection.customer_name || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{inspection.name}</div>
                </td>

                <td className="py-3 px-2 align-top">
                  <StatusDropdown
                    currentStatus={inspection.inspection_status}
                    inspectionName={inspection.name}
                    onStatusChange={onStatusChange}
                    isUpdating={updatingStatus === inspection.name}
                    inspectionDate={inspection.inspection_date}
                  />
                </td>

                <td className="py-3 px-2 align-top">
                  <div className="text-gray-700">{inspection.property_type || "N/A"}</div>
                </td>

                <td className="py-3 px-2 align-top">
                 
                  <div className="text-sm text-gray-700">
                    {inspection.site_dimensions?.length || 0} Areas
                  </div>
                </td>

                <td className="py-3 px-2 align-top">
                  <div className="text-gray-700 max-w-xs truncate">
                    {inspection.inspection_notes?.replace(/<[^>]*>/g, "") || "-"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Modified: {new Date(inspection.modified).toLocaleDateString("en-GB")}
                    {inspection.follow_up_required === 1 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                        Follow-up
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 align-top">
                  <div className="flex justify-center">
                    {inspection.docstatus === 1 ? (
                      <Button
                        onClick={() => onNavigate(inspection)}
                        size="sm"
                        className="h-8 flex items-center gap-1 text-xs bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onNavigate(inspection)}
                        size="sm"
                        className="h-8 flex items-center gap-1 text-xs bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200"
                      >
                        <UserPenIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};