/* eslint-disable @typescript-eslint/no-explicit-any */
// TodoTable.tsx
import { format } from "date-fns";
import { ArrowUpDown, ClipboardList, Edit } from "lucide-react";
import { getPriorityColor, getStatusColor } from "../../../helpers/helper";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

interface TodoTableProps {
  todos: any[];
  loading: boolean;
  onEdit: (todo: any) => void;
  sortOrder: 'asc' | 'desc';
  onSortChange: (order: 'asc' | 'desc') => void;
}

const TodoTable: React.FC<TodoTableProps> = ({ 
  todos, 
  loading, 
  onEdit, 
  sortOrder, 
  onSortChange 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="inline-flex items-center justify-center bg-emerald-50 rounded-full p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No inspections found
        </h3>
        <p className="text-sm text-gray-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  const handleSortToggle = () => {
    onSortChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-200 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                <button
                  onClick={handleSortToggle}
                  className="flex items-center  hover:text-emerald-600 transition-colors"
                >
                  Date & Time
                  {sortOrder === 'asc' ? (
                    <ArrowUpDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                Customer
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                Inspector
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                Priority
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                Status
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
                Property Area
              </th>
              <th className="py-4 px-6 text-center font-semibold text-gray-700 border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {todos.map((todo, index) => (
              <tr
                key={todo.name || index}
                className={`
 ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}
 
 `}
              >
                {/* Date & Time */}
                <td className="py-4 px-6 align-top">
                  <div className="text-gray-700">
                    <div>
                      {todo.date
                        ? format(new Date(todo.date), "dd MMM yyyy")
                        : "Not specified"}
                    </div>
                    {todo.custom_start_time && todo.custom_end_time && (
                      <div className="text-xs text-gray-500">
                        {format(new Date(todo.custom_start_time), "hh:mm a")} -{" "}
                        {format(new Date(todo.custom_end_time), "hh:mm a")}
                      </div>
                    )}
                  </div>
                </td>

                {/* Customer Name */}
                <td className="py-4 px-6 align-top">
                  <div className="font-semibold text-gray-800">
                    {todo.inquiry_data?.lead_name?.charAt(0).toUpperCase() +
                      todo.inquiry_data?.lead_name?.slice(1) || "N/A"}
                  </div>
                  {todo.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {todo.description}
                    </div>
                  )}
                </td>

                {/* Inspector */}
                <td className="py-4 px-6 align-top">
                  <div className="text-gray-700">
                    {todo.allocated_to_name || "N/A"}
                  </div>
                </td>

                {/* Priority */}
                <td className="py-4 px-6 align-top">
                  <Badge
                    style={{
                      backgroundColor: getPriorityColor(todo.priority).bg,
                      color: getPriorityColor(todo.priority).text,
                      borderColor: getPriorityColor(todo.priority).border,
                    }}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {todo.priority}
                  </Badge>
                </td>

                {/* Status */}
                <td className="py-4 px-6 align-top">
                  <Badge
                    style={{
                      backgroundColor: getStatusColor(todo.status).bg,
                      color: getStatusColor(todo.status).text,
                      borderColor: getStatusColor(todo.status).border,
                    }}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {todo.status}
                  </Badge>
                </td>

                {/* Property Area */}
                <td className="py-4 px-6 align-top">
                  <div className="text-gray-700">
                    {todo.inquiry_data?.custom_property_area || "-"}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6 align-top">
                  <div className="flex justify-center">
                    {todo.status !== "Closed" && (
                      <Button
                        onClick={() => onEdit(todo)}
                        variant="outline"
                        size="sm"
                        className="h-8 px-4 py-1.5 text-xs rounded-full border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
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

export default TodoTable;