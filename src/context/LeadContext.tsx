/* eslint-disable @typescript-eslint/no-explicit-any */
// src/contexts/LeadsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { frappeAPI } from "../api/frappeClient";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";

// Define the Lead interface based on your API response
export interface Lead {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  first_name: string;
  last_name: string;
  lead_name: string;
  lead_owner: string;
  status: string;
  type: string;
  request_type: string;
  custom_job_type: string;
  custom_property_type: string;
  custom_type_of_building: string;
  custom_building_name: string;
  custom_map_data: string;
  custom_preferred_inspection_date: string;
  custom_preferred_inspection_time: string;
  custom_alternative_inspection_date: string;
  custom_budget_range: string;
  custom_project_urgency: string;
  custom_special_requirements: string;
  email_id: string;
  mobile_no: string;
  phone: string;
  no_of_employees: string;
  annual_revenue: number;
  country: string;
  qualification_status: string;
  company: string;
  language: string;
  image: string;
  title: string;
  disabled: number;
  unsubscribed: number;
  blog_subscriber: number;
  doctype: string;
  custom_building_number: string;
  custom_alternative_inspection_time: string;
  notes: any[];
}

// Define form data interface for creating/updating leads
export interface LeadFormData {
  lead_name?: string;
  first_name?: string;
  last_name?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  custom_job_type?: string;
  custom_property_type?: string;
  custom_type_of_building?: string;
  custom_building_name?: string;
  custom_map_data?: string;
  custom_preferred_inspection_date?: string | Date | null;
  custom_preferred_inspection_time?: string;
  custom_alternative_inspection_date?: string | Date | null;
  custom_budget_range?: string;
  custom_project_urgency?: string;
  custom_special_requirements?: string;
  country?: string;
  company?: string;
  status?: string;
  qualification_status?: string;
  custom_building_number?: string;
  custom_alternative_inspection_time?: string;
  [key: string]: any;
}

export interface JobType {
  name: string;
 
}

export interface ProjectUrgency {
  name: string;
}

// Context state interface
interface LeadsContextState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  currentLead: Lead | null;
  fetchLeads: () => Promise<void>;
  getLeadById: (leadId: string) => Promise<Lead>;
  createLead: (leadData: LeadFormData) => Promise<Lead>;
  updateLead: (leadId: string, leadData: LeadFormData) => Promise<Lead>;
  setCurrentLead: (lead: Lead | null) => void;
  clearError: () => void;
  jobTypes: JobType[];
  fetchJobTypes: () => Promise<void>;
  // Add any other methods you need
  projectUrgency: ProjectUrgency[]; // Define this if needed
  fetchProjectUrgency?: () => Promise<void>; // Define this if needed
}

// Create context
const LeadsContext = createContext<LeadsContextState | undefined>(undefined);

// Provider props interface
interface LeadsProviderProps {
  children: ReactNode;
}

