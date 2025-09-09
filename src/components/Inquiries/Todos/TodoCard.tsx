/* eslint-disable @typescript-eslint/no-explicit-any */
// TodoCard.tsx - A modern, softer version
import { CalendarIcon, ClockIcon, Edit, FileText, MapPin, User } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { getPriorityColor, getStatusColor } from "../../../helpers/helper";
import { format } from "date-fns";

interface TodoCardProps {
  todo: any;
  onEdit: (todo: any) => void;
}

const TodoCard: React.FC<TodoCardProps> = ({ todo, onEdit }) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200">
      
      {/* Header with Lead Name and Badges */}
      <div className="flex items-start justify-between mb-3">
        {/* Lead name */}
        <h4 className="flex-1 font-bold text-base text-gray-800 truncate pr-2">
          {todo.inquiry_data?.lead_name.charAt(0).toUpperCase() +
            todo.inquiry_data?.lead_name.slice(1)}
        </h4>

        {/* Priority and Status badges */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Badge
            style={{
              backgroundColor: getPriorityColor(todo.priority).bg,
              color: getPriorityColor(todo.priority).text,
              borderColor: getPriorityColor(todo.priority).border,
            }}
            className="text-xs font-semibold px-2 py-0.5"
          >
            {todo.priority}
          </Badge>
          <Badge
            style={{
              backgroundColor: getStatusColor(todo.status).bg,
              color: getStatusColor(todo.status).text,
              borderColor: getStatusColor(todo.status).border,
            }}
            className="text-xs font-semibold px-2 py-0.5"
          >
            {todo.status}
          </Badge>
        </div>
      </div>

      {/* Main Content Details */}
      <div className="space-y-2 text-sm text-gray-600">
        
        {/* Date and Time */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="font-normal">
            {todo.date
              ? format(new Date(todo.date), "dd MMMM yyyy")
              : "Not specified"}
          </span>
          {todo.custom_start_time && todo.custom_end_time && (
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
              <span className="font-normal">
                {format(new Date(todo.custom_start_time), "hh:mm a")} -{" "}
                {format(new Date(todo.custom_end_time), "hh:mm a")}
              </span>
            </div>
          )}
        </div>

        {/* Inspector Name */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="truncate">
            Inspector:{" "}
            <span className="font-medium text-gray-800">
              {todo.allocated_to_name}
            </span>
          </span>
        </div>

        {/* Property Area */}
        {todo.inquiry_data?.custom_property_area && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="font-normal truncate">
              {todo.inquiry_data.custom_property_area}
            </span>
          </div>
        )}

        {/* Description */}
        {todo.description && (
          <div className="flex items-start gap-2 pt-1">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-snug">
              {todo.description}
            </span>
          </div>
        )}
      </div>

      {/* Edit Button */}
      {todo.status !== "Closed" && (
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onEdit(todo)}
            variant="outline"
            size="sm"
            className="h-8 px-4 py-1.5 text-xs rounded-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400"
          >
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default TodoCard;