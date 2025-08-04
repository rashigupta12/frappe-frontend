/* eslint-disable @typescript-eslint/no-explicit-any */

import type { LeadFormData } from "../context/LeadContext";


// Date Formatting Helpers
export const formatDate = (date?: Date | string): string => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatDateCompact = (date: string | Date) => {
  const today = new Date();
  const inputDate = new Date(date);

  if (inputDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (inputDate.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return inputDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Color Mapping Helpers
export const getJobTypeColor = (jobType: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "1. AC Repair & Maintenance": {
      bg: "#DBEAFE",
      text: "#1E40AF",
      border: "#3B82F6",
    },
    "6. Civil Repairing Work": {
      bg: "#FDE68A",
      text: "#92400E",
      border: "#F59E0B",
    },
    "2. Electrical Repair & Maintenance": {
      bg: "#FEF3C7",
      text: "#92400E",
      border: "#F59E0B",
    },
    "4. Equipments Installation & Maintenance": {
      bg: "#FECACA",
      text: "#991B1B",
      border: "#EF4444",
    },
    "7. Joineries & Wood Work": {
      bg: "#D1FAE5",
      text: "#065F46",
      border: "#10B981",
    },
    "5. Painting & Interior Decoration": {
      bg: "#DDD6FE",
      text: "#5B21B6",
      border: "#8B5CF6",
    },
    "3. Plumbing, Sanitary, Bathroom & Toilets": {
      bg: "#E9D5FF",
      text: "#6B21A8",
      border: "#9333EA",
    },
    "8. Veneer Pressing": {
      bg: "#FFE4E6",
      text: "#9D174D",
      border: "#EC4899",
    },
    Other: {
      bg: "#E5E7EB",
      text: "#4B5563",
      border: "#9CA3AF",
    },
  };

  return colors[jobType] || colors["Other"];
};

export const getBudgetColor = (budget: string) => {
  const colors = {
    "AED 100 - AED 500": {
      bg: "#D1FAE5",
      text: "#065F46",
      border: "#10B981",
    },
    "AED 501 - AED 1000": {
      bg: "#FEF3C7",
      text: "#92400E",
      border: "#F59E0B",
    },
    "AED 1001 - AED 2000": {
      bg: "#DBEAFE",
      text: "#1E40AF",
      border: "#3B82F6",
    },
    "AED 2001 - AED 5000": {
      bg: "#E9D5FF",
      text: "#6B21A8",
      border: "#9333EA",
    },
    "AED 5001 - AED 10000": {
      bg: "#FDE68A",
      text: "#92400E",
      border: "#FBBF24",
    },
    "AED 10001 & more": {
      bg: "#FECACA",
      text: "#991B1B",
      border: "#EF4444",
    },
  };

  return colors[budget as keyof typeof colors] || {
    bg: "#E5E7EB",
    text: "#4B5563",
    border: "#9CA3AF",
  };
};

export const getUrgencyColor = (urgency: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "1. Normal : 2-3 days": {
      bg: "#FECACA",
      text: "#991B1B",
      border: "#EF4444",
    },
    "2. Relaxed : 4-7 days": {
      bg: "#FDE68A",
      text: "#92400E",
      border: "#F59E0B",
    },
    "3. Planned : 1 - 2 week": {
      bg: "#BFDBFE",
      text: "#1E40AF",
      border: "#3B82F6",
    },
    "4. Planned : 1 month & above": {
      bg: "#DDD6FE",
      text: "#5B21B6",
      border: "#8B5CF6",
    }
  };

  return colors[urgency] || {
    bg: "#E5E7EB",
    text: "#4B5563",
    border: "#9CA3AF",
  };
};

// Label Shortening Helpers
export const getUrgencyShortLabel = (urgency: string) => {
  const labels: Record<string, string> = {
    "1. Normal : 2-3 days": "Normal (2-3 days)",
    "2. Relaxed : 4-7 days": "Relaxed (4-7 days)",
    "3. Planned : 1 - 2 week": "Planned (1-2 weeks)",
    "4. Planned : 1 month & above": "Planned (1 month+)"
  };
  return labels[urgency] || urgency;
};



export const validatePhoneNumber = (number: string) => {
  // Mobile codes: 050, 052, 054, 055, 056, 058 (3-digit codes)
  const mobileRegex = /^\+971\s(050|052|054|055|056|058)\s[0-9]{3}\s[0-9]{4}$/;

  // Landline codes: 02 (Abu Dhabi), 03 (Al Ain), 04 (Dubai), 06 (Sharjah), 07 (Other Emirates), 09 (Other)
  const landlineRegex = /^\+971\s(02|03|04|06|07|09)\s[0-9]{3}\s[0-9]{4}$/;

  const isValidMobile = mobileRegex.test(number);
  const isValidLandline = landlineRegex.test(number);

  // Check length based on type
  const expectedLength = number.includes(" 5") ? 17 : 17;

  if (number.length === expectedLength) {
    if (!isValidMobile && !isValidLandline) {
      return "Please enter a valid UAE number (Mobile: +971 5XX XXX XXXX, Landline: +971 0X XXX XXXX)";
    }
    return "";
  }
  return "";
};


export const propertyTypes = ["Residential", "Commercial", "Industrial"];
export const buildingTypes = ["Villa", "Apartment", "Office", "Warehouse", "Other"];
export const  budgetRanges = [
    "AED 100 - AED 500",
    "AED 501 - AED 1000",
    "AED 1001 - AED 2000",
    "AED 2001 - AED 5000",
    "AED 5001 - AED 10000",
    "AED 10001 & more",
  ];




// Data Formatting for Submission
export const formatSubmissionData = (formData: any) => {
  const submissionData = { ...formData };

  const getDateString = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    if (typeof date === "string") {
      if (date.includes(" ")) {
        return date.split(" ")[0];
      }
      return date;
    }
    return date.toISOString().split("T")[0];
  };

  const formatDateTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr || !timeStr) return "";
    const time = timeStr.includes(":") && timeStr.split(":").length === 2
      ? `${timeStr}:00`
      : timeStr;
    return `${dateStr} ${time}`;
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    return getDateString(date);
  };

  if (formData.custom_preferred_inspection_time && formData.custom_preferred_inspection_date) {
    const dateStr = getDateString(formData.custom_preferred_inspection_date);
    submissionData.custom_preferred_inspection_time = formatDateTime(
      dateStr,
      formData.custom_preferred_inspection_time
    );
  } else {
    submissionData.custom_preferred_inspection_time = "";
  }

  if (formData.custom_alternative_inspection_time && formData.custom_alternative_inspection_date) {
    const dateStr = getDateString(formData.custom_alternative_inspection_date);
    submissionData.custom_alternative_inspection_time = formatDateTime(
      dateStr,
      formData.custom_alternative_inspection_time
    );
  } else {
    submissionData.custom_alternative_inspection_time = "";
  }

  submissionData.custom_preferred_inspection_date = formatDate(
    formData.custom_preferred_inspection_date
  );
  submissionData.custom_alternative_inspection_date = formatDate(
    formData.custom_alternative_inspection_date
  );

  return submissionData;
};


