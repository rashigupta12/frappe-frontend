/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/frappeClient.js
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment 
  ? '' // Use relative URLs in development to leverage Vite proxy
  : 'https://eits.thebigocommunity.org'; // Direct URL for production

// Create axios instance with default config
const frappeClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 15000, // Increased timeout for production
  
  withCredentials: true, // This is crucial for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Add these headers for production CORS
    ...(isDevelopment ? {} : {
      'Origin': 'https://frappe-frontend-three.vercel.app',
      'Referer': 'https://frappe-frontend-three.vercel.app'
    })
  }
});

// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    // In development, ensure we're using the proxy
    if (isDevelopment && config.url && !config.url.startsWith('/api')) {
      console.log('Making request via Vite proxy:', config.url);
    }
    
    // For production, ensure proper headers
    if (!isDevelopment) {
      if (config.headers) {
        config.headers['Origin'] = 'https://frappe-frontend-three.vercel.app';
        config.headers['Referer'] = 'https://frappe-frontend-three.vercel.app';
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
frappeClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (isDevelopment) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      headers: error.response?.headers
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      // You might want to redirect to login or dispatch an action
    }
    return Promise.reject(error);
  }
);

// Frappe API methods
export const frappeAPI = {
  // Test connection first
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

  // Authentication with better session handling
  login: async (username: string, password: string) => {
    try {
      // Clear any existing session data
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      
      const response = await frappeClient.post('/api/method/login', {
        usr: username,
        pwd: password
      });
      
      console.log('Login response:', response.data);
      console.log('Response headers:', response.headers);
      
      // Check for successful login
      if (response.data.message === 'Logged In' || response.status === 200) {
        const userData: {
          username: string;
          full_name: any;
          authenticated: boolean;
          loginTime: number;
          user_info?: any;
        } = {
          username: username,
          full_name: response.data.full_name || response.data.user || 'User',
          authenticated: true,
          loginTime: Date.now()
        };
        
        localStorage.setItem('frappe_user', JSON.stringify(userData));
        
        // Try to get user info immediately after login to verify session
        try {
          const userInfo = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
          console.log('User info after login:', userInfo.data);
          userData.user_info = userInfo.data;
          localStorage.setItem('frappe_user', JSON.stringify(userData));
        } catch (userInfoError) {
          console.warn('Could not fetch user info after login:', userInfoError);
        }
        
        return { success: true, data: response.data, user: userData };
      }
      
      return { success: false, data: response.data };
    } catch (error) {
      console.error('Login error details:', {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        statusText: axios.isAxiosError(error) ? error.response?.statusText : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
        headers: axios.isAxiosError(error) ? error.response?.headers : undefined
      });
      
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Login failed: ${error.response?.status} ${error.response?.statusText}`);
      } else {
        throw error;
      }
    }
  },

  logout: async () => {
    try {
      const response = await frappeClient.post('/api/method/logout');
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      return response.data;
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      if (axios.isAxiosError(error)) {
        console.error('Logout error:', error.response?.data || error.message);
      } else {
        console.error('Logout error:', (error as Error).message || error);
      }
      throw error;
    }
  },

  // Check if session is valid with retry logic
  checkSession: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      
      if (response.data && response.data.message && response.data.message !== 'Guest') {
        return { 
          authenticated: true, 
          user: response.data.message 
        };
      } else {
        // User is guest, clear local storage
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        return { authenticated: false, error: 'Not authenticated' };
      }
    } catch (error) {
      // Clear stored user data if session is invalid
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
      }
      return { 
        authenticated: false, 
        error: axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error as Error).message 
      };
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
        localStorage.removeItem('frappe_session');
      }
      throw error;
    }
  },

  // Lead operations with better error handling
  getAllLeads: async () => {
    try {
      const response = await frappeClient.get('/api/resource/Lead');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  getLeadById: async (leadId: string) => {
    try {
      const response = await frappeClient.get(`/api/resource/Lead/${leadId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  createLead: async (leadData: any) => {
    try {
      const response = await frappeClient.post('/api/resource/Lead', leadData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  updateLead: async (leadId: string, leadData: any) => {
    try {
      const response = await frappeClient.put(`/api/resource/Lead/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }
};

export default frappeClient;