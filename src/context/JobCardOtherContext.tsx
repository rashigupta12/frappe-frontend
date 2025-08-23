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

// 🆕 NEW INTERFACE - Services instead of MaterialSold
export interface Services {
  name?: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;
  idx?: number;
  work_type: string;
  work_description: string;
  start_date: string;
  finish_date: string;
  price: string;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  __unsaved?: number;
}

export interface Employee {
  name: string;
  employee_name: string;
}

export interface JobCardOther {
  custom_uae_area: string;
  custom_emirate: string;
  custom_property_category: string;
  custom_community: string;
  custom_street_name: string;
  custom_property_numbername: string;
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
  services: Services[]; // 🆕 CHANGED from material_sold to services
  custom_property_type: string;
}

export interface JobCardOtherFormData {
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
  services: Services[]; // 🆕 CHANGED from material_sold to services
  // Add any other fields needed for the form
  lead_id: string;
  customer_id: string;
  custom_total_amount?: string;
  custom_uae_area?: string;
  custom_emirate?: string;
  custom_property_category?: string;
  custom_community?: string;
  custom_street_name?: string;
  custom_property_numbername?: string;
  custom_property_type?: string;

}

interface JobCardOtherContextState {
  jobCardsOther: JobCardOther[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
  currentJobCardOther: JobCardOther | null;
  fetchJobCardsOther: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  getJobCardOtherById: (jobCardId: string) => Promise<JobCardOther>;
  createJobCardOther: (
    jobCardData: JobCardOtherFormData
  ) => Promise<JobCardOther>;
  updateJobCardOther: (
    jobCardId: string,
    jobCardData: JobCardOtherFormData
  ) => Promise<JobCardOther>;
  deleteJobCardOther: (jobCardId: string) => Promise<void>;
  setCurrentJobCardOther: (jobCard: JobCardOther | null) => void;
  getEmployeeNameById: (employeeId: string) => string;
  clearError: () => void;
}

const JobCardOtherContext = createContext<JobCardOtherContextState | undefined>(
  undefined
);

interface JobCardOtherProviderProps {
  children: ReactNode;
}

export const JobCardOtherProvider: React.FC<JobCardOtherProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [jobCardsOther, setJobCardsOther] = useState<JobCardOther[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobCardOther, setCurrentJobCardOther] =
    useState<JobCardOther | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper function to get employee name by ID
  const getEmployeeNameById = useCallback(
    (employeeId: string): string => {
      if (!employeeId || !employees.length) return "N/A";
      const employee = employees.find((emp) => emp.name === employeeId);
      return employee ? employee.employee_name : employeeId;
    },
    [employees]
  );

