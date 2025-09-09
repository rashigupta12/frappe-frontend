import React, { useMemo, useState } from "react";

import DeleteConfirmation from "../common/DeleteComfirmation";
import ReceiptDetails from "./ReceiptDetails";
import { Dialog } from "../ui/dialog";
import { Loader } from "../common/Loader";

import type { Receipt } from "./type";
import PageHeader from "./Summary/PageHeader";
import SearchAndFilter from "./Summary/SearchAndFilter";
import EmptyState from "./Summary/EmptyState";
import ReceiptTable from "./Summary/ReceiptTable";
import ReceiptCard from "./Summary/ReceiptCard";

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
  const [modeFilter, setModeFilter] = useState<
    "all" | "cash" | "bank" | "card" | "credit"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Filter and date logic (same as before)
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
    updateFilterState(
      searchQuery,
      modeFilter,
      newFromDate,
      newFromDate > toDate ? newFromDate : toDate
    );
  };

  const handleToDateChange = (newToDate: string) => {
    setToDate(newToDate);
    if (newToDate < fromDate) {
      setFromDate(newToDate);
    }
    updateFilterState(
      searchQuery,
      modeFilter,
      newToDate < fromDate ? newToDate : fromDate,
      newToDate
    );
  };

  const updateFilterState = (
    query: string,
    mode: string,
    from: string,
    to: string
  ) => {
    const isDefault =
      query === "" && mode === "all" && from === todayStr && to === todayStr;
    setIsDefaultFilter(isDefault);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilterState(query, modeFilter, fromDate, toDate);
  };

  const handleModeFilterChange = (mode: "all" | "cash" | "card" | "bank" | "credit") => {
    setModeFilter(mode);
    updateFilterState(searchQuery, mode, fromDate, toDate);
  };

  const handleResetFilters = () => {
    setFromDate(todayStr);
    setToDate(todayStr);
    setModeFilter("all");
    setSearchQuery("");
    setIsDefaultFilter(true);
    setShowFilters(false);
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
        (r.custom_purpose_of_payment &&
          r.custom_purpose_of_payment.toLowerCase().includes(q));

      // Payment mode filter
      const paymentMode = r.custom_mode_of_payment?.toLowerCase() || "";
      const mode = paymentMode.includes("cash")
        ? "cash"
        : paymentMode.includes("card")
        ? "card"
        : paymentMode.includes("credit")
        ? "credit"
        : "bank";

      const modeOk = modeFilter === "all" || modeFilter === mode;

      // Date filter (only applies when no search is active)
      const dateOk =
        searchQuery.trim() !== ""
          ? true
          : isDefaultFilter
          ? r.date === todayStr
          : isDateInRange(r.date);

      return searchOk && modeOk && dateOk;
    });
  }, [
    receipts,
    searchQuery,
    modeFilter,
    isDefaultFilter,
    isDateInRange,
    todayStr,
  ]);

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
    return <Loader />;
  }

  const filterStatusText = isDefaultFilter
    ? "Showing today's receipts"
    : `Custom: ${formatDate(fromDate)}–${formatDate(toDate)}`;

  return (
    <div className="max-w-7xl mx-auto">

      <div className="bg-white rounded-md  mb-3">
      <PageHeader
        title="My Receipts"
        count={filteredReceipts.length}
        addButtonText="Add Receipt"
        addButtonLink="/accountUser?tab=receipt-form"
      />

      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search name / paid from / bill / purpose..."
        modeFilter={modeFilter}
        onModeFilterChange={handleModeFilterChange}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        isDefaultFilter={isDefaultFilter}
        onResetFilters={handleResetFilters}
        filterStatusText={filterStatusText}
      />
      </div>

      {filteredReceipts.length === 0 ? (
        <EmptyState
          title="No receipts found"
          description={
            isDefaultFilter
              ? "You haven't received any payments today."
              : "No receipts match your current filters."
          }
          addButtonText="Add Receipt"
          addButtonLink="/accountUser?tab=receipt-form"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <ReceiptTable
              receipts={filteredReceipts}
              onDelete={askDelete}
              onRowClick={openReceiptDetails}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredReceipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.name}
                  receipt={receipt}
                  onDelete={askDelete}
                  onClick={openReceiptDetails}
                />
              ))}
            </div>
          </div>
        </>
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