// Color Mapping Helpers
export const getStatusColor = (status: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "Open": {
      bg: "#EFF6FF",
      text: "#1E40AF",
      border: "#3B82F6",
    },
    "Completed": {
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#10B981",
    },
    "Cancelled": {
      bg: "#FEF2F2",
      text: "#991B1B",
      border: "#EF4444",
    },
  };

  return colors[status] || {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#9CA3AF",
  };
};

export const getPriorityColor = (priority: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "High": {
      bg: "#FEE2E2",
      text: "#991B1B",
      border: "#EF4444",
    },
    "Medium": {
      bg: "#FEF3C7",
      text: "#92400E",
      border: "#F59E0B",
    },
    "Low": {
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#10B981",
    },
  };

  return colors[priority] || {
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#9CA3AF",
  };
};

export type FormSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
};



export const defaultFormData: LeadFormData = {
  lead_name: "",
  email_id: "",
  mobile_no: "",
  custom_job_type: "",
  custom_property_type: "Residential",
  custom_type_of_building: "Villa",
  custom_building_name: "",
  custom_budget_range: "",
  custom_project_urgency: "",
  custom_preferred_inspection_date: null,
  custom_alternative_inspection_date: null,
  custom_preferred_inspection_time: "",
  custom_special_requirements: "",
  custom_property_area: "",
  custom_bulding__apartment__villa__office_number: "",
  custom_reference_name: "",
  custom_alternative_inspection_time: "",
  utm_source: "",
  customer_id: "",
  lead_id: "",
};

export type PriorityLevel = "Low" | "Medium" | "High";