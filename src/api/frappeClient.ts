/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/frappeClient.ts
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;
const FRAPPE_BASE_URL = isDevelopment
  ? '' // Use relative URLs in development to leverage Vite proxy
  : ''; // Use relative URLs in production to leverage Vercel rewrite

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



const frappeFileClient = axios.create({
  baseURL: FRAPPE_BASE_URL,
  timeout: 30000, // Longer timeout for file uploads
  withCredentials: true,
  headers: {
    // Don't set Content-Type for multipart - let browser handle it
  }
});


// Add request interceptor for file client
frappeFileClient.interceptors.request.use(
  (config) => {
    // Log file upload requests
    console.log('Making file upload request:', config.method?.toUpperCase(), config.url);

    // Don't manually set browser-controlled headers
    delete config.headers['Origin'];
    delete config.headers['Referer'];

    // Ensure Content-Type is not set for FormData (let browser handle it)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

frappeFileClient.interceptors.response.use(
  (response) => {
    console.log('File Upload Response:', response.status, response.config.url);
    if (response.headers['set-cookie']) {
      console.log('Cookies received:', response.headers['set-cookie']);
    }
    return response;
  },
  (error) => {
    console.error('File Upload Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      data: error.response?.data,
      requestData: error.config?.data instanceof FormData ? 'FormData object' : error.config?.data
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_session');
    }
    return Promise.reject(error);
  }
);
// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    // Log requests for debugging
    // console.log('Making request:', config.method?.toUpperCase(), config.url);

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
    // Log successful responses
    console.log('API Response:', response.status, response.config.url);
    if (response.headers['set-cookie']) {
      console.log('Cookies received:', response.headers['set-cookie']);
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

// Rest of your frappeAPI methods remain the same...
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

      // Check for successful login
      if (response.data.message === 'Logged In' || response.status === 200) {
        console.log('Login successful for:', response.data);
        const userData = {
          username: username,
          full_name: response.data.full_name || response.data.user || 'User',
          authenticated: true,
          loginTime: Date.now()
        };

        // Store user data
        localStorage.setItem('frappe_user', JSON.stringify(userData));

        return { success: true, data: response.data, user: userData };
      }

      return { success: false, data: response.data, error: 'Login failed' };
    } catch (error) {
      console.error('Login error details:', error);

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

  // ... rest of your methods remain the same
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
        console.warn('Session verification failed:', error);
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

  getUserInfo: async () => {
    try {
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
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

  makeAuthenticatedRequest: async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any) => {
    try {
      const config: any = { method, url };

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
  getJobTypes: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/JobType');
  },
  getProjectUrgency: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/ProjectUrgency');
  },

  getAllLeads: async (email: string) => {

    // return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Lead?order_by=creation%20desc');
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Lead?filters=[["lead_owner", "=", "${email}"]]&order_by=creation%20desc`);
  },

  getLeadById: async (leadId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Lead/${leadId}`);
  },

  createLead: async (leadData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Lead', leadData);
  },

  updateLead: async (leadId: string, leadData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Lead/${leadId}`, leadData);
  },
  updateLeadStatus:async(LeaId: string, status: string)=>{
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Lead/${LeaId}`, { status });
  },
  ispectionUser: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/User`);
  },
  toDo: async (todoData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/ToDo', todoData);
  },
  getAllToDos: async (filters: Record<string, unknown> = {}) => {
    const filterString = Object.entries(filters)
      .map(([key, value]) => `["${key}", "=", "${value}"]`)
      .join(',');
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/ToDo?filters=[${filterString}]&order_by=creation%20desc`);
  },
  getTodoByNAme: async (todoName: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/ToDo/${todoName}`);
  },

  getTodoByFilters: async (filters: Record<string, unknown> = {}) => {
    const filterString = Object.entries(filters)
      .map(([key, value]) => `["${key}", "=", "${value}"]`)
      .join(',');
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/ToDo?filters=[${filterString}]`);
  },
  updateTodoStatus: async (todoId: string, status: string) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/ToDo/${todoId}`, { status });
  },

  createInspection: async (inspectionData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/SiteInspection', inspectionData);
  },

  getInspectionDetails: async (inspectionName: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/SiteInspection/${inspectionName}`);
  },
  getAllInspections: async (filters: Record<string, unknown> = {}) => {
    // Convert filters to Frappe/ERPNext format
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/SiteInspection?filters=${filterString}&order_by=creation%20aesc`
    );
  },
  UpdateInspection: async (inspectionName: string, inspectionData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/SiteInspection/${inspectionName}`, inspectionData);
  },

  GetUtmSoucre: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/UTM Source');
  },
  getEmirate: async( ) =>{
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/UAE Emirate');
  },
  getCity: async (filters: Record<string, unknown> = {}) => {
    // Convert filters to Frappe/ERPNext format
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/UAE City?filters=${filterString}`
    );
  },
  getArea: async (filters: Record<string, unknown> = {}) => {
    // Convert filters to Frappe/ERPNext format
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/UAE Area?filters=${filterString}`
    );
  },
  upload: async (file: File, options: {
    is_private?: boolean;
    folder?: string;
    doctype?: string;
    docname?: string;
    method?: string;
  } = {}) => {
    // Validate file first
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file object');
    }

    const formData = new FormData();

    // Add the file with proper naming (matching Frappe's expectation)
    formData.append("file", file, file.name);

    // Add required Frappe parameters (matching the official implementation)
    formData.append('is_private', options.is_private ? '1' : '0');
    formData.append('folder', options.folder || 'Home');

    // Optional parameters
    if (options.doctype) {
      formData.append('doctype', options.doctype);
    }
    if (options.docname) {
      formData.append('docname', options.docname);
    }
    if (options.method) {
      formData.append('method', options.method);
    }

    console.log('📦 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('📦 Upload options:', options);

    try {
      const response = await frappeFileClient.post('/api/method/upload_file', formData, {
        timeout: 30000,
        // Important: Don't set Content-Type header - let axios handle it
        headers: {
          // Remove any Content-Type header to let browser set multipart boundary
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📈 Upload progress: ${percentCompleted}%`);
          }
        }
      });

      console.log('✅ Upload successful!');
      console.log('📊 Response status:', response.status);
      console.log('📄 Response data:', response.data);

      return {
        success: true,
        data: response.data,
        file_url: response.data.message?.file_url || response.data.file_url,
        file_name: response.data.message?.file_name || response.data.file_name
      };

    } catch (error) {
      console.error('❌ Upload failed!');
      console.error('🔍 Error details:', error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.exc ||
          error.message;
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        };

        console.error('📊 Error status:', error.response?.status);
        console.error('📄 Error response:', error.response?.data);

        return {
          success: false,
          error: errorMessage,
          details: errorDetails
        };
      }

      return {
        success: false,
        error: (error as Error).message,
        details: error
      };
    }
  }


};

export default frappeClient;