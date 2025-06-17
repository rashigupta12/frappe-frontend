

// ====================== ENUM TYPES ======================
export const JOB_TYPES = [
  "joineries-wood-work",
  "painting-decorating",
  "electrical",
  "sanitary-plumbing-toilets-washroom",
  "equipment-installation-maintenance",
  "other"
] as const;

export const PROPERTY_TYPES = [
  "residential",
  "commercial"
] as const;

export const BUILDING_TYPES = [
  "villa",
  "apartment",
  "shop",
  "office"
] as const;

export const INSPECTION_PROPERTY_TYPES = [
  "residential",
  "commercial",
  "industrial"
] as const;

export const BUDGET_RANGES = [
  "under-500-aed",
  "500-2000-aed",
  "2000-4500-aed",
  "4500-22000-aed",
  "above-22000-aed"
] as const;

export const PROJECT_URGENCIES = [
  "urgent",
  "normal",
  "flexible",
  "future-planning"
] as const;

export const USER_ROLES = [
  "SALES_REP",
  "SALES_COORD",
  "TECH_INSPECTOR",
  "SALES_MGR",
  "PROJECT_MGR",
  "ADMIN"
] as const;
export const INQUIRY_STATUS =[
  "new",
  "in-progress",
  "completed",
  "cancelled",
  "on-hold"
]


// Derived types from the arrays above
export type JobType = typeof JOB_TYPES[number];
export type PropertyType = typeof PROPERTY_TYPES[number];
export type BuildingType = typeof BUILDING_TYPES[number];
export type InspectionPropertyType = typeof INSPECTION_PROPERTY_TYPES[number];
export type BudgetRange = typeof BUDGET_RANGES[number];
export type ProjectUrgency = typeof PROJECT_URGENCIES[number];
export type UserRole = typeof USER_ROLES[number];
export type InquiryStatus = typeof INQUIRY_STATUS[number];

// ====================== DATABASE TYPES ======================

// ====================== API TYPES ======================
export interface CreateInquiryRequest {
  createdBy: string; // User ID
  name: string;
  email: string;
  contactNumber: string;
  jobType: JobType;
  country: string;
  state: string;
  city: string;
  area: string;
  propertyType: PropertyType;
  buildingType: BuildingType;
  buildingName?: string;
  mapLocation?: string | null;
  inspectionPropertyType?: InspectionPropertyType;
  budgetRange: BudgetRange;
  projectUrgency: ProjectUrgency;
  specialRequirements?: string | null;
  preferredInspectionDate?: Date | string | null;
  alternativeInspectionDate?: Date | string | null;
  status?: InquiryStatus; // Default to 'new'
}

export interface UpdateInquiryRequest extends Partial<Omit<CreateInquiryRequest, 'createdBy'>> {
  id: string;
}

export interface InquiryFilters {
  jobType?: JobType;
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  propertyType?: PropertyType;
  buildingType?: BuildingType;
  inspectionPropertyType?: InspectionPropertyType;
  budgetRange?: BudgetRange;
  projectUrgency?: ProjectUrgency;
  createdBy?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'preferredInspectionDate' | 'city' | 'area';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ====================== UTILITY TYPES ======================
// For form handling where dates might be strings
export type InquiryFormValues = Omit<CreateInquiryRequest, 'preferredInspectionDate' | 'alternativeInspectionDate'> & {
  preferredInspectionDate?: string;
  alternativeInspectionDate?: string;
};