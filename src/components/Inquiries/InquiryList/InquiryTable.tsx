import { ClipboardList, Pen } from "lucide-react";
import React from "react";
import { type Lead } from "../../../context/LeadContext";
import { Button } from "../../ui/button";
import {
  getBudgetColor,
  getJobTypeColor,
  getUrgencyColor,
} from "../../../helpers/helper";

interface InquiryTableProps {
  inquiries: Lead[];
  openViewModal: (inquiry: Lead) => void;
  openEditInquiryForm: (inquiry: Lead) => void;
  handleOpenDialog: (inquiry: Lead) => void;
  getJobTypesForInquiry: (inquiry: Lead) => string[];
}

const getUrgencyShortLabel = (urgency: string) => {
  const labels: Record<string, string> = {
    "1. Urgent": "Urgent",
    "2. Normal : 2-3 days": "Normal (2-3d)",
    "3. Relaxed : 4-7 days": "Relaxed (4-7d)",
    "4. Planned : 1 - 2 week": "Planned (1-2w)",
    "5. Planned : 1 month & above": "Planned (1m+)",
    High: "High",
    Medium: "Medium",
    Low: "Low",
  };
  return labels[urgency] || urgency;
};

const InquiryTable: React.FC<InquiryTableProps> = ({
  inquiries,
  openViewModal,
  openEditInquiryForm,
  handleOpenDialog,
  getJobTypesForInquiry,
}) => (
  <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <tr>
            <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
              Customer
            </th>
            <th className="py-4 px-6 text-left font-semibold text-gray-700 border-b border-gray-200">
              Job Types
            </th>
            <th className="py-4 px-2 text-left font-semibold text-gray-700 border-b border-gray-200">
              Urgency
            </th>
            <th className="py-4 px-2 text-left font-semibold text-gray-700 border-b border-gray-200">
              Budget
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
          {inquiries.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-500">
                <div className="flex flex-col items-center space-y-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-4 md:mx-0">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700">
                    No inquiries found
                  </p>
                  <p className="text-sm text-gray-500">
                    New inquiries will appear here
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            inquiries.map((inquiry, index) => (
              <tr
                key={inquiry.name || index}
                className={`
 ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}
 
 `}
              >
                {/* Customer Name */}
                <td className="py-4 px-6">
                  <div
                    className="cursor-pointer"
                    onClick={() => openViewModal(inquiry)}
                  >
                    <div className="font-semibold text-gray-800 hover:text-emerald-700">
                      {inquiry.lead_name || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Ph: {inquiry.mobile_no}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {inquiry.email_id || "N/A"}
                    </div>
                  </div>
                </td>

                {/* Job Types */}
                <td className="py-4 px-6 align-top">
                  <div className="flex flex-wrap gap-1.5 max-w-48">
                    {getJobTypesForInquiry(inquiry)
                      .slice(0, 2)
                      .map((type, idx) => {
                        const colors = getJobTypeColor(type);
                        return (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 rounded-full text-xs font-medium border"
                            style={{
                              color: colors.text,
                              borderColor: colors.border,
                            }}
                          >
                            {type.replace(/^\d+\.\s*/, "").substring(0, 15)}
                            {type.replace(/^\d+\.\s*/, "").length > 15
                              ? "..."
                              : ""}
                          </span>
                        );
                      })}
                    {getJobTypesForInquiry(inquiry).length > 2 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                        +{getJobTypesForInquiry(inquiry).length - 2} more
                      </span>
                    )}
                  </div>
                </td>

                {/* Urgency */}
                <td className="py-4 px-2 align-top">
                  {inquiry.custom_project_urgency ? (
                    <span
                      className="inline-block px-3 py-1.5  text-xs font-semibold "
                      style={{
                        color: getUrgencyColor(inquiry.custom_project_urgency)
                          .text,
                        borderColor: getUrgencyColor(
                          inquiry.custom_project_urgency
                        ).border,
                      }}
                    >
                      {getUrgencyShortLabel(inquiry.custom_project_urgency)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>

                {/* Budget */}
                <td className="py-4 px-2 align-top">
                  {inquiry.custom_budget_range ? (
                    <span
                      className="inline-block px-2.5 py-1  text-xs font-semibold "
                      style={{
                        color: getBudgetColor(inquiry.custom_budget_range).text,
                        borderColor: getBudgetColor(inquiry.custom_budget_range)
                          .border,
                      }}
                    >
                      {inquiry.custom_budget_range}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>

                {/* Property Area */}
                <td className="py-4 px-6 align-top">
                  <div className="text-gray-700 font-medium w-52">
                    {inquiry.custom_property_area}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {inquiry.custom_property_category} ,{" "}
                    {inquiry.custom_property_type}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-6">
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors duration-200"
                      onClick={() => openEditInquiryForm(inquiry)}
                    >
                      <Pen className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-200 text-gray-700 hover:bg-teal-50 hover:border-teal-300 transition-colors duration-200"
                      onClick={() => handleOpenDialog(inquiry)}
                    >
                      <ClipboardList className="h-3.5 w-3.5 mr-1" />
                      Assign
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default InquiryTable;
