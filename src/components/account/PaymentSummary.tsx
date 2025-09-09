import React, { useMemo, useState } from "react";

import DeleteConfirmation from "../common/DeleteComfirmation";
import PaymentDetails from "./PaymentDetails";
import { Dialog } from "../ui/dialog";
import { Loader } from "../common/Loader";
import type { Payment } from "./type";
import PageHeader from "./Summary/PageHeader";
import SearchAndFilter from "./Summary/SearchAndFilter";
import EmptyState from "./Summary/EmptyState";
import PaymentTable from "./Summary/PaymentTable";
import PaymentCard from "./Summary/PaymentCard";


interface Props {
  payments: Payment[];
  loading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentName: string) => Promise<void>;
  onOpenForm: () => void;
  onRefresh?: () => void;
}

const PaymentSummary: React.FC<Props> = ({
  payments,
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
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filter and date logic
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

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search filter (always searches ALL payments)
      const q = searchQuery.toLowerCase();
      const searchOk =
        q === "" ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.paid_by && p.paid_by.toLowerCase().includes(q)) ||
        (p.paid_to && p.paid_to.toLowerCase().includes(q)) ||
        (p.bill_number && p.bill_number.includes(q)) ||
        (p.custom_purpose_of_payment &&
          p.custom_purpose_of_payment.toLowerCase().includes(q));

      // Payment mode filter
      const paymentMode = p.custom_mode_of_payment?.toLowerCase() || "";
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
          ? p.date === todayStr
          : isDateInRange(p.date);

      return searchOk && modeOk && dateOk;
    });
  }, [
    payments,
    searchQuery,
    modeFilter,
    isDefaultFilter,
    isDateInRange,
    todayStr,
  ]);

  const askDelete = (name: string) => {
    setPaymentToDelete(name);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      await onDelete(paymentToDelete);
      onRefresh?.();
    }
    setDeleteModalOpen(false);
    setPaymentToDelete(null);
  };

  const openPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <Loader />;
  }

  const filterStatusText = isDefaultFilter
    ? "Showing today's payments"
    : `Custom: ${formatDate(fromDate)}–${formatDate(toDate)}`;

  return (
    <div className=" max-w-7xl mx-auto ">
      <div className="bg-white rounded-md  mb-3">
        <PageHeader
        title="My Payments"
        count={filteredPayments.length}
        addButtonText="Add Payment"
        addButtonLink="/accountUser?tab=payment-form"
      />
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search name / paid to / bill / purpose..."
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
      

      

      {filteredPayments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description={
            isDefaultFilter
              ? "You haven't made any payments today."
              : "No payments match your current filters."
          }
          addButtonText="Add Payment"
          addButtonLink="/accountUser?tab=payment-form"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <PaymentTable
              payments={filteredPayments}
              onDelete={askDelete}
              onRowClick={openPaymentDetails}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPayments.map((payment) => (
                <PaymentCard
                  key={payment.name}
                  payment={payment}
                  onDelete={askDelete}
                  onClick={openPaymentDetails}
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
        text="Are you sure you want to delete this payment? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {/* payment details modal */}
      {selectedPayment && (
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <PaymentDetails
            payment={selectedPayment}
            onClose={() => setDetailModalOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
};

export default PaymentSummary;