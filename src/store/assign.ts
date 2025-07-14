/* eslint-disable @typescript-eslint/no-explicit-any */
// stores/assignStore.ts
import { create } from 'zustand';
import { frappeAPI } from '../api/frappeClient';

interface Inspector {
  name: string;
  email?: string;
  full_name?: string;
}

interface TodoItem {
  name: string;
  status: string;
  priority: string;
  date: string;
  allocated_to: string;
  description: string;
  reference_type: string;
  reference_name: string;
  assigned_by: string;
  creation: string;
  modified: string;
}

interface TodoWithInquiry extends TodoItem {
  inquiry_data?: any;
}

interface Inquiry {
  name: string;
  lead_name: string;
  email_id: string;
  mobile_no: string;
  custom_job_type: string;
  custom_property_type: string;
  custom_building_name: string;
  custom_map_data: string;
  custom_preferred_inspection_date: string;
  custom_preferred_inspection_time: string;
  custom_budget_range: string;
  custom_project_urgency: string;
  custom_special_requirements: string;
  status: string;
  creation: string;
}

interface CreateTodoData {
  inquiry_id: string;
  inspector_email: string;
  preferred_date: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assigned_by?: string; // Optional, can be set to current user email
}

interface AssignStore {
  // Loading states
  todosLoading: boolean;
  inquiriesLoading: boolean;
  inspectorsLoading: boolean;
  createTodoLoading: boolean;

  // Error states
  error: string | null;

  // Success state
  success: boolean;

  // Data
  todos: TodoWithInquiry[];
  availableInquiries: Inquiry[];
  inspectors: Inspector[];

  // Current user
  currentUserEmail: string;

  // Dashboard state management
  showAssignForm: boolean;
  selectedInquiry: Inquiry | null;
  preSelectedInquiry: Inquiry | null;

  // Actions
  setCurrentUser: (email: string) => void;
  fetchTodos: () => Promise<void>;
  fetchAvailableInquiries: () => Promise<void>;
  fetchInspectors: () => Promise<void>;
  createTodo: (todoData: CreateTodoData) => Promise<void>;

  // Dashboard specific actions
  openAssignForm: (inquiry?: Inquiry) => void;
  closeAssignForm: () => void;
  setPreSelectedInquiry: (inquiry: Inquiry | null) => void;
  selectInquiry: (inquiry: Inquiry) => void;

  // Utility actions
  resetStatus: () => void;
  clearError: () => void;
  resetStore: () => void;
  
  // Add a manual error setter
  setError: (error: string) => void;
}

