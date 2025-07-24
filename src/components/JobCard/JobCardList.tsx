// /* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Calendar,
  Check,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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

  // Filter states
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<
    "all" | "pressing" | "material" | "both"
  >("all");

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job card?"))
      return;
    try {
      await deleteJobCard(id);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Filter job cards based on all criteria
  const filteredJobCards = useMemo(() => {
    // Check if any filters are active (other than default today filter)
    const isFilterActive =
      searchQuery !== "" ||
      purposeFilter !== "all" ||
      fromDate !== new Date().toISOString().split("T")[0] ||
      toDate !== new Date().toISOString().split("T")[0];

    return jobCards.filter((card) => {
      // Date filter logic
      const cardStartDate = new Date(card.start_date || "");
      const cardEndDate = new Date(card.finish_date || "");
      const filterFromDate = new Date(fromDate);
      const filterToDate = new Date(toDate);

      // Reset time components
      cardStartDate.setHours(0, 0, 0, 0);
      cardEndDate.setHours(0, 0, 0, 0);
      filterFromDate.setHours(0, 0, 0, 0);
      filterToDate.setHours(0, 0, 0, 0);

      // Default behavior: show only cards starting today when no filters are active
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isInDateRange = isFilterActive
        ? // When filters are active, use the selected date range
          cardStartDate <= filterToDate && cardEndDate >= filterFromDate
        : // Default behavior: only show cards starting today
          cardStartDate.getTime() === today.getTime();

      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        card.party_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.pressing_charges || []).some((charge) =>
          charge.work_type?.toLowerCase().includes(searchQuery.toLowerCase())
        ) 

      // Purpose filter
      const cardPurpose = getJobCardPurpose(card);
      const matchesPurpose =
        purposeFilter === "all" ||
        (purposeFilter === "both" && cardPurpose === "both") ||
        (purposeFilter === "pressing" && cardPurpose === "pressing") ||
        (purposeFilter === "material" && cardPurpose === "material");

      return isInDateRange && matchesSearch && matchesPurpose;
    });
  }, [jobCards, fromDate, toDate, searchQuery, purposeFilter]);

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

  // const getPurposeColor = (purpose: string) => {
  //   switch (purpose) {
  //     case "pressing":
  //       return "bg-blue-50 text-blue-700 border-blue-200";
  //     case "material":
  //       return "bg-green-50 text-green-700 border-green-200";
  //     case "both":
  //       return "bg-purple-50 text-purple-700 border-purple-200";
  //     default:
  //       return "bg-gray-50 text-gray-700 border-gray-200";
  //   }
  // };

  const applyFilters = () => {
    setShowFilters(false);
  };

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
    setPurposeFilter("all");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
          Job Cards
          <span className="bg-emerald-50 text-emerald-700 text-sm font-medium px-2 py-0.5 rounded-full border border-emerald-200">
            {filteredJobCards.length}
          </span>
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
      <div className="bg-white   mb-4 ">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer name or work type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {/* Date Range - now in a single row on mobile */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={applyFilters}
                className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Apply
              </Button>
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
            Try adjusting your filters or create a new job card.
          </p>
          <Button
            onClick={onOpenForm}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Create Job Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredJobCards.map((card) => {
            const purpose = getJobCardPurpose(card);
            const totalAmount = calculateTotalAmount(card);

            return (
              <div
                key={card.name}
                onClick={() => setSelectedCard(card)}
                className="relative bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
              >
                <div className="p-3 space-y-2">
                  {/* Top Row - Dates and Amount */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(card.start_date)} -{" "}
                        {formatDate(card.finish_date)}
                      </span>
                    </div>
                    {totalAmount > 0 && (
                      <span className="font-medium text-emerald-700 text-sm">
                        {totalAmount} AED
                      </span>
                    )}
                  </div>

                  {/* Customer Name */}
                  <p className="font-semibold text-gray-900 text-sm leading-tight">
                    {card.party_name || "No Customer Name"}
                  </p>

                  {/* Address */}
                  <p className="text-xs text-gray-600 leading-tight line-clamp-2">
                    {[card.property_no, card.building_name, card.area]
                      .filter(Boolean)
                      .join(", ") || "No Address"}
                  </p>

                  {/* Bottom Row - Purpose and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex gap-1">
                    {getPurposeDisplay(purpose)
                      .split(" ")
                      .map((p) => (
                        <span
                          key={p}
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(card, e)}
                      className="h-6 w-6 p-0 hover:bg-green-100"
                    >
                      <Edit className="h-3 w-3 text-green-800 hover:text-green-900" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(card.name, e)}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <Trash2 className="h-3 w-3 text-red-500 hover:text-red-800" />
                    </Button>
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
          <JobCardDetails
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </Dialog>
    </div>
  );
};

export default JobCardList;
