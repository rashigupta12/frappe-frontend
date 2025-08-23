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
// import { showToast } from "react-hot-showToast";
import { useAuth } from "./AuthContext";
import { showToast } from "../helpers/comman";

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
  custom_jobtype: Array<{
    job_type: string;
    // other fields if needed
  }>;
  // custom_property_type: string;
  // custom_type_of_building: string;
  // custom_building_name: string;
  // custom_map_data: string;
  custom_preferred_inspection_date: string;
  custom_preferred_inspection_time: string;
  // custom_alternative_inspection_date: string;
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
  // custom_bulding__apartment__villa__office_number: string;
  // custom_alternative_inspection_time: string;
  notes: any[];
  source: string;
  custom_property_area?: string;
  custom_reference_name: string; // New field for reference name
  custom_emirate?: string; // New field for emirate
  custom_area?: string; // New field for area
  custom_property_name__number?: string; // New field for property name or number
  custom_street_name?: string; // New field for street name

  custom_community?: string; // New field for community
  custom_property_category?: string; // New field for property category
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
  custom_jobtype: string[]; // Array of selected job type names
  // custom_property_type?: string;
  // custom_type_of_building?: string;
  // custom_building_name?: string; // Address Line 1
  // custom_bulding__apartment__villa__office_number?: string; // Address Line 2
  // custom_map_data?: string;
  custom_preferred_inspection_date?: string | Date | null;
  custom_preferred_inspection_time?: string;
  // custom_alternative_inspection_date?: string | Date | null;
  custom_budget_range?: string;
  custom_project_urgency?: string;
  custom_special_requirements?: string;
  // country?: string;
  // company?: string;
  status?: string;
  qualification_status?: string;
  // custom_alternative_inspection_time?: string;
  source?: string;
  custom_property_area?: string; // Combined address field
  [key: string]: any;
  custom_reference_name: string; // New field for reference name
  custom_emirate?: string; // New field for emirate
  custom_area?: string; // New field for area
  custom_property_name__number?: string; // New field for property name or number
  custom_street_name?: string; // New field for street name
  custom_community?: string; // New field for community
  custom_property_category?: string; // New field for property category

}

export interface JobType {
  name: string;
}

export interface ProjectUrgency {
  name: string;
}

export interface UTMSource {
  name: string;
}

// New interfaces for hierarchical address data
export interface Emirate {
  name: string;
}

export interface City {
  name: string;
  emirate?: string;
}

export interface Area {
  name: string;
  city?: string;
  emirate?: string;
}
export interface Community {
  name: string;
  area?: string;
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
  projectUrgency: ProjectUrgency[];
  fetchProjectUrgency?: () => Promise<void>;
  utmSource: UTMSource[];
  fetchUtmSource: () => Promise<void>;

  // New address-related state and methods
  emirates: Emirate[];
  cities: City[];
  areas: Area[];
  fetchEmirates: () => Promise<void>;
  fetchCities: (emirate: string) => Promise<void>;
  fetchAreas: (city: string) => Promise<void>;
  addressLoading: boolean;
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [projectUrgency, setProjectUrgency] = useState<ProjectUrgency[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [utmSource, setUtmSource] = useState<UTMSource[]>([]);

  // New state for address data
  const [emirates, setEmirates] = useState<Emirate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [addressLoading, setAddressLoading] = useState<boolean>(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all leads
  const fetchLeads = useCallback(async () => {
    if (!user) {
      console.warn("No user authenticated, cannot fetch leads.");
      setLeads([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await frappeAPI.getAllLeads(user.username);

      if (response.data && Array.isArray(response.data)) {
        if (
          response.data.length > 0 &&
          response.data[0].name &&
          !response.data[0].lead_name
        ) {
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
      return dateValue.toISOString().split("T")[0];
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
        const processedData = {
          ...leadData,
          custom_preferred_inspection_date: processDate(
            leadData.custom_preferred_inspection_date
          ),
          custom_alternative_inspection_date: processDate(
            leadData.custom_alternative_inspection_date
          ),
        };

        const response = await frappeAPI.createLead(processedData);

        await fetchLeads();

        return response.data;
      } catch (err) {
        showToast.error("Failed to create inquiry. Please try again.");
        console.error("Error creating inquiry:", err);
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
        const processedData = {
          ...leadData,
          custom_preferred_inspection_date: processDate(
            leadData.custom_preferred_inspection_date
          ),
          custom_alternative_inspection_date: processDate(
            leadData.custom_alternative_inspection_date
          ),
        };

        const response = await frappeAPI.updateLead(leadId, processedData);

        await fetchLeads();

        return response.data;
      } catch (err) {
        showToast.error(`Failed to update Inquiry ${leadId}. Please try again.`);
        console.error(`Error updating inquiry ${leadId}:`, err);
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

  // Fetch UTM source
  const fetchUtmSource = useCallback(async () => {
    try {
      const response = await frappeAPI.GetUtmSoucre();
      if (response.data && Array.isArray(response.data)) {
        setUtmSource(response.data);
      } else {
        setUtmSource([]);
      }
    } catch (err) {
      console.error("Error fetching UTM sources:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch UTM sources"
      );
    }
  }, []);

  // Fetch emirates
  const fetchEmirates = useCallback(async () => {
    setAddressLoading(true);
    try {
      const response = await frappeAPI.getEmirate();
      if (response.data && Array.isArray(response.data)) {
        setEmirates(response.data);
      } else {
        setEmirates([]);
      }
    } catch (err) {
      console.error("Error fetching emirates:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch emirates");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // Fetch cities based on selected emirate
  const fetchCities = useCallback(async (emirate: string) => {
    if (!emirate) {
      setCities([]);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await frappeAPI.getCity({ emirate });
      if (response.data && Array.isArray(response.data)) {
        setCities(response.data);
      } else {
        setCities([]);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch cities");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // Fetch areas based on selected city
  const fetchAreas = useCallback(async (city: string) => {
    if (!city) {
      setAreas([]);
      return;
    }

    setAddressLoading(true);
    try {
      const response = await frappeAPI.getArea({ city });
      if (response.data && Array.isArray(response.data)) {
        setAreas(response.data);
      } else {
        setAreas([]);
      }
    } catch (err) {
      console.error("Error fetching areas:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch areas");
    } finally {
      setAddressLoading(false);
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
    utmSource,
    fetchUtmSource,
    emirates,
    cities,
    areas,
    fetchEmirates,
    fetchCities,
    fetchAreas,
    addressLoading,
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
