
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { frappeAPI } from '../api/frappeClient';

interface TodoItem {
  assigned_by_full_name: string | null;
  owner: string;
  name: string;
  description?: string;
  reference_type?: string;
  reference_name?: string;
  inquiry_data?: unknown;
  date?: string;
  priority?: string;
  status?: string;
  allocated_to?: string;
}

interface SiteInspection {
  owner: string;
  creation: string;
  modified: string;
  inspection_id: string;
  follow_up_required: number;
  measurement_sketch: any;
  site_photos: any;
  inspection_notes: any;
  property_type: any;
  inspection_time: any;
  inspection_date: any;
  name: string;
  lead: string;
  inspection_status: string;
  site_dimensions: Array<{
    floor: string;
    room: string;
    entity: string;
    area_name: string;
    dimensionsunits: string;
    media: string;
  }>;

  custom_site_images?: Array<{
    image: string;
    remarks: string;
  }>;
  // Add other fields as needed

}

interface InspectionStore {
  todos: TodoItem[];
  loading: boolean;
  error: string | null;
  currentInspection: SiteInspection | null;
  siteInspections: SiteInspection[];
  fetchTodos: (userEmail: string) => Promise<void>;
  updateTodoStatus: (todoId: string, status: string) => Promise<void>;
  createInspection: (inspectionData: any, todoId?: string) => Promise<SiteInspection>;
  fetchInspectionDetails: (inspectionName: string) => Promise<void>;
  fetchFirstInspectionByField: (key: string, name: string) => Promise<SiteInspection | null>;
  updateInspectionbyId: (inspectionId: string, updatedData: Partial<SiteInspection>) => Promise<void>;
  fetchAllInspectionsByField: (key: string, value: string) => Promise<SiteInspection[]>;
  UpdateLeadStatus: (reference_name: string, status: string) => Promise<void>;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  currentInspection: null,
  siteInspections: [], // Add th

