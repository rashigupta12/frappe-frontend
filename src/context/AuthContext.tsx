/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { frappeAPI } from '../api/frappeClient';

interface AuthUser {
  requiresPasswordReset: any;
  username: string;
  full_name: string;
  role: string;
  email?: string;
  roles?: string[]; // Array of all roles from Frappe
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
    requiresPasswordReset?: boolean;
  }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  resetPassword?: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  role: string | null;
  hasRole: (roleToCheck: string) => boolean;
  hasAnyRole: (rolesToCheck: string[]) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshAuth: async () => {},
  clearError: () => {},
  loading: false,
  error: null,
  isAuthenticated: false,
  role: null,
  hasRole: () => false,
  hasAnyRole: () => false,
  canAccess: () => false,
});

// Enhanced role mapping function
// In your AuthContext.tsx - Fix the mapUserToRole function

const mapUserToRole = (username: string, fullName: string, frappeRoles?: any[]): string => {
  // First check if user has specific Frappe roles
  if (frappeRoles && Array.isArray(frappeRoles)) {
    const roleNames = frappeRoles.map(r => r.role || r).filter(Boolean);
    
    // Priority mapping from Frappe roles - FIXED MAPPING
    const frappeRoleMap: Record<string, string> = {
      'EITS_Sale_Representative': 'EITS_Sale_Representative',
      'EITS_Site_Inspector': 'EITS_Site_Inspector',
      'EITS_Project_Manager': 'EITS_Project_Manager', // ✅ FIXED: Keep as EITS_Project_Manager
      'System Manager': 'admin',
      'Administrator': 'admin',
      'Sales User': 'EITS_Sale_Representative',
      'Sales Manager': 'EITS_Sale_Representative',
      'Quality Manager': 'EITS_Site_Inspector',
      'Quality Inspector': 'EITS_Site_Inspector',
      'Site Inspector': 'EITS_Site_Inspector',
      'Projects Manager': 'EITS_Project_Manager', // ✅ FIXED: Map to EITS_Project_Manager
      'Projects User': 'EITS_Project_Manager',     // ✅ FIXED: Map to EITS_Project_Manager
      'Accounts Manager': 'accountUser',
      'Accounts User': 'accountUser',
      'Website Manager': 'user',
      'Desk User': 'user'
    };
    
    // Check for exact Frappe role matches (highest priority)
    for (const roleName of roleNames) {
      if (frappeRoleMap[roleName]) {
        return frappeRoleMap[roleName];
      }
    }
    
    // Check for partial matches in Frappe roles
    for (const roleName of roleNames) {
      const lowerRole = roleName.toLowerCase();
      if (lowerRole.includes('sale') || lowerRole.includes('sales')) {
        return 'EITS_Sale_Representative';
      }
      if (lowerRole.includes('admin') || lowerRole.includes('system manager')) {
        return 'admin';
      }
      if (lowerRole.includes('inspector') || lowerRole.includes('quality') || lowerRole.includes('site')) {
        return 'EITS_Site_Inspector';
      }
      if (lowerRole.includes('project') || lowerRole.includes('manager')) {
        return 'EITS_Project_Manager'; // ✅ FIXED: Return EITS_Project_Manager
      }
      if (lowerRole.includes('account') || lowerRole.includes('finance')) {
        return 'accountUser';
      }
    }
  }
  
  // Then try to map from full_name if it exists
  if (fullName && fullName.trim() !== '') {
    const roleMap: Record<string, string> = {
      'Sales': 'EITS_Sale_Representative',
      'sales': 'EITS_Sale_Representative',
      'Sales Rep': 'EITS_Sale_Representative',
      'Sales Representative': 'EITS_Sale_Representative',
      'User': 'user',
      'Admin': 'admin',
      'Administrator': 'admin',
      'Customer': 'user',
      'Client': 'user',
      'Inspector': 'EITS_Site_Inspector',
      'Site Inspector': 'EITS_Site_Inspector',
      'Quality Inspector': 'EITS_Site_Inspector',
      'Field Inspector': 'EITS_Site_Inspector',
      'Project': 'EITS_Project_Manager',      // ✅ FIXED
      'Project Manager': 'EITS_Project_Manager', // ✅ FIXED
      'PM': 'EITS_Project_Manager',             // ✅ FIXED
      'Account User': 'accountUser',
      'Account': 'accountUser',
      'Accountant': 'accountUser',
      'Finance': 'accountUser',
      'Finance User': 'accountUser',
    };
    
    // Direct match first
    if (roleMap[fullName]) {
      return roleMap[fullName];
    }
    
    // Try case-insensitive match
    const normalizedName = fullName.toLowerCase();
    for (const [key, value] of Object.entries(roleMap)) {
      if (key.toLowerCase() === normalizedName) {
        return value;
      }
    }
    
    // Try partial match
    if (normalizedName.includes('sales') || normalizedName.includes('sale')) {
      return 'EITS_Sale_Representative';
    }
    if (normalizedName.includes('admin')) return 'admin';
    if (normalizedName.includes('inspector')) return 'EITS_Site_Inspector';
    if (normalizedName.includes('project') || normalizedName.includes('manager')) {
      return 'EITS_Project_Manager'; // ✅ FIXED
    }
    if (normalizedName.includes('account') || normalizedName.includes('finance')) {
      return 'accountUser';
    }
  }
  
  // Enhanced username-based mapping
  const usernameToRoleMap: Record<string, string> = {
    // Exact username matches
    'sales_rep@eits.com': 'EITS_Sale_Representative',
    'sales@eits.com': 'EITS_Sale_Representative',
    'sales': 'EITS_Sale_Representative',
    'admin@eits.com': 'admin',
    'admin': 'admin',
    'user@eits.com': 'user',
    'user': 'user',
    'site_inspector@eits.com': 'EITS_Site_Inspector',
    'quality_inspector@eits.com': 'EITS_Site_Inspector',
    'field_inspector@eits.com': 'EITS_Site_Inspector',
    'inspector@eits.com': 'EITS_Site_Inspector',
    'inspector': 'EITS_Site_Inspector',
    'project_manager@eits.com': 'EITS_Project_Manager',      // ✅ FIXED
    'pm@eits.com': 'EITS_Project_Manager',                   // ✅ FIXED
    'project_manager': 'EITS_Project_Manager',               // ✅ FIXED
    'account@eits.com': 'accountUser',
    'accountant@eits.com': 'accountUser',
    'finance@eits.com': 'accountUser',
    'account_user@eits.com': 'accountUser',
    'account': 'accountUser',
    'eits_project_manager@eits.com': 'EITS_Project_Manager', // ✅ FIXED
    'projectmanager@eits.com': 'EITS_Project_Manager',       // ✅ FIXED
    'supervisortest@eits.com': 'EITS_Project_Manager'        // ✅ ADDED: Specific for your test user
  };
  
  // Try exact username match first
  if (usernameToRoleMap[username]) {
    return usernameToRoleMap[username];
  }
  
  // Try pattern matching on username
  const lowerUsername = username.toLowerCase();
  
  if (lowerUsername.includes('sales') || lowerUsername.includes('sale')) {
    return 'EITS_Sale_Representative';
  }
  
  if (lowerUsername.includes('admin')) {
    return 'admin';
  }
  
  if (lowerUsername.includes('inspector') || lowerUsername.includes('inspection')) {
    return 'EITS_Site_Inspector';
  }
  
  if (lowerUsername.includes('project') || lowerUsername.includes('pm') || 
      lowerUsername.includes('manager') || lowerUsername.includes('supervisor')) { // ✅ ADDED supervisor
    return 'EITS_Project_Manager'; // ✅ FIXED
  }
  
  if (lowerUsername.includes('account') || lowerUsername.includes('finance')) {
    return 'accountUser';
  }
  
  // Default fallback
  return 'user';
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

// In your AuthContext.tsx
const checkAuthStatus = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const sessionCheck = await frappeAPI.checkSession();
    console.log('Session Check Result:', sessionCheck);
    
    if (sessionCheck.authenticated) {
      const username = sessionCheck.user?.username || sessionCheck.user || '';
      const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
      const email = sessionCheck.user?.email || username;
      const frappeRoles = sessionCheck.user?.roles || [];
      const requiresPasswordReset = sessionCheck.user?.requiresPasswordReset || false;
      
      // If password reset is required, don't set the user and redirect to reset page
      if (requiresPasswordReset) {
        return {
          authenticated: false,
          requiresPasswordReset: true
        };
      }
      
      const roleNames = frappeRoles.map((r: any) => r.role || r).filter(Boolean);
      const mappedRole = mapUserToRole(username, fullName, frappeRoles);
      
      const userData: AuthUser = {
        username: username,
        full_name: fullName,
        email: email,
        role: mappedRole,
        roles: roleNames,
        requiresPasswordReset: undefined
      };
      
      setUser(userData);
      return { authenticated: true, user: userData };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false, error: 'Authentication check failed' };
  } finally {
    setLoading(false);
  }
};

