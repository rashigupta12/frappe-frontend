import {
  Calendar,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { PasswordResetLoader } from "../../common/Loader";
import {
  useJobCardsOther,
  type JobCardOther,
} from "../../context/JobCardOtherContext";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import JobCardOtherDetails from "./JobCardOtherDetails";

interface Props {
  onEdit: (jobCard: JobCardOther) => void;
  onOpenForm: () => void;
}

const JobCardOtherList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCardsOther, loading, fetchJobCardsOther, deleteJobCardOther } =
    useJobCardsOther();
  const [selectedCard, setSelectedCard] = useState<JobCardOther | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const todayString = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayString);
  const [toDate, setToDate] = useState(todayString);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "submitted" | "draft"
  >("all");
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchJobCardsOther();
  }, [fetchJobCardsOther]);

  const handleEdit = (card: JobCardOther, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  const calculateTotalAmount = (card: JobCardOther) => {
    if (!card.services || card.services.length === 0) return 0;
    return card.services.reduce(
      (sum, service) => sum + parseFloat(service.price?.toString() || "0"),
      0
    );
  };

  const getUniqueServiceTypes = useMemo(() => {
    const types = new Set<string>();
    jobCardsOther.forEach((card) => {
      if (card.services && card.services.length > 0) {
        card.services.forEach((service) => {
          if (service.work_type) {
            types.add(service.work_type);
          }
        });
      }
    });
    return Array.from(types).sort();
  }, [jobCardsOther]);

  const isDateInRange = (
    cardStartDate: Date,
    cardFinishDate: Date,
    fromDate: Date,
    toDate: Date
  ) => {
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedCardStart = normalizeDate(cardStartDate);
    const normalizedCardFinish = normalizeDate(cardFinishDate);
    const normalizedFrom = normalizeDate(fromDate);
    const normalizedTo = normalizeDate(toDate);

    return (
      normalizedCardStart <= normalizedTo &&
      normalizedCardFinish >= normalizedFrom
    );
  };

  const filteredJobCards = useMemo(() => {
    return jobCardsOther.filter((card) => {
      const cardStartDate = new Date(card.start_date || "");
      const cardFinishDate = new Date(card.finish_date || "");
      const filterFromDate = new Date(fromDate);
      const filterToDate = new Date(toDate);

      if (isNaN(cardStartDate.getTime()) || isNaN(cardFinishDate.getTime())) {
        return false;
      }

      let isInDateRange = false;
      if (isDefaultFilter) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cardStart = new Date(cardStartDate);
        cardStart.setHours(0, 0, 0, 0);
        isInDateRange = cardStart.getTime() === today.getTime();
      } else {
        isInDateRange = isDateInRange(
          cardStartDate,
          cardFinishDate,
          filterFromDate,
          filterToDate
        );
      }

      const matchesSearch =
        searchQuery === "" ||
        card.party_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.services || []).some(
          (service) =>
            service.work_type
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            service.work_description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        );

      const matchesServiceType =
        serviceTypeFilter === "all" ||
        (card.services || []).some(
          (service) => service.work_type === serviceTypeFilter
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "submitted" && card.docstatus === 1) ||
        (statusFilter === "draft" && card.docstatus !== 1);

      return (
        isInDateRange && matchesSearch && matchesServiceType && matchesStatus
      );
    });
  }, [
    jobCardsOther,
    fromDate,
    toDate,
    searchQuery,
    serviceTypeFilter,
    statusFilter,
    isDefaultFilter,
  ]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getServicesSummary = (card: JobCardOther) => {
    if (!card.services || card.services.length === 0) return "No services";
    if (card.services.length === 1)
      return card.services[0].work_type || "Service";
    return `${card.services.length} Services`;
  };

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
    setServiceTypeFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setIsDefaultFilter(true);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    if (value > toDate) setToDate(value);
    setIsDefaultFilter(false);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    if (value < fromDate) setFromDate(value);
    setIsDefaultFilter(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    try {
      await deleteJobCardOther(cardToDelete);
      setDeleteModalOpen(false);
      setCardToDelete(null);
    } catch (err) {
      console.error(err);
      setDeleteModalOpen(false);
      setCardToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setCardToDelete(null);
  };

  if (loading) {
    return <PasswordResetLoader />;
  }

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-cyan-800 flex items-center gap-2">
          Job Cards
          <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2 py-0.5 rounded-full border border-gray-200">
            {filteredJobCards.length}
          </span>
          {isDefaultFilter && (
            <span className="text-xs bg-purple-50 text-cyan-700 px-2 py-0.5 rounded-full border border-purple-200">
              Today's Jobs
            </span>
          )}
        </h2>
        <Button
          onClick={onOpenForm}
          size="sm"
          className="bg-cyan-800 hover:bg-cyan-700 text-white rounded-md px-3 py-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer name, service type or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDefaultFilter(
                  e.target.value === "" &&
                    serviceTypeFilter === "all" &&
                    statusFilter === "all" &&
                    fromDate === todayString &&
                    toDate === todayString
                );
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-md ${
              showFilters
                ? "bg-gray-100 border-gray-300 text-gray-700"
                : "border-gray-300"
            }`}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={statusFilter === "submitted" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setStatusFilter(
                statusFilter === "submitted" ? "all" : "submitted"
              )
            }
            className="h-8 px-3 text-xs bg-green-50 hover:bg-green-100 text-green-700 data-[state=on]:bg-green-100"
          >
            Paid
          </Button>
        </div>

        {/* Active Filters Indicator */}
        {(serviceTypeFilter !== "all" ||
          statusFilter !== "all" ||
          !isDefaultFilter) && (
          <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
            <span>Filters:</span>
            {!isDefaultFilter && (
              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                {formatDate(fromDate)} to {formatDate(toDate)}
              </span>
            )}
            {serviceTypeFilter !== "all" && (
              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                {serviceTypeFilter}
              </span>
            )}
            {statusFilter === "submitted" && (
              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                Submitted
              </span>
            )}
            {statusFilter === "draft" && (
              <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                Draft
              </span>
            )}
          </div>
        )}

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      style={{
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                    />
                    {/* Custom Calendar Icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <Calendar className="h-4 w-4" />
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      style={{
                        // Hide browser default icons
                        WebkitAppearance: "none",
                        MozAppearance: "textfield",
                      }}
                    />
                    {/* Custom Calendar Icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Service Type
                </label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => {
                    setServiceTypeFilter(e.target.value);
                    setIsDefaultFilter(false);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="all">All Services</option>
                  {getUniqueServiceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isDefaultFilter
                  ? "Showing today's job cards by default"
                  : `Custom filter: ${formatDate(fromDate)} to ${formatDate(
                      toDate
                    )}`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-xs"
                >
                  Reset to Today
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Cards Grid */}
      {filteredJobCards.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No service job cards found
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {isDefaultFilter
              ? "No service job cards scheduled for today. Try adjusting the date range or create a new job card."
              : "No service job cards match your current filters. Try adjusting your search criteria."}
          </p>
          <div className="flex gap-2 justify-center">
            {!isDefaultFilter && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Show Today's Jobs
              </Button>
            )}
            <Button
              onClick={onOpenForm}
              size="sm"
              className="bg-cyan-800 hover:bg-cyan-700 text-white rounded-md px-3 py-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Service Job Card
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filteredJobCards.map((card) => {
            const totalAmount = calculateTotalAmount(card);
            const servicesSummary = getServicesSummary(card);
            const isReadonly = card.docstatus === 1;

            return (
              <div
                key={card.name}
                onClick={() => setSelectedCard(card)}
                className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden capitalize"
              >
                <div className="p-2 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(card.start_date)} -{" "}
                          {formatDate(card.finish_date)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {card.party_name || "No Customer Name"}
                      </p>
                    </div>
                    {totalAmount > 0 && (
                      <span className="font-medium text-gray-700 text-sm whitespace-nowrap">
                        {totalAmount} AED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-tight line-clamp-2">
                    {[ card.area]
                      .filter(Boolean)
                      .join(", ") || "No Address"}
                  </p>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-700 font-medium truncate">
                        {servicesSummary}
                      </span>
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      {!isReadonly && (
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEdit(card, e)}
                            className="h-5 w-5 p-0 hover:bg-gray-100"
                          >
                            <Edit className="h-3 w-3 text-gray-700" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteClick(card.name, e)}
                            className="h-5 w-5 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      )}
                      {isReadonly && (
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
      )}

      {/* Details Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        {selectedCard && (
          <JobCardOtherDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>

      <DeleteConfirmation
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        text="Are you sure you want to delete this service job card? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default JobCardOtherList;
