import { Trash2 } from "lucide-react";

import { Button } from "../../ui/button";
import type { Receipt } from "../type";

interface ReceiptTableProps {
  receipts: Receipt[];
  onDelete: (name: string) => void;
  onRowClick: (receipt: Receipt) => void;
}

const ReceiptTable: React.FC<ReceiptTableProps> = ({
  receipts,
  onDelete,
  onRowClick,
}) => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Mode
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {receipts.map((receipt) => {
              const readOnly = receipt.docstatus === 1;
              return (
                <tr
                  key={receipt.name}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick(receipt)}
                >
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {/* <Calendar className="h-3 w-3 text-gray-400" /> */}
                      {formatDate(receipt.date)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {receipt.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {receipt.paid_from || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {receipt.custom_purpose_of_payment || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-700">
                    {receipt.amountaed} AED
                  </td>
                  
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {receipt.custom_mode_of_payment || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {readOnly ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(receipt.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
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

export default ReceiptTable;