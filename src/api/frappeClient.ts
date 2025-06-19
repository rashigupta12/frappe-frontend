// src/api/frappeClient.ts
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment 
  ? '' // Use relative URLs in development to leverage Vite proxy
  : 'https://eits.thebigocommunity.org'; // Direct URL for production

// Create axios instance with default config
const frappeClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 15000,
  withCredentials: true, // This is crucial for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Remove unsafe headers - browsers set these automatically
  }
});

// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    // In development, ensure we're using the proxy
    if (isDevelopment && config.url && !config.url.startsWith('/api')) {
      console.log('Making request via Vite proxy:', config.url);
    }
    
    // DO NOT manually set Origin or Referer headers - browsers handle this
    // Remove any unsafe headers that might cause issues
    delete config.headers['Origin'];
    delete config.headers['Referer'];
    
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
      data: error.response?.data
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Handle unauthorized access
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
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
      
      console.log('Attempting login for:', username);
      
      const response = await frappeClient.post('/api/method/login', {
        usr: username,
        pwd: password
      });
      
      console.log('Login response:', response.data);
      console.log('Response status:', response.status);
      console.log('Set-Cookie headers:', response.headers['set-cookie']);
      
      // Check for successful login
      if (response.data.message === 'Logged In' || response.status === 200) {
        const userData: {
          username: string;
          full_name: string;
          authenticated: boolean;
          loginTime: number;
          user_info?: unknown;
        } = {
          username: username,
          full_name: response.data.full_name || response.data.user || 'User',
          authenticated: true,
          loginTime: Date.now()
        };
        
        localStorage.setItem('frappe_user', JSON.stringify(userData));
        
        // Wait a moment for cookies to be set, then verify session
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const sessionCheck = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
          console.log('Session verification after login:', sessionCheck.data);
          
          if (sessionCheck.data.message && sessionCheck.data.message !== 'Guest') {
            userData.user_info = sessionCheck.data.message;
            localStorage.setItem('frappe_user', JSON.stringify(userData));
            return { success: true, data: response.data, user: userData };
          } else {
            console.error('Session verification failed - user is Guest');
            return { success: false, error: 'Session not established properly' };
          }
        } catch (sessionError) {
          console.error('Session verification failed:', sessionError);
          // Still return success if login succeeded, but warn about session
          return { 
            success: true, 
            data: response.data, 
            user: userData,
            warning: 'Session verification failed but login succeeded'
          };
        }
      }
      
      return { success: false, data: response.data, error: 'Login failed' };
    } catch (error) {
      console.error('Login error details:', {
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        statusText: axios.isAxiosError(error) ? error.response?.statusText : undefined,
        data: axios.isAxiosError(error) ? error.response?.data : undefined,
        headers: axios.isAxiosError(error) ? error.response?.headers : undefined
      });
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.exc || 
                           `Login failed: ${error.response?.status} ${error.response?.statusText}`;
        throw new Error(errorMessage);
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
      return { success: true, data: response.data };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed but local session cleared' };
    }
  },

  // Check if session is valid
  checkSession: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      
      console.log('Session check response:', response.data);
      
      if (response.data && response.data.message && response.data.message !== 'Guest') {
        return { 
          authenticated: true, 
          user: response.data.message 
        };
      } else {
        // User is guest, clear local storage
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        return { authenticated: false, error: 'User is Guest' };
      }
    } catch (error) {
      console.error('Session check failed:', error);
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

  // Get user info
  getUserInfo: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
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

  createLead: async (leadData: Record<string, unknown>) => {
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

  updateLead: async (leadId: string, leadData: Record<string, unknown>) => {
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