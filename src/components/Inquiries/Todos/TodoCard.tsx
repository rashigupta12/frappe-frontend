/* eslint-disable @typescript-eslint/no-explicit-any */
// TodoCard.tsx
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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 border border-gray-100 shadow-xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300">
      <div className="flex justify-between items-start gap-2">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Lead name with truncation */}
            <h4 className="font-semibold text-sm text-gray-800 truncate flex-1 mb-2">
              {todo.inquiry_data?.lead_name.charAt(0).toUpperCase() +
                todo.inquiry_data?.lead_name.slice(1)}
            </h4>

            {/* Priority and Status badges aligned to right */}
            <div className="flex items-center gap-1 ml-2">
              <Badge
                style={{
                  backgroundColor: getPriorityColor(todo.priority).bg,
                  color: getPriorityColor(todo.priority).text,
                  borderColor: getPriorityColor(todo.priority).border,
                }}
                className="text-xs whitespace-nowrap"
              >
                {todo.priority}
              </Badge>
              <Badge
                style={{
                  backgroundColor: getStatusColor(todo.status).bg,
                  color: getStatusColor(todo.status).text,
                  borderColor: getStatusColor(todo.status).border,
                }}
                className="text-xs whitespace-nowrap"
              >
                {todo.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                Date:{" "}
                <span className="font-medium">
                  {todo.date
                    ? format(new Date(todo.date), "dd/MM/yyyy")
                    : "Not specified"}
                </span>
              </span>
            </div>
            {todo.custom_start_time && todo.custom_end_time && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">
                  Time:{" "}
                  <span className="font-medium">
                    {format(new Date(todo.custom_start_time), "hh:mm a")} -{" "}
                    {format(new Date(todo.custom_end_time), "hh:mm a")}
                  </span>
                </span>
              </div>
            )}
          </div>
          {/* Additional details below */}
          <div className=" space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">
                Inspector:{" "}
                <span className="font-medium">
                  {todo.allocated_to_name}
                </span>
              </span>
            </div>

            {todo.inquiry_data?.custom_property_area && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">
                  <span className="font-medium">
                    {todo.inquiry_data.custom_property_area}
                  </span>
                </span>
              </div>
            )}

            {todo.description && (
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 leading-tight line-clamp-2">
                  {todo.description}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Button - moved to bottom right */}
      {todo.status !== "Closed" && (
        <div className="flex justify-end ">
          <Button
            onClick={() => onEdit(todo)}
            variant="outline"
            size="sm"
            className="h-6 flex items-center gap-1 text-xs  border-emerald-900 text-emerald-800 hover:bg-emerald-900 hover:border-emerald-900 hover:text-emerald-900 transition-all duration-200"
          >
            <Edit className="h-3 w-3 text-emerald-900" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TodoCard;