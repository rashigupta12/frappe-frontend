import {
  Calendar,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import DeleteConfirmation from "../../common/DeleteComfirmation";
import { PasswordResetLoader } from "../../common/Loader";
import { useJobCards, type JobCard } from "../../context/JobCardContext";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import JobCardDetails from "./JobCardDetails";

interface Props {
  onEdit: (jobCard: JobCard) => void;
  onOpenForm: () => void;
}

const JobCardList: React.FC<Props> = ({ onEdit, onOpenForm }) => {
  const { jobCards, loading, fetchJobCards, deleteJobCard } = useJobCards();
  const [selectedCard, setSelectedCard] = useState<JobCard | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states - Initialize with today's date
  const todayString = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayString);
  const [toDate, setToDate] = useState(todayString);
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<
    "all" | "pressing" | "material" | "both" | "submitted"
  >("all");
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);


  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);
  console.log("Job Cards:", jobCards);

  const handleEdit = (card: JobCard, e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  // Helper function to determine job card purpose
  const getJobCardPurpose = (card: JobCard) => {
    const hasPressed =
      card.pressing_charges && card.pressing_charges.length > 0;
    const hasMaterial = card.material_sold && card.material_sold.length > 0;

    if (hasPressed && hasMaterial) return "both";
    if (hasPressed) return "pressing";
    if (hasMaterial) return "material";
    return "none";
  };

  // Helper function to calculate total amount
  const calculateTotalAmount = (card: JobCard) => {
    let total = 0;

    // Calculate pressing charges total
    if (card.pressing_charges && card.pressing_charges.length > 0) {
      total += card.pressing_charges.reduce(
        (sum, charge) => sum + parseFloat(charge.amount?.toString() || "0"),
        0
      );
    }

    // Calculate material sold total
    if (card.material_sold && card.material_sold.length > 0) {
      total += card.material_sold.reduce(
        (sum, material) => sum + parseFloat(material.amount?.toString() || "0"),
        0
      );
    }

    return total;
  };

//   const normalizeDate = (dateString: string) => {
//   if (!dateString) return null;
//   const date = new Date(dateString);
//   date.setHours(0, 0, 0, 0);
//   return date;
// }
//   // Helper function to check if date is within range
//   const isDateInRange = (
//     cardStartDate: Date,
//     cardFinishDate: Date,
//     fromDate: Date,
//     toDate: Date
//   ) => {
//     // Set all dates to start of day for accurate comparison
//     const normalizeDate = (date: Date) => {
//       const normalized = new Date(date);
//       normalized.setHours(0, 0, 0, 0);
//       return normalized;
//     };

//     const normalizedCardStart = normalizeDate(cardStartDate);
//     const normalizedCardFinish = normalizeDate(cardFinishDate);
//     const normalizedFrom = normalizeDate(fromDate);
//     const normalizedTo = normalizeDate(toDate);

//     // Check if card dates fall completely within the selected date range
//     return (
//       normalizedCardStart >= normalizedFrom &&
//       normalizedCardFinish <= normalizedTo
//     );
//   };

  // Filter job cards based on all criteria
const filteredJobCards = useMemo(() => {
  // Helper function to normalize dates (ignore time component)
  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Helper function to check if date is valid
  const isValidDate = (date: Date) => !isNaN(date.getTime());

  return jobCards.filter((card) => {
    // Parse and validate dates
    const cardStartDate = new Date(card.start_date || "");
    const cardFinishDate = card.finish_date ? new Date(card.finish_date) : cardStartDate; // Fallback to start_date if empty
    const filterFromDate = new Date(fromDate);
    const filterToDate = new Date(toDate);

    // Skip if invalid start date
    if (!isValidDate(cardStartDate)) return false;

    // Date filter logic
    let isInDateRange = false;

    if (isDefaultFilter) {
      // Default behavior: show only cards that start today
      const today = normalizeDate(new Date());
      const cardStart = normalizeDate(cardStartDate);
      isInDateRange = cardStart.getTime() === today.getTime();
    } else {
      // Custom date range: show cards that overlap with the selected date range
      const normalizedFrom = normalizeDate(filterFromDate);
      const normalizedTo = normalizeDate(filterToDate);
      const normalizedCardStart = normalizeDate(cardStartDate);
      const normalizedCardFinish = normalizeDate(cardFinishDate);

      isInDateRange = 
        normalizedCardStart <= normalizedTo && 
        normalizedCardFinish >= normalizedFrom;
    }

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      card.party_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.pressing_charges || []).some((charge) =>
        charge.work_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Purpose filter
    const cardPurpose = getJobCardPurpose(card);
    const matchesPurpose =
      purposeFilter === "all" ||
      (purposeFilter === "both" && cardPurpose === "both") ||
      (purposeFilter === "pressing" && cardPurpose === "pressing") ||
      (purposeFilter === "material" && cardPurpose === "material") ||
      (purposeFilter === "submitted" && card.docstatus === 1);

    // Debug logging (remove in production)
    console.log('Card:', card.name, {
      startDate: card.start_date,
      finishDate: card.finish_date,
      passesDate: isInDateRange,
      passesSearch: matchesSearch,
      passesPurpose: matchesPurpose
    });

    return isInDateRange && matchesSearch && matchesPurpose;
  });
}, [jobCards, fromDate, toDate, searchQuery, purposeFilter, isDefaultFilter]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const getPurposeDisplay = (purpose: string) => {
    switch (purpose) {
      case "pressing":
        return "P";
      case "material":
        return "M";
      case "both":
        return "P M";
      default:
        return "None";
    }
  };

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
    setPurposeFilter("all");
    setSearchQuery("");
    setIsDefaultFilter(true);
  };

  // Handle date changes - Apply filter immediately
  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    // If from date is greater than to date, adjust to date
    if (value > toDate) {
      setToDate(value);
    }
    // Mark as custom filter
    const today = new Date().toISOString().split("T")[0];
    setIsDefaultFilter(value === today && toDate === today && searchQuery === "" && purposeFilter === "all");
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    // If to date is less than from date, adjust from date
    if (value < fromDate) {
      setFromDate(value);
    }
    // Mark as custom filter
    const today = new Date().toISOString().split("T")[0];
    setIsDefaultFilter(fromDate === today && value === today && searchQuery === "" && purposeFilter === "all");
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;

    try {
      await deleteJobCard(cardToDelete);
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
    return <PasswordResetLoader/>
  }

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Job Cards
          <span className="bg-slate-100 text-slate-700 text-sm font-medium px-2 py-0.5 rounded-full border border-slate-300">
            {filteredJobCards.length}
          </span>
          {isDefaultFilter && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Today's Jobs
            </span>
          )}
        </h2>
        <Button
          onClick={onOpenForm}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Compact Search and Filter Bar */}
      <div className="bg-white mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer name or work type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Mark as custom filter if search is not empty
                setIsDefaultFilter(
                  e.target.value === "" &&
                    purposeFilter === "all" &&
                    fromDate === todayString &&
                    toDate === todayString
                );
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

        {/* Quick Filter Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={purposeFilter === 'pressing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPurposeFilter(purposeFilter === 'pressing' ? 'all' : 'pressing')}
            className="h-8 px-3 text-xs bg-amber-50 text-amber-700 *:hover:bg-amber-100 *:hover:text-amber-800"
          >
            P
          </Button>
          <Button
            variant={purposeFilter === 'material' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPurposeFilter(purposeFilter === 'material' ? 'all' : 'material')}
            className="h-8 px-3 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
          >
            M
          </Button>
          <Button
            variant={purposeFilter === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPurposeFilter(purposeFilter === 'both' ? 'all' : 'both')}
            className="h-8 px-3 text-xs bg-indigo-50 text-indigo-700  hover:bg-indigo-100 hover:text-indigo-800"
          >
            P M
            
          </Button>
          <Button
            variant={purposeFilter === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPurposeFilter(purposeFilter === 'submitted' ? 'all' : 'submitted')}
            className="h-8 px-3 text-xs bg-emerald-50 text-emerald-700 *:hover:bg-emerald-100 *:hover:text-emerald-800"
          >
            Paid
          </Button>
        </div>

        {/* Active filters indicator */}
        {(purposeFilter !== 'all' || !isDefaultFilter) && (
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <span>Filters:</span>
            {!isDefaultFilter && (
              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                {formatDate(fromDate)} to {formatDate(toDate)}
              </span>
            )}
            {purposeFilter === 'pressing' && (
              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">P</span>
            )}
            {purposeFilter === 'material' && (
              <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">M</span>
            )}
            {purposeFilter === 'both' && (
              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">P M</span>
            )}
            {purposeFilter === 'submitted' && (
              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Paid</span>
            )}
          </div>
        )}

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Date Range */}
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
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {isDefaultFilter
                  ? "Showing today's job cards"
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
          <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            No job cards found
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {isDefaultFilter
              ? "No job cards scheduled for today. Try adjusting the date range or create a new job card."
              : "No job cards match your current filters. Try adjusting your search criteria."}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Job Card
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {filteredJobCards.map((card) => {
            const purpose = getJobCardPurpose(card);
            const totalAmount = calculateTotalAmount(card);
            const purposeDisplay = getPurposeDisplay(purpose);
            const isReadOnly = card.docstatus === 1;


            return (
              <div
                key={card.name}
                onClick={() => setSelectedCard(card)}
                className="relative bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
              >
                <div className="p-2 space-y-1.5">
                  {/* Top Row - Compact Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(card.start_date)} -{" "}
                          {formatDate(card.finish_date)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm truncate capitalize">
                        {card.party_name || "No Customer Name"}
                      </p>
                    </div>
                    {totalAmount > 0 && (
                      <span className="font-medium text-emerald-700 text-sm whitespace-nowrap">
                        {totalAmount} AED
                      </span>
                    )}
                  </div>

                  {/* Address - More compact */}
                  <p className="text-xs text-gray-600 leading-tight line-clamp-2 capitalize">
                    {[ card.area]
                      .filter(Boolean)
                      .join(", ") || "No Address"}
                  </p>

                  {/* Bottom Row - Purpose and Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 flex-wrap">
                      {purposeDisplay.split(" ").map((p) => (
                        <span
                          key={p}
                          className={`text-[0.65rem] font-medium px-1.5 py-0.5 rounded ${
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
                        <span className="text-[0.65rem] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                          Submitted
                        </span>
                      )}
                    </div>
                    {!isReadOnly && (
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(card, e)}
                          className="h-5 w-5 p-0 hover:bg-green-50"
                        >
                          <Edit className="h-3 w-3 text-green-700" />
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
          <JobCardDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>

      <DeleteConfirmation
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        text="Are you sure you want to delete this job card? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default JobCardList;