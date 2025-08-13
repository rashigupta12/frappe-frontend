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
  allocated_to_name?: string; // Optional, can be set to user full name
  custom_start_time?:Date;
  custom_end_time?: Date;
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
  custom_end_time: any;
  custom_start_time: any;
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
  updateTodo: (todoId: string, todoData: Record<string, unknown>) => Promise<void>;

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

    // Fetch inquiry data and user details for each todo
    const todosWithInquiries: TodoWithInquiry[] = await Promise.all(
      todos.map(async (todo: TodoItem) => {
        try {
          let updatedTodo = todo;
          
          // Get updated todo data if name exists - using proper type checking
          if (todo.name) {
            // Type-safe approach
            const getTodoMethod = (frappeAPI as any).getTodoByName || (frappeAPI as any).getTodoByNAme;
            
            if (typeof getTodoMethod === 'function') {
              const todoNameResponse = await getTodoMethod(todo.name);
              updatedTodo = todoNameResponse?.data || todo;
            }
          }

          // Fetch inquiry data if reference is Lead
          let inquiryData = null;
          if (updatedTodo.reference_type === 'Lead' && updatedTodo.reference_name) {
            try {
              const inquiryResponse = await frappeAPI.getLeadById(updatedTodo.reference_name);
              inquiryData = inquiryResponse.data;
            } catch (error) {
              console.warn(`Failed to fetch inquiry data for todo ${updatedTodo.name}:`, error);
            }
          }

          // Fetch allocated_to user details if exists
          let allocatedToName = updatedTodo.allocated_to;
          if (updatedTodo.allocated_to) {
            try {
              const userResponse = await frappeAPI.makeAuthenticatedRequest(
                'GET', 
                `/api/resource/User/${encodeURIComponent(updatedTodo.allocated_to)}`
              );
              allocatedToName = userResponse.data.full_name || updatedTodo.allocated_to;
            } catch (error) {
              console.warn(`Failed to fetch user details for ${updatedTodo.allocated_to}:`, error);
            }
          }

          return {
            ...updatedTodo,
            inquiry_data: inquiryData,
            allocated_to_name: allocatedToName
          };
        } catch (error) {
          console.warn(`Failed to process todo ${todo.name}:`, error);
          return { 
            ...todo, 
            inquiry_data: null,
            allocated_to_name: todo.allocated_to
          };
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
    console.log('Fetched users:', users);

    // Fetch detailed information for each user
    const inspectorsPromises = users.map(async (user: any) => {
      try {
        // Fetch detailed user information
        const userDetailsResponse = await frappeAPI.makeAuthenticatedRequest(
          'GET', 
          `/api/resource/User/${user.name}`
        );
        
        const userDetails = userDetailsResponse.data;
        console.log(`Fetched details for user ${user.name}:`, userDetails);
        
        return {
          name: userDetails.name || userDetails.email,
          email: userDetails.email,
          full_name: userDetails.full_name || userDetails.name || userDetails.email
        };
      } catch (err) {
        console.error(`Error fetching details for user ${user.name}:`, err);
        // Return basic info if detailed fetch fails
        return {
          name: user.name || user.email,
          email: user.email,
          full_name: user.name || user.email
        };
      }
    });

    // Wait for all user details to be fetched
    const inspectors = await Promise.all(inspectorsPromises);

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

    // 1. Prepare payload with debug info
    const todoPayload = {
      doctype: "ToDo",
      status: "Open",
      priority: todoData.priority || "Medium",
      date: todoData.preferred_date,
      allocated_to: todoData.inspector_email,
      description: todoData.description || `Inspection for ${todoData.inquiry_id}`,
      reference_type: "Lead",
      reference_name: todoData.inquiry_id,
      assigned_by: todoData.assigned_by || get().currentUserEmail,
      custom_start_time:todoData.custom_start_time,
      custom_end_time: todoData.custom_end_time
    };
    console.log("ToDo Payload:", todoPayload);

    // 2. Create ToDo
    const todoResponse = await frappeAPI.toDo(todoPayload);
    console.log("ToDo API Response:", todoResponse);
    
    if (!todoResponse.data || todoResponse.data.name === undefined) {
      throw new Error("Invalid response from ToDo creation");
    }

    // 3. Update Lead Status
    const leadResponse = await frappeAPI.updateLead(todoData.inquiry_id, {
      status: "Open"
    });
    console.log("Lead Status Update Response:", leadResponse);

    set({ success: true });

    // Refresh data
    setTimeout(() => {
      const currentState = get();
      currentState.fetchTodos();
      currentState.fetchAvailableInquiries();
      currentState.closeAssignForm();
    }, 1000);

    return todoResponse.data.name; // Return the ToDo name if needed

  } catch (err: any) {
    console.error("Detailed ToDo creation error:", {
      error: err,
      response: err?.response,
      config: err?.config
    });
    
    const errorMessage = err?.response?.data?.message 
      || err?.message 
      || "Failed to create ToDo";
    
    set({ error: errorMessage });
    throw new Error(errorMessage); // Ensure error propagates
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
  updateTodo: async (todoId: string, todoData: Record<string, unknown>) => {
    console.log('Updating todo with ID:', todoId, 'and data:', todoData);
    try {
      set({ createTodoLoading: true, error: null });
      console.log('Updating todo with ID:', todoId, 'and data:', todoData);

      // Update the todo
      const todoPayload = {
        status: 'Open',
        priority: todoData.priority,
        date: todoData.date,
        allocated_to: todoData.allocated_to,
        description: `${todoData.specialRequirements || ''} ${todoData.description || ''}`,
        reference_type: 'Lead',
        assigned_by: todoData.assigned_by || get().currentUserEmail, // Use current user email if not provided
        doctype: 'ToDo',
        custom_start_time: todoData.custom_start_time,
        custom_end_time: todoData.custom_end_time
      };


      await frappeAPI.updateTodo(todoId, todoPayload);

      // Optionally, you can fetch todos again to refresh the state
      await get().fetchTodos();

    } catch (err: any) {
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to update todo';
      set({ error: errorMessage });
    } finally {
      set({ createTodoLoading: false });
    }
  }
}));