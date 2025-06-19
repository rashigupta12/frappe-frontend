// src/api/frappeClient.ts - Token-based Authentication
import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment 
  ? '' 
  : 'https://eits.thebigocommunity.org';

// Create axios instance for cookie-based requests (login/logout)
const frappeClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Create axios instance for token-based requests
const frappeTokenClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Token interceptor
frappeTokenClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('frappe_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptors
[frappeClient, frappeTokenClient].forEach(client => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
      }
      return Promise.reject(error);
    }
  );
});

export const frappeAPI = {
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

  // Login and get session token
  login: async (username: string, password: string) => {
    try {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_token');
      
      console.log('Attempting login for:', username);
      
      // Step 1: Login with cookies
      const loginResponse = await frappeClient.post('/api/method/login', {
        usr: username,
        pwd: password
      });
      
      console.log('Login response:', loginResponse.data);
      
      if (loginResponse.data.message === 'Logged In') {
        try {
          // Step 2: Generate API key/secret for token auth
          const keyResponse = await frappeClient.post('/api/method/frappe.core.doctype.user.user.generate_keys', {
            user: username
          });
          
          console.log('Key generation response:', keyResponse.data);
          
          if (keyResponse.data.message) {
            const { api_key, api_secret } = keyResponse.data.message;
            const token = `${api_key}:${api_secret}`;
            
            // Store token and user data
            localStorage.setItem('frappe_token', token);
            const userData = {
              username: username,
              full_name: loginResponse.data.full_name || 'User',
              authenticated: true,
              loginTime: Date.now(),
              api_key: api_key
            };
            localStorage.setItem('frappe_user', JSON.stringify(userData));
            
            // Step 3: Test token authentication
            const testResponse = await frappeTokenClient.get('/api/method/frappe.auth.get_logged_user');
            console.log('Token test response:', testResponse.data);
            
            return { success: true, data: loginResponse.data, user: userData };
          }
        } catch (keyError) {
          console.error('Key generation failed:', keyError);
          // Fallback to cookie-based auth
          const userData = {
            username: username,
            full_name: loginResponse.data.full_name || 'User',
            authenticated: true,
            loginTime: Date.now(),
            authType: 'cookie'
          };
          localStorage.setItem('frappe_user', JSON.stringify(userData));
          return { success: true, data: loginResponse.data, user: userData };
        }
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 
                           `Login failed: ${error.response?.status} ${error.response?.statusText}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  logout: async () => {
    try {
      // Try to logout from server
      await frappeClient.post('/api/method/logout');
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_token');
    }
    return { success: true };
  },

  checkSession: async () => {
    const token = localStorage.getItem('frappe_token');
    const userData = localStorage.getItem('frappe_user');
    
    if (!token && !userData) {
      return { authenticated: false, error: 'No session data' };
    }
    
    try {
      let response;
      if (token) {
        // Use token authentication
        response = await frappeTokenClient.get('/api/method/frappe.auth.get_logged_user');
      } else {
        // Fallback to cookie authentication
        response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      }
      
      if (response.data && response.data.message && response.data.message !== 'Guest') {
        return { authenticated: true, user: response.data.message };
      } else {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        return { authenticated: false, error: 'User is Guest' };
      }
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_token');
      return { 
        authenticated: false, 
        error: axios.isAxiosError(error) ? (error.response?.data?.message || error.message) : (error as Error).message 
      };
    }
  },

  // Helper method to get the appropriate client
  getClient: () => {
    const token = localStorage.getItem('frappe_token');
    return token ? frappeTokenClient : frappeClient;
  },

  getUserInfo: async () => {
    try {
      const client = frappeAPI.getClient();
      const response = await client.get('/api/method/frappe.auth.get_logged_user');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  getAllLeads: async () => {
    try {
      const client = frappeAPI.getClient();
      const response = await client.get('/api/resource/Lead');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  getLeadById: async (leadId: string) => {
    try {
      const client = frappeAPI.getClient();
      const response = await client.get(`/api/resource/Lead/${leadId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  createLead: async (leadData: Record<string, unknown>) => {
    try {
      const client = frappeAPI.getClient();
      const response = await client.post('/api/resource/Lead', leadData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  },

  updateLead: async (leadId: string, leadData: Record<string, unknown>) => {
    try {
      const client = frappeAPI.getClient();
      const response = await client.put(`/api/resource/Lead/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
        localStorage.removeItem('frappe_user');
        localStorage.removeItem('frappe_token');
        throw new Error('Session expired. Please login again.');
      }
      throw error;
    }
  }
};

export default frappeClient;