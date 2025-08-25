/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/frappeClient.ts
import axios from 'axios';

// Use different base URLs for development and production
const isDevelopment = import.meta.env.DEV;

// For local development with different hosts, use direct API URL
// For production, use relative URLs to leverage Vercel rewrites
const FRAPPE_BASE_URL = isDevelopment
  ? '' // Use proxy in development (handled by Vite)
  : ''; // Use relative URLs in production (handled by Vercel rewrites)

console.log('Environment:', {
  isDevelopment,
  mode: import.meta.env.MODE,
  baseURL: FRAPPE_BASE_URL
});

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
    console.log('File upload request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });

    // For development, add CORS headers
    if (isDevelopment) {
      config.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }

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
    console.log('File upload response:', {
      status: response.status,
      url: response.config.url
    });
    
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
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Add request interceptor
frappeClient.interceptors.request.use(
  (config) => {
    console.log('API request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });

    // For development, add CORS headers
    if (isDevelopment) {
      config.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
      config.headers['Access-Control-Allow-Credentials'] = 'true';
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
    console.log('API response:', {
      status: response.status,
      url: response.config.url
    });
    
    // Log successful responses
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
      
      // Optionally redirect to login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const frappeAPI = {
  // Get user details from Frappe
  getUserDetails: async (username: string) => {
    try {
      const response = await frappeClient.get(`/api/resource/User/${username}`);
      console.log('User details response:', response.data);
      
      return {
        success: true,
        data: response.data.data,
        roles: response.data.data.roles || []
      };
    } catch (error) {
      console.error('Error fetching user details:', error);
      return {
        success: false,
        error: axios.isAxiosError(error) ? 
          (error.response?.data?.message || error.message) : 
          (error as Error).message
      };
    }
  },

  // // Check if user needs to reset password on first login
  // checkFirstLogin: async (username: string) => {
  //   try {
  //     const response = await frappeClient.get(`/api/method/check_first_login?username=${username}`);
  //     return {
  //       success: true,
  //       requiresPasswordReset: response.data.message?.requires_password_reset || false
  //     };
  //   } catch (error) {
  //     console.error('Error checking first login:', error);
  //     return {
  //       success: false,
  //       requiresPasswordReset: false
  //     };
  //   }
  // },

  login: async (username: string, password: string) => {
    try {
      const response = await frappeClient.post('/api/method/login', {
        usr: username,
        pwd: password
      });

      // Check for successful login
      if (response.data.message === 'Logged In' || response.status === 200) {
        // First check if this is a first-time login
        const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
        
        // Fetch user details after successful login - CRITICAL!
        const userDetails = await frappeAPI.getUserDetails(username);
        console.log('Login - user details:', userDetails);
        
        const userData = {
          username: username,
          full_name: userDetails.data?.full_name || username.split('@')[0] || 'User',
          email: userDetails.data?.email || username,
          role: userDetails.data?.role || '',
          roles: userDetails.data?.roles || [],
          authenticated: true,
          loginTime: Date.now(),
          requiresPasswordReset: firstLoginCheck.requiresPasswordReset || false
        };

        // Store user data
        localStorage.setItem('frappe_user', JSON.stringify(userData));

        return { 
          success: true, 
          data: response.data, 
          user: userData,
          details: userDetails.data,
          requiresPasswordReset: firstLoginCheck.requiresPasswordReset
        };
      }

      return { 
        success: false, 
        data: response.data, 
        error: response.data.message || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error details:', error);

      let errorMessage = 'Login failed';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message ||
          error.response?.data?.exc ||
          `Login failed: ${error.response?.status} ${error.response?.statusText}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },

// Improved checkFirstLogin method
checkFirstLogin: async (username: string) => {
  try {
    // First check User Settings
    const response = await frappeClient.get(
      `/api/resource/User Settings?filters=[["user","=","${username}"]]&fields=["user","first_password"]`
    );
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const userSettings = response.data.data[0];
      const requiresPasswordReset = userSettings.first_password === 1;
      
      console.log('First login check:', {
        username,
        first_password: userSettings.first_password,
        requiresPasswordReset
      });
      
      return {
        success: true,
        requiresPasswordReset,
        userSettings
      };
    }
    
    // If no user settings found, try checking the user's last_login
    const userResponse = await frappeClient.get(
      `/api/resource/User/${username}?fields=["last_login"]`
    );
    
    if (userResponse.data && userResponse.data.data) {
      const requiresPasswordReset = !userResponse.data.data.last_login;
      
      return {
        success: true,
        requiresPasswordReset,
        lastLogin: userResponse.data.data.last_login
      };
    }
    
    // Default case - assume not first login
    return {
      success: true,
      requiresPasswordReset: false
    };
  } catch (error) {
    console.error('Error checking first login:', error);
    
    let errorMessage = 'Error checking first login status';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      requiresPasswordReset: false,
      error: errorMessage
    };
  }
},

// Robust resetFirstTimePassword method
resetFirstTimePassword: async (username: string, newPassword: string) => {
  try {
    // Validate password strength
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Step 1: Update the user's password
    const passwordUpdateResponse = await frappeClient.put(
      `/api/resource/User/${encodeURIComponent(username)}`,
      {
        new_password: newPassword
      }
    );

    if (passwordUpdateResponse.status !== 200) {
      throw new Error('Failed to update password');
    }

    // Step 2: Update the first_password flag to 0
    try {
      const flagUpdateResponse = await frappeClient.put(
        `/api/resource/User Settings/${encodeURIComponent(username)}`,
        {
          first_password: 0
        }
      );

      console.log('Password reset successful:', {
        username,
        passwordUpdate: passwordUpdateResponse.status,
        flagUpdate: flagUpdateResponse.status
      });

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (flagError) {
      console.warn('Password updated but failed to update flag:', flagError);
      // Password was updated successfully, but flag update failed
      // This is still considered a success since the password was changed
      return {
        success: true,
        message: 'Password updated successfully',
        warning: 'Flag update failed but password was changed'
      };
    }
  } catch (error) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Password reset failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
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

 // Fixed checkSession function
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
      // Verify session with Frappe
      const response = await frappeClient.get('/api/method/frappe.auth.get_logged_user');
      
      if (response.data && response.data.message && response.data.message !== 'Guest') {
        // Fetch fresh user details - THIS IS KEY!
        const userDetails = await frappeAPI.getUserDetails(response.data.message);
        console.log('Fresh user details:', userDetails); // Add debugging
        
        const updatedUserData = {
          ...userData,
          full_name: userDetails.data?.full_name || userData.full_name,
          email: userDetails.data?.email || userData.email,
          role: userDetails.data?.role || userData.role,
          roles: userDetails.data?.roles || userData.roles || [] // Make sure roles are included
        };

        // Update stored user data
        localStorage.setItem('frappe_user', JSON.stringify(updatedUserData));

        return { 
          authenticated: true, 
          user: updatedUserData,
          details: userDetails.data // Return full details including roles
        };
      }
    } catch (error) {
      console.warn('Session verification failed:', error);
    }

    // Fallback to stored data with time check
    const loginTime = userData.loginTime || 0;
    const now = Date.now();
    const sessionAge = now - loginTime;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxSessionAge) {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_csrf_token');
      return { authenticated: false, error: 'Session expired' };
    }

    // For fallback, try to get fresh user details
    try {
      const userDetails = await frappeAPI.getUserDetails(userData.username);
      return { 
        authenticated: true, 
        user: userData,
        details: userDetails.data // Include details with roles
      };
    } catch {
      return { authenticated: true, user: userData };
    }
  } catch (error) {
    console.error('Session check failed:', error);
    localStorage.removeItem('frappe_user');
    localStorage.removeItem('frappe_session');
    localStorage.removeItem('frappe_csrf_token');
    return {
      authenticated: false,
      error: axios.isAxiosError(error) ? 
        (error.response?.data?.message || error.message) : 
        (error as Error).message
    };
  }
},

  // Get user roles
  getUserRoles: async (username: string) => {
    try {
      const response = await frappeClient.get(`/api/resource/User/${username}?fields=["roles"]`);
      return {
        success: true,
        roles: response.data.data.roles || []
      };
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return {
        success: false,
        error: axios.isAxiosError(error) ? 
          (error.response?.data?.message || error.message) : 
          (error as Error).message,
        roles: []
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

  // Add this to your frappeAPI object
  get: async (url: string, config?: any) => {
    try {
      const response = await frappeClient.get(url, config);
      return response;
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

  // ... rest of your API methods remain the same
  getJobTypes: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/JobType');
  },
  getProjectUrgency: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/ProjectUrgency');
  },

  getAllLeads: async (email: string) => {
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
  updateLeadStatus: async (LeaId: string, status: string) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Lead/${LeaId}`, { status });
  },
  ispectionUser: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/User?filters=[["Has Role","role","=","EITS_Site_Inspector"]]`);
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
  updateTodo: async (todoId: string, todoData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/ToDo/${todoId}`, todoData);
  },

  createInspection: async (inspectionData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/SiteInspection', inspectionData);
  },

  getInspectionDetails: async (inspectionName: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/SiteInspection/${inspectionName}`);
  },
  getAllInspections: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/SiteInspection?filters=${filterString}&order_by=creation%20desc`
    );
  },
  UpdateInspection: async (inspectionName: string, inspectionData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/SiteInspection/${inspectionName}`, inspectionData);
  },

  GetUtmSoucre: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Lead Source');
  },
  getEmirate: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/UAE Emirate');
  },
  getCity: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/UAE City?filters=${filterString}`
    );
  },
  getArea: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/UAE Area?filters=${filterString}`
    );
  },
  createArea: async (areaData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/UAE Area', areaData);
  },
  //  getAllJobCards: async (filters: Record<string, unknown> = {}) => {
  //   const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
  //   const filterString = encodeURIComponent(JSON.stringify(filterArray));
  //   return await frappeAPI.makeAuthenticatedRequest(
  //     'GET', 
  //     `/api/resource/Job Card -Veneer Pressing${filterArray.length ? `?filters=${filterString}` : ''}?order_by=creation%20desc`
  //   );
  // },
  getAllJobCards: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);

    const params = new URLSearchParams();

    // Add filters if they exist
    if (filterArray.length > 0) {
      params.append('filters', JSON.stringify(filterArray));
    }

    // Add ordering - keep it simple
    params.append('order_by', 'creation desc');

    const url = `/api/resource/Job Card -Veneer Pressing?${params.toString()}`;

    return await frappeAPI.makeAuthenticatedRequest('GET', url);
  },



  getJobCardById: async (jobCardId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Job Card -Veneer Pressing/${jobCardId}`);
  },

  // createJobCard: async (jobCardData: Record<string, unknown>) => {
  //   return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Job Card -Veneer Pressing', jobCardData);
  // },
  createJobCard: async (jobCardData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Job Card -Veneer Pressing', jobCardData);
  },


  updateJobCard: async (jobCardId: string, jobCardData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Job Card -Veneer Pressing/${jobCardId}`, jobCardData);
  },

  deleteJobCard: async (jobCardId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('DELETE', `/api/resource/Job Card -Veneer Pressing/${jobCardId}`);
  },
  getEmployees: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&order_by=employee_name');
  },
 

  // getPaymentbyId: async () => {
  //   return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&order_by=employee_name');
  // },



  getcustomer: async (searchParams: {
    mobile_no?: string;
    email_id?: string;
    customer_name?: string;
  }) => {
    // Build the or_filters array based on provided search parameters
    const orFilters = [];

    if (searchParams.mobile_no) {
      orFilters.push(['mobile_no', '=', searchParams.mobile_no]);
    }

    if (searchParams.email_id) {
      orFilters.push(['email_id', '=', searchParams.email_id]);
    }

    if (searchParams.customer_name) {
      orFilters.push(['customer_name', '=', searchParams.customer_name]);
    }

    // If no search parameters provided, return empty array or all customers
    if (orFilters.length === 0) {
      return await frappeAPI.makeAuthenticatedRequest('GET', '/api/resource/Customer');
    }

    // Encode the or_filters for URL
    const orFiltersString = encodeURIComponent(JSON.stringify(orFilters));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/Customer?or_filters=${orFiltersString}`
    );
  },
  getCustomerById: async (customerId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Customer/${customerId}`);
  },
  // getItem
  // : async () => {
  //   return await axios.get("/api/resource/Item", {
  //     params: {
  //       filters: JSON.stringify([["item_group", "=", "Veneer Pressing Work"]])
  //     }
  //   });
  // },

  getpressingItem: async () => {
    return await axios.get("/api/resource/Pressing Item/", {
      // params: {
      //   filters: JSON.stringify([["item_group", "=", "Veneer Pressing Work"]]),
      //   // Add the fields parameter to get all required fields
      //   fields: JSON.stringify(["name","item_name","valuation_rate","standard_rate","last_purchase_rate"])
      // }
    });
  },

  getMaterialSoldItems: async () => {
    return await axios.get("/api/resource/other items/", {
      // Add any specific filters or fields if needed
      // params: {
      //   filters: JSON.stringify([["item_group", "=", "Material Sold"]]),
      //   fields: JSON.stringify(["name","item_name","valuation_rate","standard_rate"])
      // }
    });
  },

  // Add separate detail methods if needed:
  getMaterialSoldItemDetails: async (itemName: string) => {
    return await axios.get(`/api/resource/other items/${itemName}`);
  },

  getPressingItemDetails: async (itemName: string) => {
    return await axios.get(`/api/resource/Pressing Item/${itemName}`, {

    });
  },

  getAllJobCardsOther: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);

    const params = new URLSearchParams();

    // Add filters if they exist
    if (filterArray.length > 0) {
      params.append('filters', JSON.stringify(filterArray));
    }

    // Add ordering
    params.append('order_by', 'creation desc');

    const url = `/api/resource/Job Card -Other Services?${params.toString()}`;

    return await frappeAPI.makeAuthenticatedRequest('GET', url);
  },
  getItemById: async (itemName: string) => {
    return await axios.get(`/api/resource/Item/${itemName}`);
  },

  getJobCardOtherById: async (jobCardId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Job Card -Other Services/${jobCardId}`);
  },

  createJobCardOther: async (jobCardData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Job Card -Other Services', jobCardData);
  },

  updateJobCardOther: async (jobCardId: string, jobCardData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Job Card -Other Services/${jobCardId}`, jobCardData);
  },

  deleteJobCardOther: async (jobCardId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('DELETE', `/api/resource/Job Card -Other Services/${jobCardId}`);
  },

  createCustomer: async (customerData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Customer', customerData
    );
  },
 
  

  // Add this to your frappeAPI object
  searchCustomersByPhone: async (mobile_no: string) => {
    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/method/eits_app.customer_search.search_customers?mobile_no=${mobile_no}`
    );
  },
  searchAllCustomers: async () => {
    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/method/eits_app.customer_search.search_customers`
    );
  },


  createPayment: async (paymentData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/EITS Payment', paymentData);
  },
  updatePayment: async (paymentId: string, paymentData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/EITS Payment/${paymentId}`, paymentData);
  },
  deletePayment: async (paymentId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('DELETE', `/api/resource/EITS Payment/${paymentId}`);
  },
  getPaymentbyId: async (paymentId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/EITS Payment/${paymentId}`);
  },
  getReceiptbyId: async (receiptId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Receipt EITS/${receiptId}`);
  },
  getAllPayments: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/EITS Payment?filters=${filterString}&order_by=creation%20asc`
    );
  },

  getPaymentbypaidby: async (paid_by: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/EITS Payment?filters=[["paid_by","=","${paid_by}"]]&order_by=creation%20desc`);
  },
  getSupplier: async () => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Supplier`);
  },
  getSupplierById: async (supplierId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Supplier/${supplierId}`);
  },
  createSupplier: async (supplierData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Supplier', supplierData);
  },
  createReceipt: async (receiptData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Receipt EITS', receiptData);
  },

  updateReceipt: async (receiptId: string, receiptData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Receipt EITS/${receiptId}`, receiptData);
  },
  deleteReceipt: async (receiptId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('DELETE', `/api/resource/Receipt EITS/${receiptId}`);
  },
  getReceiptById: async (receiptId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Receipt EITS/${receiptId}`);
  },
  getAllReceipts: async (filters: Record<string, unknown> = {}) => {
    const filterArray = Object.entries(filters).map(([key, value]) => [key, "=", value]);
    const filterString = encodeURIComponent(JSON.stringify(filterArray));

    return await frappeAPI.makeAuthenticatedRequest(
      'GET',
      `/api/resource/Receipt EITS?filters=${filterString}&order_by=creation%20asc`
    );
  },
  getReceiptByPaidBy: async (paid_by: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Receipt EITS?filters=[["paid_by","=","${paid_by}"]]&order_by=creation%20desc`);
  },

  createFeedback: async (feedbackData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('POST', '/api/resource/Issue', feedbackData);
  },
  editFeedback: async (feedbackId: string, feedbackData: Record<string, unknown>) => {
    return await frappeAPI.makeAuthenticatedRequest('PUT', `/api/resource/Issue/${feedbackId}`, feedbackData);
  },
  getFeedbackByUserId: async (userId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Issue?filters=[["customer","=","${userId}"]]`);
  },
  getFeedbackById: async (feedbackId: string) => {
    return await frappeAPI.makeAuthenticatedRequest('GET', `/api/resource/Issue/${feedbackId}`);
  },
  
  upload: async (file: File, options: {
    is_private?: boolean;
    folder?: string;
    doctype?: string;
    docname?: string;
    method?: string;
  } = {}) => {
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file object');
    }

    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append('is_private', options.is_private ? '1' : '0');
    formData.append('folder', options.folder || 'Home');

    if (options.doctype) {
      formData.append('doctype', options.doctype);
    }
    if (options.docname) {
      formData.append('docname', options.docname);
    }
    if (options.method) {
      formData.append('method', options.method);
    }



    try {
      const response = await frappeFileClient.post('/api/method/upload_file', formData, {
        timeout: 30000,
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


      return {
        success: true,
        data: response.data,
        file_url: response.data.message?.file_url || response.data.file_url,
        file_name: response.data.message?.file_name || response.data.file_name
      };

    } catch (error) {
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