// src/components/InquiryViewModal.tsx

import React from "react";
// import { format } from "date-fns";
import {
  Building,
  Edit,
  FileText,
  Home,
  Phone,
  X
} from "lucide-react";
import { type Lead } from "../../../context/LeadContext";
import { getJobTypeColor } from "../../../helpers/helper";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

interface InquiryViewModalProps {
  inquiry: Lead;
  onClose: () => void;
  onEdit: (inquiry: Lead) => void;
  getJobTypesForInquiry: (inquiry: Lead) => string[];
}

const InquiryViewModal: React.FC<InquiryViewModalProps> = ({
  inquiry,
  onClose,
  onEdit,
  getJobTypesForInquiry,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl relative max-h-[90vh] overflow-y-auto">
        <div className="bg-emerald-600 p-4 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inquiry Details</h2>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/10"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              Customer Details
            </h3>

            <div className="text-sm">
              {inquiry.lead_name || inquiry.email_id || inquiry.mobile_no ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[inquiry.lead_name, inquiry.mobile_no, inquiry.email_id]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">
                  No contact details available
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Home className="h-5 w-5 text-emerald-600" />
              Job Details
            </h3>

            <div className="text-sm space-y-2">
              {getJobTypesForInquiry(inquiry).length > 0 && (
                <div>
                  <span className="text-gray-700 font-medium">Job Types: </span>

                  <div className="mt-1 flex flex-wrap gap-1">
                    {getJobTypesForInquiry(inquiry).map((jobType, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs px-2 py-0.5 rounded-full border shadow-none"
                        style={{
                          backgroundColor: getJobTypeColor(jobType).bg + "20",
                          color: getJobTypeColor(jobType).text,
                          borderColor: getJobTypeColor(jobType).border,
                        }}
                      >
                        {jobType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(inquiry.custom_budget_range ||
                inquiry.custom_project_urgency) && (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiry.custom_budget_range,
                      inquiry.custom_project_urgency,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              )}

              {!getJobTypesForInquiry(inquiry).length &&
                !inquiry.custom_budget_range &&
                !inquiry.custom_project_urgency && (
                  <span className="text-gray-500">N/A</span>
                )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-600" />
              Property Details
            </h3>

            <div className="text-sm">
              <div className="break-words">
                <span className="text-gray-900">
                  {[
                    inquiry.custom_property_category,
                    inquiry.custom_property_area,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </span>
              </div>
            </div>
          </div>

          {/* <div className="bg-gray-50 p-4 py-2 rounded-lg">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Inspection Schedule
            </h3>

            <div className="text-sm">
              {inquiry.custom_preferred_inspection_date ||
              inquiry.custom_preferred_inspection_time ? (
                <div className="break-words">
                  <span className="text-gray-900">
                    {[
                      inquiry.custom_preferred_inspection_date &&
                        format(
                          new Date(inquiry.custom_preferred_inspection_date),
                          "dd/MM/yyyy"
                        ),
                      inquiry.custom_preferred_inspection_time,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
          </div> */}

          {inquiry.custom_special_requirements && (
            <div className="bg-gray-50 p-4 py-2 rounded-lg">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Special Requirements
              </h3>

              <div className="text-sm text-gray-900 mt-1">
                {inquiry.custom_special_requirements}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="px-6">
              Close
            </Button>

            <Button
              onClick={() => {
                onClose();
                onEdit(inquiry);
              }}
              className="px-6 bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryViewModal;
