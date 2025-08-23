/* eslint-disable @typescript-eslint/no-explicit-any */
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
  uom:string;
  no_of_sides: string;
  price: number;
  amount: number;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  __unsaved?: number;
  remarks?: string; // Added remarks field
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
  uom:string;
  no_of_sides: string;
  price: number;
  amount: number;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  __unsaved?: number;
  remarks?: string; // Added remarks field
}

export interface Employee {
  name: string;
  employee_name: string;
}

export interface JobCard {
  lead_id: string;
  customer_id: string;
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  date: string;
  party_name: string;
  // property_no: string;
  // building_name: string;
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
  custom_uae_area: string;
  custom_emirate: string;
  custom_property_category: string;
  custom_community: string;
  custom_street_name: string;
  custom_property_number__name: string;
  custom_property_type: string;
}

export interface JobCardFormData {
  lead_id: string;
  customer_id: string;
  date: string;
  party_name: string;
  // property_no: string;
  // building_name: string;
  area: string;
  start_date: string;
  finish_date: string;
  prepared_by: string;
  approved_by: string;
  project_id_no: string;
  ac_v_no_and_date: string;
  material_sold: MaterialSold[];
  pressing_charges: PressingCharges[];
  docstatus?: number;
  custom_uae_area?: string;
  custom_emirate?: string;
  custom_property_category?: string;
  custom_community?: string;
  custom_street_name?: string;
  custom_property_number__name?: string;
  custom_property_type?: string;
}

interface JobCardContextState {
  jobCards: JobCard[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
  currentJobCard: JobCard | null;
  fetchJobCards: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  getJobCardById: (jobCardId: string) => Promise<JobCard>;
  createJobCard: (jobCardData: JobCardFormData) => Promise<JobCard>;
  updateJobCard: (jobCardId: string, jobCardData: JobCardFormData) => Promise<JobCard>;
  deleteJobCard: (jobCardId: string) => Promise<void>;
  setCurrentJobCard: (jobCard: JobCard | null) => void;
  getEmployeeNameById: (employeeId: string) => string;
  clearError: () => void;
}

const JobCardContext = createContext<JobCardContextState | undefined>(undefined);

interface JobCardProviderProps {
  children: ReactNode;
}

export const JobCardProvider: React.FC<JobCardProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobCard, setCurrentJobCard] = useState<JobCard | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to get employee name by ID
  const getEmployeeNameById = useCallback((employeeId: string): string => {
    if (!employeeId || !employees.length) return 'N/A';
    const employee = employees.find(emp => emp.name === employeeId);
    return employee ? employee.employee_name : employeeId; // Fallback to ID if name not found
  }, [employees]);

const transformJobCardData = (apiResponse: any): JobCard => {
  console.log("🔧 Raw API response for transformation:", apiResponse);
  
  // Extract the actual data from the response
  const actualData = apiResponse.data || apiResponse;
  
  console.log("📋 Actual data being processed:", actualData);
  
  const transformed = {
    lead_id: actualData.lead_id || '',
    customer_id: actualData.customer_id || '',
    name: actualData.name || '',
    owner: actualData.owner || '',
    creation: actualData.creation || '',
    modified: actualData.modified || '',
    modified_by: actualData.modified_by || '',
    docstatus: actualData.docstatus || 0,
    idx: actualData.idx || 0,
    doctype: actualData.doctype || '',
    
    // Job card specific fields
    date: actualData.date || '',
    party_name: actualData.party_name || '',
    // property_no: actualData.property_no || '',
    // building_name: actualData.building_name || '',
    area: actualData.area || '',
    start_date: actualData.start_date || '',
    finish_date: actualData.finish_date || '',
    prepared_by: actualData.prepared_by || '',
    approved_by: actualData.approved_by || '',
    project_id_no: actualData.project_id_no || '',
    ac_v_no_and_date: actualData.ac_v_no_and_date || '',
    
    pressing_charges: Array.isArray(actualData.pressing_charges) ? actualData.pressing_charges : [],
    material_sold: Array.isArray(actualData.material_sold) ? actualData.material_sold : [],
    custom_uae_area: actualData.custom_uae_area || '',
    custom_emirate: actualData.custom_emirate || '',
    custom_property_category: actualData.custom_property_category || '',
    custom_community: actualData.custom_community || '',
    custom_street_name: actualData.custom_street_name || '',
    custom_property_number__name: actualData.custom_property_number__name || '',
    custom_property_type: actualData.custom_property_type || '', // Added custom_property_type
  };
  
  console.log("✅ Transformed job card:", transformed);
  return transformed;
};



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

  const fetchEmployees = useCallback(async () => {
    try {
      console.log("🚀 Fetching employees...");
      const response = await frappeAPI.getEmployees();
      
      console.log("📋 Employees response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const transformedEmployees = response.data.map((emp: any) => ({
          name: emp.name || '',
          employee_name: emp.employee_name || ''
        }));
        
        console.log("✅ Transformed employees:", transformedEmployees);
        setEmployees(transformedEmployees);
      } else {
        console.log("📭 No employees data found");
        setEmployees([]);
      }
    } catch (err) {
      console.error("❌ Error fetching employees:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch employees";
      setError(errorMessage);
      setEmployees([]);
      showToast.error("Failed to fetch employees");
    }
  }, []);