  const transformJobCardOtherData = (apiResponse: any): JobCardOther => {
    console.log(
      "🔧 Raw API response for transformation (Other Services):",
      apiResponse
    );

    const actualData = apiResponse.data || apiResponse;

    console.log("📋 Actual data being processed (Other Services):", actualData);

    const transformed = {
      name: actualData.name || "",
      owner: actualData.owner || "",
      creation: actualData.creation || "",
      modified: actualData.modified || "",
      modified_by: actualData.modified_by || "",
      docstatus: actualData.docstatus || 0,
      idx: actualData.idx || 0,
      doctype: actualData.doctype || "",

      // Job card specific fields
      date: actualData.date || "",
      party_name: actualData.party_name || "",
      property_no: actualData.property_no || "",
      building_name: actualData.building_name || "",
      area: actualData.area || "",
      start_date: actualData.start_date || "",
      finish_date: actualData.finish_date || "",
      prepared_by: actualData.prepared_by || "",
      approved_by: actualData.approved_by || "",
      project_id_no: actualData.project_id_no || "",
      ac_v_no_and_date: actualData.ac_v_no_and_date || "",

      // Custom fields
      custom_uae_area: actualData.custom_uae_area || "",
      custom_emirate: actualData.custom_emirate || "",
      custom_property_category: actualData.custom_property_category || "",
      custom_community: actualData.custom_community || "",
      custom_street_name: actualData.custom_street_name || "",
      custom_property_numbername:
        actualData.custom_property_numbername || "",
      

      services: Array.isArray(actualData.services) ? actualData.services : [], // 🆕 CHANGED
      custom_property_type: actualData.custom_property_type || "",
    };
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
      console.log("🚀 Fetching employees (Other Services)...");
      const response = await frappeAPI.getEmployees();

      console.log("📋 Employees response (Other Services):", response.data);

      if (response.data && Array.isArray(response.data)) {
        const transformedEmployees = response.data.map((emp: any) => ({
          name: emp.name || "",
          employee_name: emp.employee_name || "",
        }));

        console.log(
          "✅ Transformed employees (Other Services):",
          transformedEmployees
        );
        setEmployees(transformedEmployees);
      } else {
        console.log("📭 No employees data found (Other Services)");
        setEmployees([]);
      }
    } catch (err) {
      console.error("❌ Error fetching employees (Other Services):", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch employees";
      setError(errorMessage);
      setEmployees([]);
      showToast.error("Failed to fetch employees");
    }
  }, []);

  const fetchJobCardsOther = useCallback(async () => {
    if (!user) {
      console.warn(
        "No user authenticated, cannot fetch job cards (Other Services)."
      );
      setJobCardsOther([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Step 1: Fetching job card list (Other Services)...");

      // Use dedicated API method instead of generic makeAuthenticatedRequest
      const listResponse = await frappeAPI.getAllJobCardsOther();

      console.log("📋 Job card list response (Other Services):", listResponse);

      if (
        listResponse.data &&
        Array.isArray(listResponse.data) &&
        listResponse.data.length > 0
      ) {
        console.log(
          `🔍 Step 2: Fetching full details for ${listResponse.data.length} job cards (Other Services)...`
        );

        const jobCardPromises = listResponse.data.map(
          async (item: any, index: number) => {
            try {
              console.log(
                `📄 Fetching details for job card ${index + 1}/${
                  listResponse.data.length
                }: ${item.name} (Other Services)`
              );
              const fullJobCard = await frappeAPI.getJobCardOtherById(
                item.name
              );
              console.log(
                `✅ Full data for ${item.name} (Other Services):`,
                fullJobCard.data
              );
              return transformJobCardOtherData(fullJobCard);
            } catch (error) {
              console.error(
                `❌ Error fetching job card ${item.name} (Other Services):`,
                error
              );
              return null;
            }
          }
        );

        const fullJobCards = await Promise.all(jobCardPromises);

        const validJobCards = fullJobCards.filter(
          (card) => card !== null
        ) as JobCardOther[];

        console.log(
          `✅ Step 3: Successfully fetched ${validJobCards.length} valid job cards (Other Services):`,
          validJobCards
        );
        setJobCardsOther(validJobCards);
      } else {
        console.log("📭 No job cards found in list (Other Services)");
        setJobCardsOther([]);
      }
    } catch (err) {
      console.error("❌ Error in fetchJobCardsOther:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job cards";
      setError(errorMessage);
      setJobCardsOther([]);
      showToast.error("Failed to fetch job cards (Other Services)");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getJobCardOtherById = useCallback(
    async (jobCardId: string): Promise<JobCardOther> => {
      try {
        console.log(
          `🔍 Fetching job card by ID (Other Services): ${jobCardId}`
        );
        const response = await frappeAPI.getJobCardOtherById(jobCardId);
        console.log(
          "📋 Job card by ID response (Other Services):",
          response.data
        );
        return transformJobCardOtherData(response.data);
      } catch (err) {
        console.error(
          `❌ Error fetching job card ${jobCardId} (Other Services):`,
          err
        );
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to fetch job card ${jobCardId}`;
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const createJobCardOther = useCallback(
    async (jobCardData: JobCardOtherFormData): Promise<JobCardOther> => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          "📝 Creating job card (Other Services) with data:",
          jobCardData
        );

        // Process dates and ensure doctype is set correctly
        const processedData = {
          ...jobCardData,
          doctype: "Job Card -Other Services", // Ensure correct doctype
          date: processDate(jobCardData.date),
          start_date: processDate(jobCardData.start_date),
          finish_date: processDate(jobCardData.finish_date),
        };

        console.log("🔧 Processed data (Other Services):", processedData);

        const response = await frappeAPI.createJobCardOther(processedData);
        console.log("✅ Job card created (Other Services):", response.data);

        showToast.success("Job Card (Other Services) created successfully!");

        // Refresh the job cards list
        await fetchJobCardsOther();
        return transformJobCardOtherData(response.data);
      } catch (err) {
        console.error("❌ Error creating job card (Other Services):", err);
        showToast.error(
          "Failed to create job card (Other Services). Please try again."
        );
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCardsOther]
  );

  const updateJobCardOther = useCallback(
    async (
      jobCardId: string,
      jobCardData: JobCardOtherFormData
    ): Promise<JobCardOther> => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          `📝 Updating job card ${jobCardId} (Other Services) with data:`,
          jobCardData
        );

        // Process dates
        const processedData = {
          ...jobCardData,
          date: processDate(jobCardData.date),
          start_date: processDate(jobCardData.start_date),
          finish_date: processDate(jobCardData.finish_date),
        };

        console.log(
          "🔧 Processed update data (Other Services):",
          processedData
        );

        const response = await frappeAPI.updateJobCardOther(
          jobCardId,
          processedData
        );
        console.log("✅ Job card updated (Other Services):", response.data);

        showToast.success("Job Card (Other Services) updated successfully!");

        // Refresh the job cards list
        await fetchJobCardsOther();
        return transformJobCardOtherData(response.data);
      } catch (err) {
        console.error(
          `❌ Error updating job card ${jobCardId} (Other Services):`,
          err
        );
        showToast.error(
          "Failed to update job card (Other Services). Please try again."
        );
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCardsOther]
  );

  const deleteJobCardOther = useCallback(
    async (jobCardId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🗑️ Deleting job card (Other Services): ${jobCardId}`);
        await frappeAPI.deleteJobCardOther(jobCardId);
        showToast.success("Job Card (Other Services) deleted successfully!");
        await fetchJobCardsOther();
      } catch (err) {
        console.error(
          `❌ Error deleting job card ${jobCardId} (Other Services):`,
          err
        );
        showToast.error(
          "Failed to delete job card (Other Services). Please try again."
        );
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete job card";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobCardsOther]
  );

  const contextValue: JobCardOtherContextState = {
    jobCardsOther,
    employees,
    loading,
    error,
    currentJobCardOther,
    fetchJobCardsOther,
    fetchEmployees,
    getJobCardOtherById,
    createJobCardOther,
    updateJobCardOther,
    deleteJobCardOther,
    setCurrentJobCardOther,
    getEmployeeNameById,
    clearError,
  };

  return (
    <JobCardOtherContext.Provider value={contextValue}>
      {children}
    </JobCardOtherContext.Provider>
  );
};

export const useJobCardsOther = (): JobCardOtherContextState => {
  const context = useContext(JobCardOtherContext);
  if (context === undefined) {
    throw new Error(
      "useJobCardsOther must be used within a JobCardOtherProvider"
    );
  }
  return context;
};

export { JobCardOtherContext };
