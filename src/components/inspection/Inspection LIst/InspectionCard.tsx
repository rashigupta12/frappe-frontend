
// InspectionCard.tsx
import { Button } from "../../ui/button";
import { Eye } from "lucide-react";
import { StatusDropdown } from "./StatusDropdown";
import type { InspectionCardProps } from "./types";

export const InspectionCard = ({
  inspection,
  onStatusChange,
  onNavigate,
  updatingStatus,
}: InspectionCardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "⏳";
      case "In Progress":
        return "🔄";
      case "Completed":
        return "✅";
      case "On Hold":
        return "⏸️";
      default:
        return "📋";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow capitalize">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg lg:text-lg">{getStatusIcon(inspection.inspection_status)}</span>
            <h3 className="text-sm lg:text-base font-semibold text-gray-900 truncate">
              {inspection.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-xs lg:text-xs text-gray-500">
            <span>
              {inspection.inspection_date &&
                new Date(inspection.inspection_date).toLocaleDateString("en-GB")}
            </span>
            <span>•</span>
            <span className="truncate">{inspection.inspection_time || "Time not set"}</span>
          </div>
        </div>

        {inspection.docstatus === 1 ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs lg:text-sm px-2 py-1 h-7 lg:h-8 text-blue-600 hover:bg-blue-600 hover:text-white border-none"
            onClick={() => onNavigate(inspection)}
          >
            <Eye className="w-5 h-5 mr-1" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs lg:text-sm px-2 py-1 h-7 lg:h-8 bg-purple-500 text-white hover:bg-purple-600"
            onClick={() => onNavigate(inspection)}
          >
            Update
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs lg:text-sm">
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">👤</span>
          <span className="text-gray-600 font-semibold capitalize truncate">
            {inspection.customer_name || "N/A"}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">🏠</span>
          <span className="text-gray-600 truncate">{inspection.property_type || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">📋</span>
          <span className="text-gray-600 truncate">{inspection.lead || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">📐</span>
          <span className="text-gray-600 truncate">
            {inspection.site_dimensions?.length || 0} Areas
          </span>
        </div>
      </div>

      {inspection.inspection_notes && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs lg:text-sm text-gray-600 line-clamp-2 lg:line-clamp-3">
            {inspection.inspection_notes.replace(/<[^>]*>/g, "")}
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs lg:text-sm text-gray-500">
            Modified:{" "}
            {new Date(inspection.modified).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>

          {inspection.follow_up_required === 1 && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs lg:text-sm rounded-full">
              Follow-up
            </span>
          )}
        </div>

        <StatusDropdown
          currentStatus={inspection.inspection_status}
          inspectionName={inspection.name}
          onStatusChange={onStatusChange}
          isUpdating={updatingStatus === inspection.name}
          inspectionDate={inspection.inspection_date}
        />
      </div>
    </div>
  );
};
