// components/JobCard/components/JobCardTable.tsx
import { Calendar, Edit, Trash2, Eye } from "lucide-react";
import React from "react";
import { Button } from "../../ui/button";
import type { JobCard } from "../../../context/JobCardContext";
interface Props {
  jobCards: JobCard[];
  onEdit: (card: JobCard, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onViewDetails: (card: JobCard) => void;
}

const JobCardTable: React.FC<Props> = ({ jobCards, onEdit, onDelete, onViewDetails }) => {
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Dates</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Customer</th>
              
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Area</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Amount</th>
              {/* <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Status</th> */}
              <th className="text-center py-3 px-4 font-medium text-gray-900 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobCards.map((card ,index) => {
              const purpose = getJobCardPurpose(card);
              const totalAmount = calculateTotalAmount(card);
              const purposeDisplay = getPurposeDisplay(purpose);
              const isReadOnly = card.docstatus === 1;

              return (
                <tr
                  key={card.name ||index}
                  className= {`hover:bg-gray-100 transition-colors cursor-pointer  ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
                  onClick={() => onViewDetails(card)}
                >

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDate(card.start_date)} - {formatDate(card.finish_date)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {card.party_name || "No Customer Name"}
                      </p>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 capitalize">
                      {card.area || "No Area"}
                    </p>
                  </td>
                  <td className="py-3 px-4">
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
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {totalAmount > 0 && (
                      <span className="font-medium text-emerald-700">
                        {totalAmount} AED
                      </span>
                    )}
                  </td>
                  {/* <td className="py-3 px-4">
                    {card.docstatus === 1 && (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                        Submitted
                      </span>
                    )}
                  </td> */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(card);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                      {!isReadOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(card, e);
                            }}
                            className="h-8 w-8 p-0 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4 text-green-700" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(card.name, e);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobCardTable;