const fetchJobCards = useCallback(async () => {
  if (!user) {
    console.warn("No user authenticated, cannot fetch job cards.");
    setJobCards([]);
    return;
  }

  console.log("🔄 Fetching job cards for user:", user);
  setLoading(true);
  setError(null);
  const useremail = user.email || '';
  try {
    console.log("🚀 Step 1: Fetching job card list...");
    
    // First, get the simple list (this works - you confirmed it returns names)
    const listResponse = await frappeAPI.makeAuthenticatedRequest(
      'GET', 
      `/api/resource/Job Card -Veneer Pressing?filters=[["owner", "=", "${useremail}"]]&order_by=creation desc`
    );
    
    console.log("📋 Job card list response:", listResponse);
    
    if (listResponse.data && Array.isArray(listResponse.data) && listResponse.data.length > 0) {
      console.log(`🔍 Step 2: Fetching full details for ${listResponse.data.length} job cards...`);
      
      // Then fetch each job card's full details individually
      const jobCardPromises = listResponse.data.map(async (item: any, index: number) => {
        try {
          console.log(`📄 Fetching details for job card ${index + 1}/${listResponse.data.length}: ${item.name}`);
          const fullJobCard = await frappeAPI.getJobCardById(item.name);
          console.log(`✅ Full data for ${item.name}:`, fullJobCard.data);
          return transformJobCardData(fullJobCard);
        } catch (error) {
          console.error(`❌ Error fetching job card ${item.name}:`, error);
          return null;
        }
      });
      
      const fullJobCards = await Promise.all(jobCardPromises);
      
      // Filter out any failed requests
      const validJobCards = fullJobCards.filter(card => card !== null) as JobCard[];
      
      console.log(`✅ Step 3: Successfully fetched ${validJobCards.length} valid job cards:`, validJobCards);
      setJobCards(validJobCards);
    } else {
      console.log("📭 No job cards found in list");
      setJobCards([]);
    }
  } catch (err) {
    console.error("❌ Error in fetchJobCards:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch job cards";
    setError(errorMessage);
    setJobCards([]);
    showToast.error("Failed to fetch job cards");
  } finally {
    setLoading(false);
  }
}, [user]);

  const getJobCardById = useCallback(async (jobCardId: string): Promise<JobCard> => {
    try {
      console.log(`🔍 Fetching job card by ID: ${jobCardId}`);
      const response = await frappeAPI.getJobCardById(jobCardId);
      console.log("📋 Job card by ID response:", response.data);
      return transformJobCardData(response.data);
    } catch (err) {
      console.error(`❌ Error fetching job card ${jobCardId}:`, err);
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch job card ${jobCardId}`;
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

        console.log("🔧 Processed data:", processedData);
       
        const response = await frappeAPI.createJobCard(processedData);
        console.log("✅ Job card created:", response.data);
       
        showToast.success("Job Card created successfully!");
       
        // Refresh the job cards list
        await fetchJobCards();
        return transformJobCardData(response.data);
      } catch (err) {
        console.error("❌ Error creating job card:", err);
        showToast.error("Failed to create job card. Please try again.");
        const errorMessage = err instanceof Error ? err.message : "Failed to create job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCards]
  );

  const updateJobCard = useCallback(
    async (jobCardId: string, jobCardData: JobCardFormData): Promise<JobCard> => {
      setLoading(true);
      setError(null);
     
      try {
        console.log(`📝 Updating job card ${jobCardId} with data:`, jobCardData);
       
        // Process dates
        const processedData = {
          ...jobCardData,
          date: processDate(jobCardData.date),
          start_date: processDate(jobCardData.start_date),
          finish_date: processDate(jobCardData.finish_date),
        };

        console.log("🔧 Processed update data:", processedData);
       
        const response = await frappeAPI.updateJobCard(jobCardId, processedData);
        console.log("✅ Job card updated:", response.data);
       
        showToast.success("Job Card updated successfully!");
       
        // Refresh the job cards list
        await fetchJobCards();
        return transformJobCardData(response.data);
      } catch (err) {
        console.error(`❌ Error updating job card ${jobCardId}:`, err);
        showToast.error("Failed to update job card. Please try again.");
        const errorMessage = err instanceof Error ? err.message : "Failed to update job card";
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
        console.log(`🗑️ Deleting job card: ${jobCardId}`);
        await frappeAPI.deleteJobCard(jobCardId);
        showToast.success("Job Card deleted successfully!");
        await fetchJobCards();
      } catch (err) {
        console.error(`❌ Error deleting job card ${jobCardId}:`, err);
        
        const errorMessage = err instanceof Error ? err.message : "Failed to delete job card";
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
    employees,
    loading,
    error,
    currentJobCard,
    fetchJobCards,
    fetchEmployees,
    getJobCardById,
    createJobCard,
    updateJobCard,
    deleteJobCard,
    setCurrentJobCard,
    getEmployeeNameById,
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