// In your AuthContext.tsx
const login = async (username: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await frappeAPI.login(username, password);
    
    if (response.success && response.user) {
      const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
      
      const userData: AuthUser = {
        username: username,
        full_name: response.user.full_name || username.split('@')[0] || 'User',
        email: response.user.email || username,
        role: mapUserToRole(username, response.user.full_name || '', response.user.roles || []),
        roles: response.user.roles || [],
        requiresPasswordReset: firstLoginCheck.requiresPasswordReset || false
      };

      console.log('User data after login:', userData);
      setUser(userData);
      
      return { 
        success: true, 
        user: userData,
        requiresPasswordReset: firstLoginCheck.requiresPasswordReset
      };
    }
    
    return { 
      success: false, 
      error: response.error || 'Login failed' 
    };
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
};

  const resetPassword = async (username: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await frappeAPI.resetFirstTimePassword(username, newPassword);
      
      if (result.success) {
        // After successful password reset, log the user in normally
        const userDetails = await frappeAPI.getUserDetails(username);
        
        const userData: AuthUser = {
          username: username,
          full_name: userDetails.data?.full_name || username.split('@')[0] || 'User',
          email: userDetails.data?.email || username,
          role: mapUserToRole(username, userDetails.data?.full_name || '', userDetails.data?.roles || []),
          roles: userDetails.data?.roles?.map((r: any) => r.role || r) || [],
          requiresPasswordReset: undefined
        };

        setUser(userData);
        return { success: true };
      } else {
        setError(result.error || 'Password reset failed');
        return { success: false, error: result.error || 'Password reset failed' };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await frappeAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const clearError = () => {
    setError(null);
  };

  const hasRole = (roleToCheck: string): boolean => {
    if (!user) return false;
    return user.role === roleToCheck || (Array.isArray(user.roles) && user.roles.includes(roleToCheck));
  };

  const hasAnyRole = (rolesToCheck: string[]): boolean => {
    if (!user || !rolesToCheck.length) return false;
    return rolesToCheck.some(role => hasRole(role));
  };

  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!user || !user.role) return false;
    
    // Import and use the permission system
    try {
      const { hasPermission } = require('../middleware/roleMiddleware');
      return hasPermission(user.role as any, resource as any, action as any);
    } catch {
      // Fallback if middleware not available
      return user.role === 'admin';
    }
  };

  const value = {
    user,
    login,
    logout,
    refreshAuth,
    clearError,
    resetPassword,
    loading,
    error,
    isAuthenticated: !!user,
    role: user?.role || null,
    hasRole,
    hasAnyRole,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};