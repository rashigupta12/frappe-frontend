// src/components/account/PaymentSummary.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Calendar,
  Check,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

export interface Payment {
  name: string;
  bill_number: string;
  amountaed: number;
  paid_by: string;
  paid_to: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: string;
  custom_name_of_bank?: string;
  custom_card_number?: string;
  docstatus: number; // 0 = draft, 1 = submitted
  date: string;      // yyyy-mm-dd
  custom_attachments: any[];
}

interface Props {
  payments: Payment[];
  loading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentName: string) => Promise<void>;
  onOpenForm: () => void;
  onRefresh?: () => void; // Add refresh callback
}

const PaymentSummary: React.FC<Props> = ({
  payments,
  loading,
  onEdit,
  onDelete,
  onOpenForm,
  onRefresh,
}) => {

  const user = useAuth();
  const userEmail = user?.user?.username ;
  const userName = user?.user?.full_name || "User";

  console.log("User Email:", userEmail);
  console.log("User Name:", userName);

  /* -------------------------------------------------------------------- */
  /*  state for filters & search (very similar to JobCardList)            */
  /* -------------------------------------------------------------------- */
  const todayStr = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "cash" | "card" | "bank">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  /* delete-modal */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  /* -------------------------------------------------------------------- */
  /*  helpers                                                             */
  /* -------------------------------------------------------------------- */
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const isDateInRange = (date: string) => {
    const d = new Date(date);
    const f = new Date(fromDate);
    const t = new Date(toDate);
    // normalise to start-of-day
    [d, f, t].forEach((x) => x.setHours(0, 0, 0, 0));
    return d >= f && d <= t;
  };

  /* -------------------------------------------------------------------- */
  /*  filtering logic (useMemo) - Filter by logged-in user's payments    */
  /* -------------------------------------------------------------------- */
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      /* 0) Only show payments made by the logged-in user */
      const userPayment = p.paid_by === userEmail;
      if (!userPayment) return false;

      /* 1) date range (same "today only" default as JobCardList) */
      const dateOk = isDefaultFilter
        ? p.date === todayStr
        : isDateInRange(p.date);

      /* 2) search (paid_by, paid_to, bill, purpose) */
      const q = searchQuery.toLowerCase();
      const searchOk =
        q === "" ||
        p.paid_by.toLowerCase().includes(q) ||
        p.paid_to.toLowerCase().includes(q) ||
        p.bill_number.toLowerCase().includes(q) ||
        p.custom_purpose_of_payment.toLowerCase().includes(q);

      /* 3) mode filter (cash / card / bank) */
      const mode =
        p.custom_mode_of_payment?.toLowerCase().includes("cash")
          ? "cash"
          : p.custom_mode_of_payment?.toLowerCase().includes("card")
          ? "card"
          : "bank";
      const modeOk = modeFilter === "all" || modeFilter === mode;

      return dateOk && searchOk && modeOk;
    });
  }, [payments, searchQuery, fromDate, toDate, modeFilter, isDefaultFilter, userEmail]);

  /* -------------------------------------------------------------------- */
  /*  delete helpers                                                      */
  /* -------------------------------------------------------------------- */
  const askDelete = (name: string) => {
    setPaymentToDelete(name);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (paymentToDelete) {
      await onDelete(paymentToDelete);
      // Refresh data after deletion
      if (onRefresh) {
        onRefresh();
      }
    }
    setDeleteModalOpen(false);
    setPaymentToDelete(null);
  };

  /* -------------------------------------------------------------------- */
  /*  Calculate total amount for filtered payments                        */
  /* -------------------------------------------------------------------- */
  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + (payment.amountaed || 0), 0);
  }, [filteredPayments]);

  /* -------------------------------------------------------------------- */
  /*  UI                                                                  */
  /* -------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-10 px-4 py-2 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl pl-2 font-bold text-emerald-800 flex items-center gap-2">
            My Payments
            <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              {filteredPayments.length}
            </span>
            
          </h2>
          {/* Total amount display */}
          {/* {filteredPayments.length > 0 && (
            <div className="text-sm">
              <span className="text-gray-600">Total: </span>
              <span className="font-semibold text-emerald-700">{totalAmount.toFixed(2)} AED</span>
            </div>
          )} */}
        </div>
        <div className="flex gap-2">
         
          <Button
            onClick={onOpenForm}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* User info display
      <div className="mb-4 text-sm text-gray-600">
        <span>Showing payments made by: </span>
        <span className="font-medium text-gray-800">{userName} ({userEmail})</span>
      </div> */}

      {/* search & filter bar */}
      <div className="bg-white mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search paid to / bill / purpose..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDefaultFilter(
                  e.target.value === "" &&
                    modeFilter === "all" &&
                    fromDate === todayStr &&
                    toDate === todayStr
                );
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-md ${
              showFilters
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "border-gray-300"
            }`}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* quick mode filter buttons */}
        <div className="flex gap-2 mt-2">
          {(["cash", "card", "bank"] as const).map((m) => (
            <Button
              key={m}
              variant={modeFilter === m ? "default" : "outline"}
              size="sm"
              onClick={() => setModeFilter(modeFilter === m ? "all" : m)}
              className="h-8 px-3 text-xs"
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>

        {/* collapsible advanced filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    if (e.target.value > toDate) setToDate(e.target.value);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    if (e.target.value < fromDate) setFromDate(e.target.value);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isDefaultFilter
                  ? "Showing today's payments"
                  : `Custom: ${formatDate(fromDate)}–${formatDate(toDate)}`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromDate(todayStr);
                    setToDate(todayStr);
                    setModeFilter("all");
                    setSearchQuery("");
                    setIsDefaultFilter(true);
                    setShowFilters(false);
                  }}
                  className="px-3 py-1.5 text-xs"
                >
                  Reset to Today
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowFilters(false);
                    const custom =
                      searchQuery !== "" ||
                      modeFilter !== "all" ||
                      fromDate !== todayStr ||
                      toDate !== todayStr;
                    setIsDefaultFilter(!custom);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* list / empty-state */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No payments found
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {isDefaultFilter
              ? "You haven't made any payments today."
              : "No payments match your current filters."}
          </p>
          <Button
            onClick={onOpenForm}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Add Payment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filteredPayments.map((p) => {
            const readOnly = p.docstatus === 1;
            return (
              <div
                key={p.name}
                className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
              >
                <div className="p-2 space-y-1.5">
                  {/* top row */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(p.date)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {p.bill_number ? `Bill #${p.name}` : p.name}
                      </p>
                    </div>
                    <span className="font-medium text-emerald-700 text-sm whitespace-nowrap">
                      {p.amountaed} AED
                    </span>
                  </div>

                  {/* paid to (removed paid by since it's always the current user) */}
                  <p className="text-xs text-gray-600 leading-tight">
                    <strong>To:</strong> {p.paid_to || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    <strong>Purpose:</strong>{" "}
                    {p.custom_purpose_of_payment || "N/A"}
                  </p>

                  {/* bottom row : actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      {p.custom_mode_of_payment}
                    </span>

                    {!readOnly && (
                      <div className="flex gap-0.5">
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-green-50"
                          onClick={() => onEdit(p)}
                        >
                          <Edit className="h-3 w-3 text-green-700" />
                        </Button> */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-50"
                          onClick={() => askDelete(p.name)}
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
          })}
        </div>
      )}

      {/* delete confirmation modal */}
      <DeleteConfirmation
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        text="Are you sure you want to delete this payment? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};

export default PaymentSummary;