export const useAssignStore = create<AssignStore>((set, get) => ({
  // Initial state
  todosLoading: false,
  inquiriesLoading: false,
  inspectorsLoading: false,
  createTodoLoading: false,
  error: null,
  success: false,
  todos: [],
  availableInquiries: [],
  inspectors: [],
  currentUserEmail: '',

  // Dashboard state
  showAssignForm: false,
  selectedInquiry: null,
  preSelectedInquiry: null,

  setCurrentUser: (email: string) => {
    set({ currentUserEmail: email });
  },

  setError: (error: string) => {
    set({ error });
  },

  // Dashboard specific actions
  openAssignForm: (inquiry?: Inquiry) => {
    set({
      showAssignForm: true,
      selectedInquiry: inquiry || null,
      error: null
    });
  },

  closeAssignForm: () => {
    set({
      showAssignForm: false,
      selectedInquiry: null,
      error: null,
      success: false
    });
  },

  setPreSelectedInquiry: (inquiry: Inquiry | null) => {
    set({
      preSelectedInquiry: inquiry,
      selectedInquiry: inquiry,
      showAssignForm: !!inquiry
    });
  },

  selectInquiry: (inquiry: Inquiry) => {
    set({ selectedInquiry: inquiry });
  },

  fetchTodos: async () => {
    const { currentUserEmail } = get();
    if (!currentUserEmail) {
      set({ error: 'Current user email not set' });
      return;
    }

    
    try {
      set({ todosLoading: true, error: null });

      // Fetch todos for the current user
      const todosResponse = await frappeAPI.getAllToDos({ owner: currentUserEmail });
      const todos = todosResponse.data || [];

      // Fetch inquiry data for each todo
      const todosWithInquiries: TodoWithInquiry[] = await Promise.all(
        todos.map(async (todo: TodoItem) => {
          try {
            if (todo.name) {
              // Fix potential typo in API method name
              const todoNameResponse = await frappeAPI.getTodoByNAme ? 
                await frappeAPI.getTodoByNAme(todo.name) : 
                await frappeAPI.getTodoByNAme?.(todo.name);
              
              const updatedTodo = todoNameResponse?.data || todo;

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
            }
            return todo;
          } catch (error) {
            console.warn(`Failed to process todo ${todo.name}:`, error);
            return { ...todo, inquiry_data: null };
          }
        })
      );

      set({ todos: todosWithInquiries });
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch todos';
      set({ error: errorMessage });
      console.error('Error fetching todos:', err);
    } finally {
      set({ todosLoading: false });
    }
  },

  fetchAvailableInquiries: async () => {
    const { currentUserEmail } = get();
    if (!currentUserEmail) {
      set({ error: 'Current user email not set' });
      return;
    }


    try {
      set({ inquiriesLoading: true, error: null });

      // Fetch leads with status "Lead" for the current user
      const response = await frappeAPI.makeAuthenticatedRequest(
        'GET',
        `/api/resource/Lead?filters=[["status","=","Lead"],["lead_owner","=","${currentUserEmail}"]]&order_by=creation%20desc`
      );

      const leads = response.data || [];
     
      // Fetch detailed data for each lead
      const inquiriesPromises = leads.map(async (lead: any) => {
        try {
          const inquiryResponse = await frappeAPI.getLeadById(lead.name);
          return inquiryResponse.data;
        } catch (error) {
          console.warn(`Failed to fetch details for lead ${lead.name}:`, error);
          return null;
        }
      });

      const inquiries = await Promise.all(inquiriesPromises);
      const validInquiries = inquiries.filter(inquiry => inquiry !== null);
      
      set({ availableInquiries: validInquiries });
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch available inquiries';
      set({ error: errorMessage });
    } finally {
      set({ inquiriesLoading: false });
    }
  },

  fetchInspectors: async () => {
    try {
      set({ inspectorsLoading: true, error: null });

      // Fetch all inspector users
      const response = await frappeAPI.ispectionUser(); 
      const users = response.data || [];

      // Ensure proper mapping to Inspector interface
      const inspectors: Inspector[] = users.map((user: any) => ({
        name: user.name || user.email,
        email: user.email,
        full_name: user.full_name || user.name || user.email
      }));

      set({ inspectors });
    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to fetch inspectors';
      set({ error: errorMessage });
      console.error('Error fetching inspectors:', err);
    } finally {
      set({ inspectorsLoading: false });
    }
  },

  createTodo: async (todoData: CreateTodoData) => {

   


    try {
      set({ createTodoLoading: true, error: null, success: false });


      // Prepare the todo payload
      const todoPayload = {
        status: 'Open',
        priority: todoData.priority,
        date: todoData.preferred_date,
        allocated_to: todoData.inspector_email,
        description: `${todoData.description}`,
        reference_type: 'Lead',
        reference_name: todoData.inquiry_id,
        assigned_by: todoData.assigned_by || get().currentUserEmail, // Use current user email if not provided
        doctype: 'ToDo'
      };


      // Create the todo
       await frappeAPI.toDo(todoPayload);
      

      // Update the lead status to "Open" (assigned)
       await frappeAPI.updateLead(todoData.inquiry_id, {
        status: 'Open'
      });

      set({ success: true });

      // Close the form after successful assignment
      setTimeout(() => {
        const currentState = get();
        currentState.closeAssignForm();
      }, 1500);

      // Refresh the data
      setTimeout(() => {
        const currentState = get();
        currentState.fetchTodos();
        currentState.fetchAvailableInquiries();
      }, 500);

    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to create todo';
      set({ error: errorMessage });
     
      
      // Don't throw the error, let the component handle it through the store state
    } finally {
      set({ createTodoLoading: false });
    }
  },

  resetStatus: () => {
    set({ error: null, success: false });
  },

  clearError: () => {
    set({ error: null });
  },

  resetStore: () => {
    set({
      showAssignForm: false,
      selectedInquiry: null,
      preSelectedInquiry: null,
      error: null,
      success: false
    });
  },
}));