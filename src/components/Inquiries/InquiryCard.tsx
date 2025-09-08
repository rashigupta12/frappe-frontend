// src/components/InquiryCard.tsx

import { format } from "date-fns";
import { Calendar, Edit, MapPin, Phone, User } from "lucide-react";
import React, { useCallback } from "react";
import { type Lead } from "../../context/LeadContext";
import {
  getBudgetColor,
  getJobTypeColor,
  getUrgencyColor,
  getUrgencyShortLabel,
} from "../../helpers/helper";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface InquiryCardProps {
  inquiry: Lead;
  openViewModal: (inquiry: Lead) => void;
  openEditInquiryForm: (inquiry: Lead) => void;
  handleOpenDialog: (inquiry: Lead) => void;
  getJobTypesForInquiry: (inquiry: Lead) => string[];
}

const InquiryCard: React.FC<InquiryCardProps> = ({
  inquiry,
  openViewModal,
  openEditInquiryForm,
  handleOpenDialog,
  getJobTypesForInquiry,
}) => {
  // Component to render multiple job type badges
  const JobTypeBadges = useCallback(
    ({ maxVisible = 2 }: { maxVisible?: number }) => {
      const jobTypes = getJobTypesForInquiry(inquiry);

      if (jobTypes.length === 0) return null;

      const visibleJobTypes = jobTypes.slice(0, maxVisible);
      const remainingCount = jobTypes.length - maxVisible;

      return (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleJobTypes.map((jobType, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs px-1.5 py-0.5 rounded-full border shadow-none"
              style={{
                backgroundColor: getJobTypeColor(jobType).bg + "20",
                color: getJobTypeColor(jobType).text,
                borderColor: getJobTypeColor(jobType).border,
              }}
            >
              {jobType}
            </Badge>
          ))}

          {remainingCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0.5 rounded-full border shadow-none bg-gray-100 text-gray-600 border-gray-300"
            >
              +{remainingCount}
            </Badge>
          )}
        </div>
      );
    },
    [getJobTypesForInquiry, inquiry]
  );

  return (
    <div
      onClick={() => openViewModal(inquiry)}
      className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-3 border border-gray-300 shadow-2xs hover:shadow-sm hover:border-emerald-100 transition-all duration-300 cursor-pointer group lg:p-4 lg:hover:shadow-md"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="bg-emerald-100/50 text-emerald-800 rounded-md p-1.5 mt-0.5 flex-shrink-0">
            <User className="h-4 w-4 lg:h-4 lg:w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="sm:hidden">
              <h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-emerald-700 transition-colors mb-1">
                {inquiry.lead_name.charAt(0).toUpperCase() +
                  inquiry.lead_name.slice(1)}
              </h4>
              <JobTypeBadges maxVisible={2} />
            </div>

            <div className="hidden sm:block">
              <div className="mb-2">
                <h4 className="font-semibold text-sm lg:text-base text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                  {inquiry.lead_name.charAt(0).toUpperCase() +
                    inquiry.lead_name.slice(1)}
                </h4>
              </div>
              <div className="flex flex-wrap gap-1">
                <JobTypeBadges maxVisible={3} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={`tel:${inquiry.mobile_no}`}
            className="flex items-center justify-center h-5 w-5 lg:h-5 lg:w-5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={`Call ${inquiry.mobile_no}`}
          >
            <Phone className="h-3 w-3 lg:h-3 lg:w-3" />
          </a>
          <Button
            variant="outline"
            size="sm"
            className="h-5 w-5 lg:h-5 lg:w-5 p-0 bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditInquiryForm(inquiry);
            }}
          >
            <Edit className="h-3 w-3 lg:h-3 lg:w-3" />
          </Button>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {(inquiry.custom_project_urgency || inquiry.custom_budget_range) && (
          <div className="flex items-center justify-between gap-2">
            {inquiry.custom_project_urgency && (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: getUrgencyColor(
                      inquiry.custom_project_urgency
                    ).bg,
                  }}
                />
                <span
                  className="text-xs font-medium truncate"
                  style={{
                    color: getUrgencyColor(inquiry.custom_project_urgency).text,
                  }}
                >
                  {getUrgencyShortLabel(inquiry.custom_project_urgency)}
                </span>
              </div>
            )}
            {inquiry.custom_budget_range && (
              <Badge
                variant="outline"
                className="px-2 py-0.5 rounded-md text-xs font-medium shadow-none ml-auto"
                style={{
                  backgroundColor:
                    getBudgetColor(inquiry.custom_budget_range).bg + "15",
                  color: getBudgetColor(inquiry.custom_budget_range).text,
                  borderColor:
                    getBudgetColor(inquiry.custom_budget_range).border + "40",
                }}
              >
                {inquiry.custom_budget_range}
              </Badge>
            )}
          </div>
        )}
        {inquiry.custom_property_area && (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 leading-tight flex-1 line-clamp-2">
              {inquiry.custom_property_area}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          {inquiry.custom_preferred_inspection_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-600">
                {format(
                  new Date(inquiry.custom_preferred_inspection_date),
                  "dd/MM/yyyy"
                )}
              </span>
            </div>
          )}

          <div className="ml-auto">
            {inquiry.status === "Open" ? (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 rounded-md text-emerald-600 border border-emerald-200 bg-emerald-50"
              >
                Assigned
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog(inquiry);
                }}
              >
                Assign
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryCard;
