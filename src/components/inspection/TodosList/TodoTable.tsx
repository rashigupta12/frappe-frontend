import { format } from "date-fns";
import { ClipboardList, UserPenIcon } from "lucide-react";

import { Button } from "../../ui/button";
import type { Todo } from "./type";

interface InspectionTableProps {
  todos: Todo[];
  loading: boolean;
  onEdit: (todo: Todo) => void;
}

const InspectionTable = ({ todos, loading, onEdit }: InspectionTableProps) => {
  // const getPriorityIcon = (priority: string) => {
  //   switch (priority) {
  //     case "High":
  //       return "🔴";
  //     case "Medium":
  //       return "🟡";
  //     case "Low":
  //       return "🟢";
  //     default:
  //       return "⚪";
  //   }
  // };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-gray-500">
        <div className="inline-flex items-center justify-center bg-emerald-50/50 rounded-full p-4 mb-3">
          <ClipboardList className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">
          No inspections found
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className=" overflow-y-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
            <tr>
              {/* <th className="py-3 px-4 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap">
                Priority
              </th> */}
              <th className="py-3 px-4 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-36">
                Date & Time
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-36">
                Customer
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-52">
                Job Type
              </th>

              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap w-52">
                Property Area
              </th>
              <th className="py-3 px-2 text-left font-bold text-gray-800 border-b-2 border-gray-200">
                Description
              </th>
              <th className="py-3 px-2 text-center font-bold text-gray-800 border-b-2 border-gray-200 whitespace-nowrap ">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {todos.map((todo) => (
              <tr
                key={todo.name}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                {/* Priority */}
                {/* <td className="py-3 px-4 align-center">
                  {getPriorityIcon(todo.priority || "")}
                </td> */}
                {/* Date & Time */}
                <td className="py-3 px-4 align-top">
                  <div className="text-gray-700">
                    <div>
                      
                      {todo.date
                        ? format(new Date(todo.date), "dd/MM/yyyy")
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
                <td className="py-3 px-2 align-top">
                  <div className="font-semibold text-emerald-700">
                    {todo.inquiry_data?.lead_name || "N/A"}
                  </div>
                  {todo.inquiry_data?.mobile_no && (
                    <div className="text-xs text-gray-500 mt-1">
                      {todo.inquiry_data.mobile_no}
                    </div>
                  )}
                </td>

                {/* Job Type */}
                <td className="py-3 px-2 align-top">
                  <div className="text-gray-700">
                    {todo.inquiry_data?.custom_jobtype
                      ?.map((j) => j.job_type)
                      .join(", ") || "N/A"}
                  </div>
                </td>

                {/* Property Area */}
                <td className="py-3 px-2 align-top">
                  <div className="text-gray-700">
                    {[
                      todo.inquiry_data?.custom_property_area,
                      todo.inquiry_data?.custom_property_category,
                      todo.inquiry_data?.custom_property_type,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </div>
                </td>

                {/* Description */}
                <td className="py-3 px-2 align-top">
                  <div className="text-gray-700 ">{todo.description}</div>
                </td>

                {/* Actions */}
                <td className="py-3  align-top">
                  <div className="flex justify-center">
                    <Button
                      onClick={() => onEdit(todo)}
                      size="sm"
                      className="h-8 flex items-center gap-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200 hover:shadow-sm"
                    >
                      <UserPenIcon className="h-3 w-3" />
                    </Button>
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

export default InspectionTable;