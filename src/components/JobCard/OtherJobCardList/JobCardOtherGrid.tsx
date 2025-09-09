// components/JobCardOther/components/JobCardOtherGrid.tsx
import { Calendar, Edit, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "../../ui/button";
import type { JobCardOther } from "../../../context/JobCardOtherContext";


interface Props {
  jobCards: JobCardOther[];
  onEdit: (card: JobCardOther, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onViewDetails: (card: JobCardOther) => void;
}

const JobCardOtherGrid: React.FC<Props> = ({ jobCards, onEdit, onDelete, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const calculateTotalAmount = (card: JobCardOther) => {
    if (!card.services || card.services.length === 0) return 0;
    return card.services.reduce(
      (sum, service) => sum + parseFloat(service.price?.toString() || "0"),
      0
    );
  };

  const getServicesSummary = (card: JobCardOther) => {
    if (!card.services || card.services.length === 0) return "No services";
    if (card.services.length === 1) return card.services[0].work_type || "Service";
    return `${card.services.length} Services`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {jobCards.map((card) => {
        const totalAmount = calculateTotalAmount(card);
        const servicesSummary = getServicesSummary(card);
        const isReadOnly = card.docstatus === 1;

        return (
          <div
            key={card.name}
            onClick={() => onViewDetails(card)}
            className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden capitalize"
          >
            <div className="p-3 space-y-2">
              {/* Top Row - Header */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(card.start_date)} - {formatDate(card.finish_date)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {card.party_name || "No Customer Name"}
                  </p>
                </div>
                {totalAmount > 0 && (
                  <span className="font-medium text-gray-700 text-sm whitespace-nowrap ml-2">
                    {totalAmount} AED
                  </span>
                )}
              </div>

              {/* Address */}
              <p className="text-xs text-gray-600 leading-tight line-clamp-2">
                {card.area || "No Area"}
              </p>

              {/* Services and Actions */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-700 font-medium truncate">
                    {servicesSummary}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  {!isReadOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(card, e);
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <Edit className="h-3 w-3 text-gray-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(card.name, e);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  )}
                  {isReadOnly && (
                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobCardOtherGrid;
