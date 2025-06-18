
// src/api/frappeClient.js
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment 
  ? '' // Use relative URLs in development to leverage Vite proxy
  : 'https://frappe-frontend-three.vercel.app/'; // Direct URL for production

// Create axios instance with default config
const frappeClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 10000,
  withCredentials: true, // This is crucial for cookies
  headers: {
    'Content-Type': 'application/json',
  },
   method: 'OPTIONS'
});

// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    // In development, ensure we're using the proxy
    if (isDevelopment && config.url && !config.url.startsWith('/api')) {
      console.log('Making request via Vite proxy:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
frappeClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access
      localStorage.removeItem('frappe_user');
      // You might want to redirect to login or dispatch an action
    }
    return Promise.reject(error);
  }
);

// Frappe API methods
export const frappeAPI = {
  // Authentication
  login: async (username: string, password: string) => {
    try {
      const response = await frappeClient.post('/api/method/login', {
        usr: username,
        pwd: password
      });
      
      console.log('Login response:', response.data);
      
      // Store user info if login successful
      if (response.data.message === 'Logged In') {
        const userData = {
          username: username,
          full_name: response.data.full_name || 'User'
        };
        localStorage.setItem('frappe_user', JSON.stringify(userData));
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Login error:', error.response?.data || error.message);
      } else {
        console.error('Login error:', (error as Error).message || error);
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await frappeClient.post('/api/method/logout');
      localStorage.removeItem('frappe_user');
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('frappe_user');
      if (axios.isAxiosError(error)) {
        console.error('Logout error:', error.response?.data || error.message);
      } else {
        console.error('Logout error:', (error as Error).message || error);
      }
      throw error;
    }
  },

  // Get user info - with better error handling
  getUserInfo: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      return response.data;
    } catch (error) {
      // If we get 403, user is not authenticated
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      throw error;
    }
  },

  // Check if session is valid
  checkSession: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      return { 
        authenticated: true, 
        user: response.data.message 
      };
    } catch (error) {
      // Clear stored user data if session is invalid
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      return { 
        authenticated: false, 
        error: axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error as Error).message 
      };
    }
  },

  // Test connection to backend
  testConnection: async () => {
    try {
      const response = await frappeClient.get('/api/method/ping');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error as Error).message,
        status: axios.isAxiosError(error) ? error.response?.status : undefined
      };
    }
  },

   getAllLeads: async () => {
    try {
      const response = await frappeClient.get('api/resource/Lead');
      return response.data;
    } catch (error) {
      // If we get 403, user is not authenticated
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      throw error;
    }
  },
  getLeadById: async (leadId: string) => {
    try {
      const response = await frappeClient.get(`api/resource/Lead/${leadId}`);
      return response.data;
    } catch (error) {
      // If we get 403, user is not authenticated
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      throw error;
    }
  },

  createLead: async (leadData: Record<string, unknown>) => {
    try {
      const response = await frappeClient.post('api/resource/Lead', leadData);
      return response.data;
    } catch (error) {
      // If we get 403, user is not authenticated
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      throw error;
    }
  },

  updateLead: async (leadId: string, leadData: Record<string, unknown>) => {
    try {
      const response = await frappeClient.put(`api/resource/Lead/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      // If we get 403, user is not authenticated
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
      }
      throw error;
    }
  }






  // // Generic document operations
  // getDoc: async (doctype: string, name: string) => {
  //   try {
  //     const response = await frappeClient.get(`/api/resource/${doctype}/${name}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching ${doctype}/${name}:`, error.response?.data || error.message);
  //     throw error;
  //   }
  // },

  //   createDoc: async (doctype: string, data: Record<string, any>) => {
  //   try {
  //     const response = await frappeClient.post(`/api/resource/${doctype}`, data);
  //     return response.data;
  //   } catch (error) {
  //     if (axios.isAxiosError(error)) {
  //       console.error(`Error creating ${doctype}:`, error.response?.data || error.message);
  //     } else {
  //       console.error(`Error creating ${doctype}:`, (error as Error).message || error);
  //     }
  //     throw error;
  //   }
  // },

  // updateDoc: async (doctype, name, data) => {
  //   try {
  //     const response = await frappeClient.put(`/api/resource/${doctype}/${name}`, data);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error updating ${doctype}/${name}:`, error.response?.data || error.message);
  //     throw error;
  //   }
  // },

  // deleteDoc: async (doctype, name) => {
  //   try {
  //     const response = await frappeClient.delete(`/api/resource/${doctype}/${name}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error deleting ${doctype}/${name}:`, error.response?.data || error.message);
  //     throw error;
  //   }
  // },

  // // Get list of documents
  // getDocList: async (doctype, filters = {}, fields = [], limit = 20, start = 0) => {
  //   try {
  //     const params = {
  //       fields: JSON.stringify(fields),
  //       filters: JSON.stringify(filters),
  //       limit_start: start,
  //       limit_page_length: limit,
  //     };
      
  //     const response = await frappeClient.get(`/api/resource/${doctype}`, { params });
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching ${doctype} list:`, error.response?.data || error.message);
  //     throw error;
  //   }
  // },

  // // Call custom server methods
  // callMethod: async (method, args = {}) => {
  //   try {
  //     const response = await frappeClient.post(`/api/method/${method}`, args);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error calling method ${method}:`, error.response?.data || error.message);
  //     throw error;
  //   }
  // },

  // // File upload
  // uploadFile: async (file, doctype = null, docname = null) => {
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     if (doctype) formData.append('doctype', doctype);
  //     if (docname) formData.append('docname', docname);

  //     const response = await frappeClient.post('/api/method/upload_file', formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('File upload error:', error.response?.data || error.message);
  //     throw error;
  //   }
  // },
};

export default frappeClient;