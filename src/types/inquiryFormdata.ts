/* eslint-disable @typescript-eslint/no-explicit-any */
// types/FormData.ts
export interface NewCustomerFormData {
  name: string;
  email: string;
  phone: string;
  jobType: string[];
}

export interface InspectorAvailability {
  user_id: string;
  user_name: string;
  email: string;
  date: string;
  availability: {
    occupied_slots: Array<{ start: string; end: string }>;
    free_slots: Array<{ start: string; end: string; duration_hours?: number }>;
    is_completely_free: boolean;
    total_occupied_hours: number;
  };
}

export interface CustomerSearchResult {
  customer_name: string;
  mobile_no: string;
  email_id: string;
  name: string;
  lead_name?: string;
  area?: string;
  address_details?: {
    emirate: string;
    area: string;
    community: string;
    street_name: string;
    property_number: string;
    combined_address: string;
    property_category: string;
    property_type: string;
  };
  site_name?: string;
  match_info?: any;
}


export type PriorityLevel = "Low" | "Medium" | "High";


