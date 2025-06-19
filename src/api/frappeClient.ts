/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/frappeClient.ts
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment 
  ? '' // Use relative URLs in development to leverage Vite proxy
  : ''; // Direct URL for production

// Create axios instance with default config
const frappeClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 15000,
  withCredentials: true, // This is crucial for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    // In development, ensure we're using the proxy
    if (isDevelopment && config.url && !config.url.startsWith('/api')) {
      console.log('Making request via Vite proxy:', config.url);
    }
    
    // Don't manually set browser-controlled headers
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
      if (response.headers['set-cookie']) {
        console.log('Cookies received:', response.headers['set-cookie']);
      }
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

  // Enhanced login with better session handling
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
      console.log('Response headers:', response.headers);
      
      // Check for successful login
      if (response.data.message === 'Logged In' || response.status === 200) {
        const userData = {
          username: username,
          full_name: response.data.full_name || response.data.user || 'User',
          authenticated: true,
          loginTime: Date.now()
        };
        
        // Store user data
        localStorage.setItem('frappe_user', JSON.stringify(userData));
        
        // For production builds, we need to handle session differently
        // since cookies might not work across domains
        // if (!isDevelopment) {
        //   // Try to get an API key or session token if available
        //   try {
        //     const sessionResponse = await frappeClient.get('/api/method/frappe.sessions.get_csrf_token');
        //     if (sessionResponse.data && sessionResponse.data.message) {
        //       localStorage.setItem('frappe_csrf_token', sessionResponse.data.message);
        //     }
        //   } catch (csrfError) {
        //     console.warn('Could not get CSRF token:', csrfError);
        //   }
        // }
        
        return { success: true, data: response.data, user: userData };
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
      localStorage.removeItem('frappe_csrf_token');
      return { success: true, data: response.data };
    } catch (error) {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      localStorage.removeItem('frappe_csrf_token');
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed but local session cleared' };
    }
  },

  // Simplified session check that doesn't rely on cookies for production
  checkSession: async () => {
    try {
      // First check if we have stored user data
      const storedUser = localStorage.getItem('frappe_user');
      if (!storedUser) {
        return { authenticated: false, error: 'No stored user data' };
      }

      let userData;
      try {
        userData = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('frappe_user');
        return { authenticated: false, error: 'Invalid stored user data' };
      }


        try {
          const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
          if (response.data && response.data.message && response.data.message !== 'Guest') {
            return { authenticated: true, user: response.data.message };
          }
        } catch (error) {
          console.warn('Session verification failed in development:', error);
          // Fall back to stored data
        
      }

      // For production or if server check fails, rely on stored data with time check
      const loginTime = userData.loginTime || 0;
      const now = Date.now();
      const sessionAge = now - loginTime;
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxSessionAge) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_csrf_token');
        return { authenticated: false, error: 'Session expired' };
      }

      return { authenticated: true, user: userData.username };
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
      localStorage.removeItem('frappe_csrf_token');
      return { 
        authenticated: false, 
        error: axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error as Error).message 
      };
    }
  },

  // Get user info with fallback to stored data
  getUserInfo: async () => {
    try {
      // Try server first if in development
      
        const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
        return response.data;
      
      
      // For production, return stored user info
      // const storedUser = localStorage.getItem('frappe_user');
      // if (storedUser) {
      //   const userData = JSON.parse(storedUser);
      //   return { message: userData.username, full_name: userData.full_name };
      // }
      
      throw new Error('No user information available');
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        localStorage.removeItem('frappe_csrf_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  // Enhanced API methods with better error handling
  makeAuthenticatedRequest: async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any) => {
    try {
      const config: any = { method, url };
      
      // Add CSRF token if available
      const csrfToken = localStorage.getItem('frappe_csrf_token');
      if (csrfToken) {
        config.headers = { 'X-Frappe-CSRF-Token': csrfToken };
      }
      
      if (data) {
        config.data = data;
      }
      
      const response = await frappeClient(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_session');
        localStorage.removeItem('frappe_csrf_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  // Lead operations using the enhanced request method
  getAllLeads: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Lead');
  },

  getLeadById: async (leadId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Lead/${leadId}`);
  },

  createLead: async (leadData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Lead', leadData);
  },

  updateLead: async (leadId: string, leadData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Lead/${leadId}`, leadData);
  }
};

export default frappeClient;