
export interface JobType {
  job_type: string;
  // other properties if needed
}

export interface InquiryData {
  custom_property_type: string;
  custom_property_category: string;
  custom_jobtype?: JobType[];
  custom_project_urgency?: string;
  lead_name?: string;
  custom_type_of_building?: string;
  mobile_no?: string;
  phone?: string;
  custom_budget_range?: string;
  custom_property_area?: string;
}


export interface Todo {
  name: string;
  inquiry_data?: InquiryData;
  priority?: string;
  status?: string;
  date?: string;
  description?: string;
  assigned_by_full_name?: string;
  custom_start_time: string;
  custom_end_time: string;
}

export const priorityFilters = [
  { id: "all", label: "All" },
  { id: "High", label: "High" },
  { id: "Medium", label: "Med" },
  { id: "Low", label: "Low" },
];

export interface PriorityFilter {
  id: string;
  label: string;
}
