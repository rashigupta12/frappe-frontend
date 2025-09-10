// components/JobCard/components/JobCardGrid.tsx
import { Calendar, Edit, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "../../ui/button";
import type { JobCard } from "../../../context/JobCardContext";


interface Props {
  jobCards: JobCard[];
  onEdit: (card: JobCard, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onViewDetails: (card: JobCard) => void;
}

const JobCardGrid: React.FC<Props> = ({ jobCards, onEdit, onDelete, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getJobCardPurpose = (card: JobCard) => {
    const hasPressed = card.pressing_charges && card.pressing_charges.length > 0;
    const hasMaterial = card.material_sold && card.material_sold.length > 0;

    if (hasPressed && hasMaterial) return "both";
    if (hasPressed) return "pressing";
    if (hasMaterial) return "material";
    return "none";
  };

  const getPurposeDisplay = (purpose: string) => {
    switch (purpose) {
      case "pressing": return "P";
      case "material": return "M";
      case "both": return "P M";
      default: return "None";
    }
  };

  const calculateTotalAmount = (card: JobCard) => {
    let total = 0;

    if (card.pressing_charges && card.pressing_charges.length > 0) {
      total += card.pressing_charges.reduce(
        (sum, charge) => sum + parseFloat(charge.amount?.toString() || "0"),
        0
      );
    }

    if (card.material_sold && card.material_sold.length > 0) {
      total += card.material_sold.reduce(
        (sum, material) => sum + parseFloat(material.amount?.toString() || "0"),
        0
      );
    }

    return total;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
      {jobCards.map((card) => {
        const purpose = getJobCardPurpose(card);
        const totalAmount = calculateTotalAmount(card);
        const purposeDisplay = getPurposeDisplay(purpose);
        const isReadOnly = card.docstatus === 1;

        return (
          <div
            key={card.name}
            onClick={() => onViewDetails(card)}
            className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
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
                  <p className="font-semibold text-gray-900 text-sm truncate capitalize">
                    {card.party_name || "No Customer Name"}
                  </p>
                </div>
                {totalAmount > 0 && (
                  <span className="font-medium text-emerald-700 text-sm whitespace-nowrap ml-2">
                    {totalAmount} AED
                  </span>
                )}
              </div>

              {/* Address */}
              <p className="text-xs text-gray-600 leading-tight line-clamp-2 capitalize">
                {card.area || "No Area"}
              </p>

              {/* Bottom Row - Purpose and Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1 flex-wrap">
                  {purposeDisplay.split(" ").map((p) => (
                    <span
                      key={p}
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        p === "P"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : p === "M"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                  {card.docstatus === 1 && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                      Submitted
                    </span>
                  )}
                </div>
                {!isReadOnly && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(card, e);
                      }}
                      className="h-6 w-6 p-0 hover:bg-green-50"
                    >
                      <Edit className="h-3 w-3 text-green-700" />
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobCardGrid;