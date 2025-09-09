import { Trash2 } from "lucide-react";

import { Button } from "../../ui/button";
import type { Payment } from "../type";

interface PaymentTableProps {
  payments: Payment[];
  onDelete: (name: string) => void;
  onRowClick: (payment: Payment) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
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
                Payment Name
              </th>
               <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
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
            {payments.map((payment) => {
              const readOnly = payment.docstatus === 1;
              return (
                <tr
                  key={payment.name}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onRowClick(payment)}
                >
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {/* <Calendar className="h-3 w-3 text-gray-400" /> */}
                      {formatDate(payment.date)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {payment.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {payment.paid_to || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {payment.custom_purpose_of_payment || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-700">
                    {payment.amountaed} AED
                  </td>
                  
                  
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      {payment.custom_mode_of_payment || "N/A"}
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
                          onDelete(payment.name);
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

export default PaymentTable;