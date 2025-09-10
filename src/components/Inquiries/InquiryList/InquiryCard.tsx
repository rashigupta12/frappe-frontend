// src/components/InquiryCard.tsx

import { format } from "date-fns";
import { Calendar, Edit, MapPin, Phone, User } from "lucide-react";
import React, { useCallback } from "react";
import { type Lead } from "../../../context/LeadContext";
import {
  getBudgetColor,
  getJobTypeColor,
  getUrgencyColor,
  getUrgencyShortLabel,
} from "../../../helpers/helper";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

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
  const JobTypeBadges = useCallback(
    ({ maxVisible = 2 }: { maxVisible?: number }) => {
      const jobTypes = getJobTypesForInquiry(inquiry);

      if (jobTypes.length === 0) return null;

      const visibleJobTypes = jobTypes.slice(0, maxVisible);
      const remainingCount = jobTypes.length - maxVisible;

      return (
        <div className="flex items-center gap-1 flex-wrap">
          {visibleJobTypes.map((jobType, index) => {
            const colors = getJobTypeColor(jobType);
            return (
              <Badge
                key={index}
                variant="outline"
                className="text-xs  rounded-full border-2 font-medium"
                style={{
                  backgroundColor: `${colors.bg}1A`, // Use opacity for a lighter fill
                  color: colors.text,
                  borderColor: colors.border,
                }}
              >
                {jobType}
              </Badge>
            );
          })}
          {remainingCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 rounded-full border-2 font-medium bg-gray-100 text-gray-500 border-gray-200"
            >
              +{remainingCount}
            </Badge>
          )}
        </div>
      );
    },
    [getJobTypesForInquiry, inquiry]
  );

  const getUrgencyBadge = useCallback(() => {
    if (!inquiry.custom_project_urgency) return null;
    const colors = getUrgencyColor(inquiry.custom_project_urgency);
    const shortLabel = getUrgencyShortLabel(inquiry.custom_project_urgency);
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: colors.bg }}
        />
        <span className="text-sm font-medium" style={{ color: colors.text }}>
          {shortLabel}
        </span>
      </div>
    );
  }, [inquiry]);

  const getBudgetBadge = useCallback(() => {
    if (!inquiry.custom_budget_range) return null;
    const colors = getBudgetColor(inquiry.custom_budget_range);
    return (
      <Badge
        variant="outline"
        className="px-2.5 py-0.5 rounded-full text-xs font-medium border-2"
        style={{
          backgroundColor: `${colors.bg}1A`,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        {inquiry.custom_budget_range}
      </Badge>
    );
  }, [inquiry]);

  return (
    <div
      onClick={() => openViewModal(inquiry)}
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-md transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-emerald-300"
    >
      {/* Header - Restructured for proper alignment */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
           
          <div className="flex justify-between items-start gap-2">
            {/* Lead name and action buttons now in the same flex container */}
          
            <h3 className="flex font-semibold text-base text-gray-800 truncate group-hover:text-emerald-700 transition-colors gap-1">
                <div className="bg-emerald-100 text-emerald-600 rounded-lg p-2 flex-shrink-0">
            <User className="h-2 w-2" />
          </div>
              {inquiry.lead_name.charAt(0).toUpperCase() + inquiry.lead_name.slice(1)}
            </h3>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={`tel:${inquiry.mobile_no}`}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={`Call ${inquiry.mobile_no}`}
              >
                <Phone className="h-4 w-4" />
              </a>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditInquiryForm(inquiry);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Job types badges - positioned below the lead name and buttons */}
          <div className="mt-1">
            <JobTypeBadges maxVisible={3} />
          </div>
        </div>
      </div>
      
      {/* Details Section */}
      <div className="mt-4 space-y-3">
        {/* Urgency & Budget */}
        {(inquiry.custom_project_urgency || inquiry.custom_budget_range) && (
          <div className="flex items-center justify-between gap-2">
            {getUrgencyBadge()}
            {getBudgetBadge()}
          </div>
        )}
        
        {/* Location */}
        {inquiry.custom_property_area && (
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="text-sm leading-tight flex-1 line-clamp-2">
              {inquiry.custom_property_area}
            </span>
          </div>
        )}

        {/* Date & Status/Action */}
        <div className="flex items-center justify-between gap-2 border-t pt-3 mt-3 border-gray-100">
          {inquiry.custom_preferred_inspection_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {format(new Date(inquiry.custom_preferred_inspection_date), "dd/MM/yyyy")}
              </span>
            </div>
          )}

          <div className="ml-auto">
            {inquiry.status === "Open" ? (
              <Badge
                variant="outline"
                className="text-xs px-3 py-1 rounded-full text-emerald-700 border-emerald-300 bg-emerald-100 font-semibold"
              >
                Assigned
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-none shadow-sm font-semibold"
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