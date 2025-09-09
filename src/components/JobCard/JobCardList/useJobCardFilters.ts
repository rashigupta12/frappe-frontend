import { useMemo, useState } from "react";
import type { JobCard } from "../../../context/JobCardContext";


interface FilterState {
  fromDate: string;
  toDate: string;
  searchQuery: string;
  purposeFilter: "all" | "pressing" | "material" | "both" | "submitted";
}

export const useJobCardFilters = (jobCards: JobCard[]) => {
  const todayString = new Date().toISOString().split("T")[0];
  
  const [filters, setFilters] = useState<FilterState>({
    fromDate: todayString,
    toDate: todayString,
    searchQuery: "",
    purposeFilter: "all"
  });
  
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

  // Helper function to determine job card purpose
  const getJobCardPurpose = (card: JobCard) => {
    const hasPressed = card.pressing_charges && card.pressing_charges.length > 0;
    const hasMaterial = card.material_sold && card.material_sold.length > 0;

    if (hasPressed && hasMaterial) return "both";
    if (hasPressed) return "pressing";
    if (hasMaterial) return "material";
    return "none";
  };

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
      const cardFinishDate = card.finish_date
        ? new Date(card.finish_date)
        : cardStartDate; // Fallback to start_date if empty
      const filterFromDate = new Date(filters.fromDate);
      const filterToDate = new Date(filters.toDate);

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
        filters.searchQuery === "" ||
        card.party_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (card.pressing_charges || []).some((charge) =>
          charge.work_type?.toLowerCase().includes(filters.searchQuery.toLowerCase())
        );

      // Purpose filter
      const cardPurpose = getJobCardPurpose(card);
      const matchesPurpose =
        filters.purposeFilter === "all" ||
        (filters.purposeFilter === "both" && cardPurpose === "both") ||
        (filters.purposeFilter === "pressing" && cardPurpose === "pressing") ||
        (filters.purposeFilter === "material" && cardPurpose === "material") ||
        (filters.purposeFilter === "submitted" && card.docstatus === 1);

      return isInDateRange && matchesSearch && matchesPurpose;
    });
  }, [jobCards, filters, isDefaultFilter]);

  // Update isDefaultFilter when filters change
  useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    setIsDefaultFilter(
      filters.fromDate === today &&
      filters.toDate === today &&
      filters.searchQuery === "" &&
      filters.purposeFilter === "all"
    );
  }, [filters]);

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({
      fromDate: today,
      toDate: today,
      searchQuery: "",
      purposeFilter: "all"
    });
    setIsDefaultFilter(true);
  };

  return {
    filteredJobCards,
    filters,
    setFilters,
    clearFilters,
    isDefaultFilter
  };
};

