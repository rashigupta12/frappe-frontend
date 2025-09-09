import { Calendar, Trash2 } from "lucide-react";

import { Button } from "../../ui/button";
import type { Payment } from "../type";

interface PaymentCardProps {
  payment: Payment;
  onDelete: (name: string) => void;
  onClick: (payment: Payment) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onDelete,
  onClick,
}) => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const readOnly = payment.docstatus === 1;

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
      onClick={() => onClick(payment)}
    >
      <div className="p-2 space-y-1.5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(payment.date)}</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {payment.name}
            </p>
          </div>
          <span className="font-medium text-emerald-700 text-sm whitespace-nowrap">
            {payment.amountaed} AED
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-tight">
          <strong>To:</strong> {payment.paid_to || "N/A"}
        </p>
        <p className="text-xs text-gray-600 truncate">
          <strong>Purpose:</strong> {payment.custom_purpose_of_payment || "N/A"}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
            {payment.custom_mode_of_payment || "N/A"}
          </span>

          {!readOnly && (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-red-50"
                onClick={() => onDelete(payment.name)}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          )}
          {readOnly && (
            <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
              Submitted
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;