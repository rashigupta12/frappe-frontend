/* eslint-disable @typescript-eslint/no-explicit-any */
export const statusOptions = [
  {
    value: "Scheduled",
    label: "Scheduled",
    color: "bg-amber-100 text-amber-800",
  },
  {
    value: "In Progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "Completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "Pending",
    label: "On Hold",
    color: "bg-yellow-100 text-yellow-800",
  },
];

export interface StatusDropdownProps {
  currentStatus: string;
  inspectionName: string;
  onStatusChange: (
    inspectionName: string,
    newStatus: string,
    currentStatus: string
  ) => void;
  isUpdating: boolean;
  inspectionDate?: string;
}


export interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const statusFilters = [
  { id: "all", label: "All" },
  { id: "Scheduled", label: "Pending" },
  { id: "In Progress", label: "In Progress" },
  { id: "Completed", label: "Completed" },
];


export interface Inspection {
  name: string;
  customer_name?: string;
  property_type?: string;
  lead?: string;
  site_dimensions?: any[];
  inspection_notes?: string;
  modified: string;
  follow_up_required?: number;
  inspection_status: string;
  inspection_date?: string;
  inspection_time?: string;
  docstatus?: number;
}

export interface InspectionCardProps {
  inspection: Inspection;
  onStatusChange: (inspectionName: string, newStatus: string, currentStatus: string) => void;
  onNavigate: (inspection: Inspection) => void;
  updatingStatus: string | null;
}

export interface InspectionTableProps {
  inspections: Inspection[];
  onStatusChange: (inspectionName: string, newStatus: string, currentStatus: string) => void;
  onNavigate: (inspection: Inspection) => void;
  updatingStatus: string | null;
  loading: boolean;
}