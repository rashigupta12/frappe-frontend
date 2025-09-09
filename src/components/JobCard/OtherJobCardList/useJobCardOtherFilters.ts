import { useMemo, useState } from "react";
import type { JobCardOther } from "../../../context/JobCardOtherContext";


interface FilterState {
  fromDate: string;
  toDate: string;
  searchQuery: string;
  serviceTypeFilter: string;
  statusFilter: "all" | "submitted" | "draft";
}

export const useJobCardOtherFilters = (jobCardsOther: JobCardOther[]) => {
  const todayString = new Date().toISOString().split("T")[0];
  
  const [filters, setFilters] = useState<FilterState>({
    fromDate: todayString,
    toDate: todayString,
    searchQuery: "",
    serviceTypeFilter: "all",
    statusFilter: "all"
  });
  
  const [isDefaultFilter, setIsDefaultFilter] = useState(true);

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
      const filterFromDate = new Date(filters.fromDate);
      const filterToDate = new Date(filters.toDate);

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
        filters.searchQuery === "" ||
        card.party_name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (card.services || []).some(
          (service) =>
            service.work_type
              ?.toLowerCase()
              .includes(filters.searchQuery.toLowerCase()) ||
            service.work_description
              ?.toLowerCase()
              .includes(filters.searchQuery.toLowerCase())
        );

      const matchesServiceType =
        filters.serviceTypeFilter === "all" ||
        (card.services || []).some(
          (service) => service.work_type === filters.serviceTypeFilter
        );

      const matchesStatus =
        filters.statusFilter === "all" ||
        (filters.statusFilter === "submitted" && card.docstatus === 1) ||
        (filters.statusFilter === "draft" && card.docstatus !== 1);

      return (
        isInDateRange && matchesSearch && matchesServiceType && matchesStatus
      );
    });
  }, [
    jobCardsOther,
    filters.fromDate,
    filters.toDate,
    filters.searchQuery,
    filters.serviceTypeFilter,
    filters.statusFilter,
    isDefaultFilter,
  ]);

  // Update isDefaultFilter when filters change
  useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    setIsDefaultFilter(
      filters.fromDate === today &&
      filters.toDate === today &&
      filters.searchQuery === "" &&
      filters.serviceTypeFilter === "all" &&
      filters.statusFilter === "all"
    );
  }, [filters]);

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({
      fromDate: today,
      toDate: today,
      searchQuery: "",
      serviceTypeFilter: "all",
      statusFilter: "all"
    });
    setIsDefaultFilter(true);
  };

  return {
    filteredJobCards,
    filters,
    setFilters,
    clearFilters,
    isDefaultFilter,
    getUniqueServiceTypes
  };
};