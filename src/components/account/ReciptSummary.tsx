// src/components/account/ReceiptSummary.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Calendar,
  Filter,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import React, { useMemo, useState } from "react";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import ReceiptDetails from "./ReceiptDetails";

import { Link } from "react-router-dom";
import { PasswordResetLoader } from "../../common/Loader";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";

export interface Receipt {
  name: string;
  bill_number: string;
  amountaed: number;
  paid_by: string;
  paid_from: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: string;
  custom_name_of_bank?: string;
  custom_account_number?: string;
  custom_card_number?: string;
  docstatus: number; // 0 = draft, 1 = submitted
  date: string;      // yyyy-mm-dd
  custom_attachments: any[];
  custom_ifscibanswift_code?: string;
  custom_account_holder_name?: string;
}

interface Props {
  receipts: Receipt[];
  loading: boolean;
  onEdit: (receipt: Receipt) => void;
  onDelete: (receiptName: string) => Promise<void>;
  onOpenForm: () => void;
  onRefresh?: () => void;
}

const ReceiptSummary: React.FC<Props> = ({
  receipts,
  loading,
  onDelete,
  onRefresh,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "cash" | "bank" | "card" | "credit">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const isDateInRange = React.useCallback(
    (date: string) => {
      const d = new Date(date);
      const f = new Date(fromDate);
      const t = new Date(toDate);
      [d, f, t].forEach((x) => x.setHours(0, 0, 0, 0));
      return d >= f && d <= t;
    },
    [fromDate, toDate]
  );

  const handleFromDateChange = (newFromDate: string) => {
    setFromDate(newFromDate);
    if (newFromDate > toDate) {
      setToDate(newFromDate);
    }
    // Update filter state immediately
    updateFilterState(searchQuery, modeFilter, newFromDate, newFromDate > toDate ? newFromDate : toDate);
  };

  const handleToDateChange = (newToDate: string) => {
    setToDate(newToDate);
    if (newToDate < fromDate) {
      setFromDate(newToDate);
    }
    // Update filter state immediately
    updateFilterState(searchQuery, modeFilter, newToDate < fromDate ? newToDate : fromDate, newToDate);
  };

  const updateFilterState = (query: string, mode: string, from: string, to: string) => {
    const isDefault = query === "" && mode === "all" && from === todayStr && to === todayStr;
    setIsDefaultFilter(isDefault);
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search filter (always searches ALL receipts)
      const q = searchQuery.toLowerCase();
      const searchOk =
        q === "" ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.paid_by && r.paid_by.toLowerCase().includes(q)) ||
        (r.paid_from && r.paid_from.toLowerCase().includes(q)) ||
        (r.bill_number && r.bill_number.includes(q)) ||
        (r.custom_purpose_of_payment && r.custom_purpose_of_payment.toLowerCase().includes(q));

      // Payment mode filter
      const paymentMode = r.custom_mode_of_payment?.toLowerCase() || "";
      const mode = 
        paymentMode.includes("cash") ? "cash" :
        paymentMode.includes("card") ? "card" :
        paymentMode.includes("credit") ? "credit" :
        "bank";
      
      const modeOk = modeFilter === "all" || modeFilter === mode;

      // Date filter (only applies when no search is active)
      const dateOk = searchQuery.trim() !== "" ? true : (
        isDefaultFilter
          ? r.date === todayStr
          : isDateInRange(r.date)
      );

      return searchOk && modeOk && dateOk;
    });
  }, [receipts, searchQuery, modeFilter, isDefaultFilter, isDateInRange, todayStr]);

  const askDelete = (name: string) => {
    setReceiptToDelete(name);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (receiptToDelete) {
      await onDelete(receiptToDelete);
      onRefresh?.();
    }
    setDeleteModalOpen(false);
    setReceiptToDelete(null);
  };

  const openReceiptDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <PasswordResetLoader/>
  }

  return (
    <div className="px-4 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl pl-2 font-bold text-emerald-800 flex items-center gap-2">
            My Receipts
            <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              {filteredReceipts.length}
            </span>
          </h2>
        </div>
        <div className="flex gap-2">
          <Link to="/accountUser?tab=receipt-form" className="no-underline">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Receipt
            </Button>
          </Link>
        </div>
      </div>

      {/* search & filter bar */}
      <div className="bg-white mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name / paid from / bill / purpose..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateFilterState(e.target.value, modeFilter, fromDate, toDate);
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
                 {(["cash", "card", "bank", "credit"] as const).map((m) => (
          <Button
            key={m}
            variant="outline"
            size="sm"
            onClick={() => {
              const newMode = modeFilter === m ? "all" : m;
              setModeFilter(newMode);
              updateFilterState(searchQuery, newMode, fromDate, toDate);
            }}
            className={`h-8 px-3 text-xs ${
              modeFilter === m ? "border-emerald-600 text-black  " : " border-gray-200"
            }`}
          >
            {m === "card" ? "Credit Card" : m.charAt(0).toUpperCase() + m.slice(1)}
          </Button>
        ))}
        
                </div>

        {/* collapsible advanced filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={
                      {
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      } as React.CSSProperties
                    }
                  />
                  {/* Custom Calendar Icon - Clickable */}
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                    onClick={() => {
                      // Focus and click the input to trigger date picker
                      const inputs = document.querySelectorAll(
                        'input[type="date"]'
                      ) as NodeListOf<HTMLInputElement>;
                      const fromInput = inputs[0]; // First date input (From Date)
                      if (fromInput) {
                        fromInput.focus();
                        if (
                          "showPicker" in fromInput &&
                          typeof fromInput.showPicker === "function"
                        ) {
                          fromInput.showPicker();
                        }
                      }
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={
                      {
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      } as React.CSSProperties
                    }
                  />
                  {/* Custom Calendar Icon - Clickable */}
                  <div
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
                    onClick={() => {
                      // Focus and click the input to trigger date picker
                      const inputs = document.querySelectorAll(
                        'input[type="date"]'
                      ) as NodeListOf<HTMLInputElement>;
                      const toInput = inputs[1]; // Second date input (To Date)
                      if (toInput) {
                        toInput.focus();
                        if (
                          "showPicker" in toInput &&
                          typeof toInput.showPicker === "function"
                        ) {
                          toInput.showPicker();
                        }
                      }
                    }}
                  >
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-500">
                {isDefaultFilter
                  ? "Showing today's receipts"
                  : `Custom: ${formatDate(fromDate)}–${formatDate(toDate)}`}
              </div>
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
            </div>
          </div>
        )}
      </div>

      {/* list / empty-state */}
      {filteredReceipts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No receipts found
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {isDefaultFilter
              ? "You haven't received any payments today."
              : "No receipts match your current filters."}
          </p>
          <Link to="/accountUser?tab=receipt-form" className="no-underline">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Receipt
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filteredReceipts.map((r) => {
            const readOnly = r.docstatus === 1;
            return (
              <div
                key={r.name}
                className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
                onClick={() => openReceiptDetails(r)}
              >
                <div className="p-2 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(r.date)}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {r.name}
                      </p>
                    </div>
                    <span className="font-medium text-emerald-700 text-sm whitespace-nowrap">
                      {r.amountaed} AED
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-tight">
                    <strong>From:</strong> {r.paid_from || "N/A"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    <strong>Purpose:</strong>{" "}
                    {r.custom_purpose_of_payment || "N/A"}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                      {r.custom_mode_of_payment || "N/A"}
                    </span>

                    {!readOnly && (
                      <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-red-50"
                          onClick={() => askDelete(r.name)}
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
        text="Are you sure you want to delete this receipt? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* receipt details modal */}
      {selectedReceipt && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <ReceiptDetails
            receipt={selectedReceipt}
            onClose={() => setDetailModalOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
};

export default ReceiptSummary;