  fetchAllInspectionsByField: async (fieldName: string, fieldValue: string) => {
    try {
      set({ loading: true, error: null });
      const response = await frappeAPI.getAllInspections({ [fieldName]: fieldValue });
      const inspections = response?.data ?? [];

      // If you need to fetch full details for each inspection:
      const detailedInspections = await Promise.all(
        inspections.map(async (inspection: any) => {
          try {
            const details = await frappeAPI.getInspectionDetails(inspection.name);
            return details.data;
          } catch (error) {
            console.error(`Error fetching details for inspection ${inspection.name}:`, error);
            return inspection; // return basic data if details fetch fails
          }
        })
      );

      set({ siteInspections: detailedInspections });
      return detailedInspections;
    } catch (error) {
      const err = error instanceof Error ? error.message : `Failed to fetch inspections by ${fieldName}`;
      console.error(`Error fetching inspections by ${fieldName}:`, err);
      set({ error: err });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  fetchTodos: async (userEmail) => {
    if (!userEmail) {
      set({ error: 'Current user email not set' });
      return;
    }

    try {
      set({ loading: true, error: null });
      const todosResponse = await frappeAPI.getAllToDos({ allocated_to: userEmail });
      const todos = todosResponse.data || [];

      const todosWithDetails = await Promise.all(
        todos.map(async (todo: TodoItem) => {
          try {
            if (!todo.name) return todo;

            const todoDetailResponse = await frappeAPI.getTodoByNAme(todo.name);
            const updatedTodo = todoDetailResponse?.data || todo;

            if (updatedTodo.reference_type === 'Lead' && updatedTodo.reference_name) {
              try {
                const inquiryResponse = await frappeAPI.getLeadById(updatedTodo.reference_name);
                return {
                  ...updatedTodo,
                  inquiry_data: inquiryResponse.data
                };
              } catch (error) {
                console.warn(`Failed to fetch inquiry data for todo ${updatedTodo.name}:`, error);
                return updatedTodo;
              }
            }
            return updatedTodo;
          } catch (error) {
            console.warn(`Failed to process todo ${todo.name}:`, error);
            return { ...todo, inquiry_data: null };
          }
        })
      );

      set({ todos: todosWithDetails });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch todos';
      set({ error });
      console.error('Error fetching todos:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateTodoStatus: async (todoId, status) => {
    try {
      set({ loading: true });
      await frappeAPI.updateTodoStatus(todoId, status);
      set((state) => ({
        todos: state.todos.map(todo =>
          todo.name === todoId ? { ...todo, status } : todo
        )
      }));
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to update todo status';
      set({ error: err });
      console.error('Error updating todo status:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  UpdateLeadStatus: async (reference_name, status) => {
    try {
      set({ loading: true, error: null });
      await frappeAPI.updateLeadStatus(reference_name, status);
      console.log(`Lead status updated successfully for ${reference_name} to ${status}`);
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to update lead status';
      set({ error: err });
      console.error('Error updating lead status:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createInspection: async (inspectionData, todoId) => {
    try {
      set({ loading: true, error: null });

      // Step 1: Create the Site Inspection
      const createResponse = await frappeAPI.createInspection(inspectionData);

      if (!createResponse.data?.name) {
        throw new Error('Failed to create inspection: No name returned');
      }

      // Step 2: Fetch the full inspection details including site dimensions

      const inspectionName = createResponse.data.name;
      await get().fetchInspectionDetails(inspectionName);

      // Step 3: Update the related ToDo status to "Closed" if todoId is provided
      if (todoId) {
        try {
          await get().updateTodoStatus(todoId, 'Closed');

        } catch (error) {
          console.error('Error updating todo status:', error);
          // Don't fail the whole operation if todo update fails
        }
      }



      const currentInspection = get().currentInspection;
      if (!currentInspection) {
        throw new Error('Failed to fetch inspection details after creation');
      }
      return currentInspection;
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to create inspection';
      set({ error: err });
      console.error('Error creating inspection:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchInspectionDetails: async (inspectionName) => {
    try {
      set({ loading: true, error: null });
      const response = await frappeAPI.getInspectionDetails(inspectionName);
      console.log('Fetched inspection details in store:', response.data);
      set({ currentInspection: response.data });
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to fetch inspection details';
      set({ error: err });
      console.error('Error fetching inspection details:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchFirstInspectionByField: async (fieldName: string, fieldValue: string) => {
    try {
      set({ loading: true, error: null });

      const response = await frappeAPI.getAllInspections({ [fieldName]: fieldValue });
      const inspections = response?.data ?? [];

      if (inspections.length === 0) {
        console.log(`No inspections found for ${fieldName}: ${fieldValue}`);
        set({ currentInspection: null });
        return null;
      }

      const inspectionName = inspections[0].name;
      await get().fetchInspectionDetails(inspectionName);
      return get().currentInspection;

    } catch (error) {
      const err = error instanceof Error ? error.message : `Failed to fetch inspection by ${fieldName}`;
      console.error(`Error fetching inspection by ${fieldName}:`, err);
      set({ error: err });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateInspectionbyId: async (inspectionId, updatedData) => {
    console.log('Updating inspection with ID:', inspectionId, 'and data:', updatedData);
    try {
      set({ loading: true, error: null });

      // First update the inspection
      await frappeAPI.UpdateInspection(inspectionId, updatedData);

      // If the inspection is marked as completed
      if (updatedData.inspection_status === "Completed") {
        // Get the current inspection to access the lead reference
        const currentInspection = get().currentInspection;

        // Use either the lead from updatedData or from currentInspection
        const leadName = updatedData.lead || currentInspection?.lead;

        if (leadName) {
          try {
            await get().UpdateLeadStatus(leadName, 'Quotation');
            console.log(`Successfully updated lead ${leadName} status to Completed`);
          } catch (error) {
            console.error(`Failed to update lead ${leadName} status:`, error);
            // Don't throw error here - we still want to proceed with the inspection update
          }
        } else {
          console.warn('No lead reference found for completed inspection');
        }
      }

      if (updatedData.inspection_status === "Cancelled") {
        // If the inspection is cancelled, update the lead status to "Cancelled"
        const currentInspection = get().currentInspection;
        const leadName = updatedData.lead || currentInspection?.lead;

        if (leadName) {
          try {
            await get().UpdateLeadStatus(leadName, 'Lead');
            console.log(`Successfully updated lead ${leadName} status to Cancelled`);
          } catch (error) {
            console.error(`Failed to update lead ${leadName} status:`, error);
            // Don't throw error here - we still want to proceed with the inspection update
          }
        } else {
          console.warn('No lead reference found for cancelled inspection');
        }

      }

      // Refetch the updated inspection details
      await get().fetchInspectionDetails(inspectionId);
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Failed to update inspection';
      set({ error: err });
      console.error('Error updating inspection:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));