// Provider component
export const LeadsProvider: React.FC<LeadsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  console.log("Current user in LeadsProvider:", user);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [projectUrgency, setProjectUrgency] = useState<ProjectUrgency[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all leads
  const fetchLeads = useCallback(async () => {
    console.log("Fetching leads for user12:", user);
    if (!user) {
      console.warn("No user authenticated, cannot fetch leads.");
      setLeads([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await frappeAPI.getAllLeads(user);

      // If we only get names, fetch full details for each lead
      if (response.data && Array.isArray(response.data)) {
        if (
          response.data.length > 0 &&
          response.data[0].name &&
          !response.data[0].lead_name
        ) {
          // We only have names, fetch full details
          const fullLeads: Lead[] = [];
          for (const leadSummary of response.data) {
            try {
              const fullLead = await frappeAPI.getLeadById(leadSummary.name);
              fullLeads.push(fullLead.data);
            } catch (err) {
              console.error(`Error fetching lead ${leadSummary.name}:`, err);
            }
          }
          setLeads(fullLeads);
        } else {
          // We have full lead data
          setLeads(response.data);
        }
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch leads";
      setError(errorMessage);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get lead by ID
  const getLeadById = useCallback(async (leadId: string): Promise<Lead> => {
    try {
      const response = await frappeAPI.getLeadById(leadId);
      return response.data;
      // toast.success(`Lead ${leadId} fetched successfully!`);
    } catch (err) {
      console.error(`Error fetching lead ${leadId}:`, err);
      const errorMessage =
        err instanceof Error ? err.message : `Failed to fetch lead ${leadId}`;
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Process date helper function
  const processDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    }
    if (typeof dateValue === "string" && dateValue.trim() !== "") {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
    }
    return null;
  };

  // Create new lead
  const createLead = useCallback(
    async (leadData: LeadFormData): Promise<Lead> => {
      setLoading(true);
      setError(null);
      try {
        // Process dates
        const processedData = {
          ...leadData,
          custom_preferred_inspection_date: processDate(
            leadData.custom_preferred_inspection_date
          ),
          custom_alternative_inspection_date: processDate(
            leadData.custom_alternative_inspection_date
          ),
        };

        console.log("Creating lead with data:", processedData);

        const response = await frappeAPI.createLead(processedData);
        toast.success("Lead created successfully!");

        // Refresh leads list
        await fetchLeads();

        return response.data;
      } catch (err) {
        toast.error("Failed to create lead. Please try again.");
        console.error("Error creating lead:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create lead";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchLeads]
  );

  // Update existing lead
  const updateLead = useCallback(
    async (leadId: string, leadData: LeadFormData): Promise<Lead> => {
      setLoading(true);
      setError(null);
      try {
        // Process dates
        const processedData = {
          ...leadData,
          custom_preferred_inspection_date: processDate(
            leadData.custom_preferred_inspection_date
          ),
          custom_alternative_inspection_date: processDate(
            leadData.custom_alternative_inspection_date
          ),
        };

        console.log(`Updating lead ${leadId} with data:`, processedData);

        const response = await frappeAPI.updateLead(leadId, processedData);
        toast.success(`Lead  updated successfully!`);

        // Refresh leads list
        await fetchLeads();

        return response.data;
      } catch (err) {
        toast.error(`Failed to update lead ${leadId}. Please try again.`);
        console.error(`Error updating lead ${leadId}:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to update lead ${leadId}`;
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchLeads]
  );

  // Fetch job types
  const fetchJobTypes = useCallback(async () => {
    try {
      const response = await frappeAPI.getJobTypes();
      if (response.data && Array.isArray(response.data)) {
        console.log("Fetched job types:", response.data);
        setJobTypes(response.data);
      } else {
        setJobTypes([]);
      }
    } catch (err) {
      console.error("Error fetching job types:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch job types"
      );
    }
  }, []);

  // Fetch project urgency
  const fetchProjectUrgency = useCallback(async () => {
    try {
      const response = await frappeAPI.getProjectUrgency();
      if (response.data && Array.isArray(response.data)) {
        console.log("Fetched project urgency:", response.data);
        setProjectUrgency(response.data);
      } else {
        setProjectUrgency([]);
      }
    } catch (err) {
      console.error("Error fetching project urgency:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch project urgency"
      );
    }
  }, []);

  // Context value
  const contextValue: LeadsContextState = {
    leads,
    loading,
    error,
    currentLead,
    fetchLeads,
    getLeadById,
    createLead,
    updateLead,
    setCurrentLead,
    clearError,
    jobTypes,
    fetchJobTypes,
    projectUrgency,
    fetchProjectUrgency,
  };

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}
    </LeadsContext.Provider>
  );
};

// Custom hook to use the context
export const useLeads = (): LeadsContextState => {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error("useLeads must be used within a LeadsProvider");
  }
  return context;
};

// Export the context for advanced use cases
export { LeadsContext };
