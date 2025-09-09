import { UserPen } from "lucide-react";
import { Button } from "../../ui/button";
import type { Todo } from "./type";


interface MobileInspectionCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

const MobileInspectionCard = ({ todo, onEdit }: MobileInspectionCardProps) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return "🔴";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const formatTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm">
              {getPriorityIcon(todo.priority || "")}
            </span>
            <span className="text-sm">
              {todo.date && formatDate(todo.date)}
            </span>

            <span className="text-sm">
              ({todo.custom_start_time && formatTime(todo.custom_start_time)}
            </span>
            {todo.custom_end_time && (
              <>
                <span>-</span>
                <span className="text-sm">
                  {formatTime(todo.custom_end_time)})
                </span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
            <span className="text-gray-600" style={{ whiteSpace: "pre-line" }}>
              {todo.inquiry_data?.custom_jobtype
                ?.map((j) => j.job_type)
                .join("\n") || "N/A"}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs lg:text-xs px-2 py-1 h-7 lg:h-8 ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => onEdit(todo)}
        >
          
        <UserPen className="h-4 w-4 "/>
        </Button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs lg:text-xs">
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">👤</span>
          <span className="text-gray-600 font-semibold truncate capitalize">
            {todo.inquiry_data?.lead_name || "N/A"}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">🏠</span>
          <span className="text-gray-600 truncate">
            {todo.inquiry_data?.custom_type_of_building || "N/A"}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">📞</span>
          <span className="text-gray-600 truncate">
            {todo.inquiry_data?.mobile_no ||
              todo.inquiry_data?.phone ||
              "N/A"}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">💰</span>
          <span className="text-gray-600 truncate">
            {todo.inquiry_data?.custom_budget_range || "N/A"}
          </span>
        </div>
      </div>

      {todo.inquiry_data?.custom_property_area && (
        <div className="pt-1 border-t border-gray-100 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">📍</span>
            <span className="text-gray-600 text-xs font-semibold">
              {[
                todo.inquiry_data?.custom_property_area,
                todo.inquiry_data?.custom_property_category,
                todo.inquiry_data?.custom_property_type,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      {todo.description && (
        <div className="border-t border-gray-100 pt-1">
          <p className="text-xs text-gray-600 line-clamp-2 lg:line-clamp-3">
            {todo.description.replace(/<[^>]*>/g, "")}
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileInspectionCard;