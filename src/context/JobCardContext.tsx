/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Define interfaces based on your JSON structure
// export interface PressingCharges {
//   name?: string;
//   work_type: string;
//   size: string;
//   thickness: string;
//   no_of_sides: string;
//   price: number;
//   amount: number;
//   parent?: string;
//   parentfield?: string;
//   parenttype?: string;
//   doctype?: string;
// }

// export interface MaterialSold {
//   name?: string;
//   work_type: string;
//   size: string;
//   thickness: string;
//   no_of_sides: string;
//   price: number;
//   amount: number;
//   parent?: string;
//   parentfield?: string;
//   parenttype?: string;
//   doctype?: string;
// }




// export interface JobCard {
//   name: string;
//   owner: string;
//   creation: string;
//   modified: string;
//   modified_by: string;
//   docstatus: number;
//   idx: number;
//   date: string;
//   party_name: string;           // Instead of custom_customer_name
//   property_no: string;
//   building_name: string;
//   area: string;
//   start_date: string;
//   finish_date: string;
//   prepared_by: string;          // Instead of custom_prepared_by
//   approved_by: string;          // Instead of custom_approved_by
//   project_id_no: string;        // Instead of custom_project_id_no_
//   ac_v_no_and_date: string;     // Instead of custom_ac_v_no__date
//   doctype: string;
//   material_sold: MaterialSold[];        // Instead of custom_materials_sold
//   pressing_charges: PressingCharges[];   // Instead of custom_pressing_charges
// }


// export interface JobCardFormData {
//   date: string;
//   party_name: string;           // Changed from custom_customer_name
//   property_no: string;
//   building_name: string;
//   area: string;
//   start_date: string;
//   finish_date: string;
//   prepared_by: string;          // Changed from custom_prepared_by
//   approved_by: string;          // Changed from custom_approved_by
//   project_id_no: string;        // Changed from custom_project_id_no_
//   ac_v_no_and_date: string;     // Changed from custom_ac_v_no__date
//   material_sold: MaterialSold[];        // Changed from custom_materials_sold
//   pressing_charges: PressingCharges[];   // Changed from custom_pressing_charges
// }

export interface PressingCharges {
  name?: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;
  idx?: number;
  work_type: string;
  size: string;
  thickness: string;
  no_of_sides: string;
  price: number;
  amount: number;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  __unsaved?: number;
}

export interface MaterialSold {
  name?: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;
  idx?: number;
  work_type: string;
  size: string;
  thickness: string;
  no_of_sides: string;
  price: number;
  amount: number;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  __unsaved?: number;
}

export interface JobCard {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  date: string;
  party_name: string;
  property_no: string;
  building_name: string;
  area: string;
  start_date: string;
  finish_date: string;
  prepared_by: string;
  approved_by: string;
  project_id_no: string;
  ac_v_no_and_date: string;
  doctype: string;
  material_sold: MaterialSold[];
  pressing_charges: PressingCharges[];
}

export interface JobCardFormData {
  date: string;
  party_name: string;
  property_no: string;
  building_name: string;
  area: string;
  start_date: string;
  finish_date: string;
  prepared_by: string;
  approved_by: string;
  project_id_no: string;
  ac_v_no_and_date: string;
  material_sold: MaterialSold[];
  pressing_charges: PressingCharges[];
}

interface JobCardContextState {
  jobCards: JobCard[];
  loading: boolean;
  error: string | null;
  currentJobCard: JobCard | null;
  fetchJobCards: () => Promise<void>;
  getJobCardById: (jobCardId: string) => Promise<JobCard>;
  createJobCard: (jobCardData: JobCardFormData) => Promise<JobCard>;
  updateJobCard: (jobCardId: string, jobCardData: JobCardFormData) => Promise<JobCard>;
  deleteJobCard: (jobCardId: string) => Promise<void>;
  setCurrentJobCard: (jobCard: JobCard | null) => void;
  clearError: () => void;
}

const JobCardContext = createContext<JobCardContextState | undefined>(undefined);

interface JobCardProviderProps {
  children: ReactNode;
}

export const JobCardProvider: React.FC<JobCardProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobCard, setCurrentJobCard] = useState<JobCard | null>(null);

  const clearError = useCallback(() => {
    setError(null);
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

  const fetchJobCards = useCallback(async () => {
    if (!user) {
      console.warn("No user authenticated, cannot fetch job cards.");
      setJobCards([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await frappeAPI.getAllJobCards();
      
      if (response.data && Array.isArray(response.data)) {
        setJobCards(response.data);
      } else {
        setJobCards([]);
      }
    } catch (err) {
      console.error("Error fetching job cards:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job cards";
      setError(errorMessage);
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getJobCardById = useCallback(async (jobCardId: string): Promise<JobCard> => {
    try {
      const response = await frappeAPI.getJobCardById(jobCardId);
      return response.data;
    } catch (err) {
      console.error(`Error fetching job card ${jobCardId}:`, err);
      const errorMessage =
        err instanceof Error ? err.message : `Failed to fetch job card ${jobCardId}`;
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createJobCard = useCallback(
    async (jobCardData: JobCardFormData): Promise<JobCard> => {
      setLoading(true);
      setError(null);
      try {
        // Process dates
        const processedData = {
          ...jobCardData,
          date: processDate(jobCardData.date),
          start_date: processDate(jobCardData.start_date),
          finish_date: processDate(jobCardData.finish_date),
        };

        const response = await frappeAPI.createJobCard(processedData);
        toast.success("Job Card created successfully!");

        await fetchJobCards();
        return response.data;
      } catch (err) {
        toast.error("Failed to create job card. Please try again.");
        console.error("Error creating job card:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCards]
  );

// In JobCardContext.tsx createJobCard method
// ✅ CORRECT - without wrapper



  const updateJobCard = useCallback(
    async (jobCardId: string, jobCardData: JobCardFormData): Promise<JobCard> => {
      setLoading(true);
      setError(null);
      try {
        // Process dates
        const processedData = {
          ...jobCardData,
          date: processDate(jobCardData.date),
          start_date: processDate(jobCardData.start_date),
          finish_date: processDate(jobCardData.finish_date),
        };

        const response = await frappeAPI.updateJobCard(jobCardId, processedData);
        toast.success(`Job Card updated successfully!`);

        await fetchJobCards();
        return response.data;
      } catch (err) {
        toast.error(`Failed to update job card. Please try again.`);
        console.error(`Error updating job card ${jobCardId}:`, err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to update job card`;
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCards]
  );

  const deleteJobCard = useCallback(
    async (jobCardId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await frappeAPI.deleteJobCard(jobCardId);
        toast.success("Job Card deleted successfully!");
        await fetchJobCards();
      } catch (err) {
        toast.error("Failed to delete job card. Please try again.");
        console.error(`Error deleting job card ${jobCardId}:`, err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCards]
  );

  const contextValue: JobCardContextState = {
    jobCards,
    loading,
    error,
    currentJobCard,
    fetchJobCards,
    getJobCardById,
    createJobCard,
    updateJobCard,
    deleteJobCard,
    setCurrentJobCard,
    clearError,
  };

  return (
    <JobCardContext.Provider value={contextValue}>
      {children}
    </JobCardContext.Provider>
  );
};

export const useJobCards = (): JobCardContextState => {
  const context = useContext(JobCardContext);
  if (context === undefined) {
    throw new Error("useJobCards must be used within a JobCardProvider");
  }
  return context;
};

export { JobCardContext };
