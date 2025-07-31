/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { frappeAPI } from '../api/frappeClient';

interface AuthUser {
  username: string;
  full_name: string;
  role: string;
  email?: string;
  roles?: string[]; // Array of all roles from Frappe
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
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
  // First check if user has specific Frappe roles
 const mapUserToRole = (username: string, fullName: string, frappeRoles?: any[]): string => {
  // First check if user has specific Frappe roles
  if (frappeRoles && Array.isArray(frappeRoles)) {
    const roleNames = frappeRoles.map(r => r.role || r).filter(Boolean);
    
    // Priority mapping from Frappe roles
    const frappeRoleMap: Record<string, string> = {
      'EITS_Sale_Representative': 'EITS_Sale_Representative',
      'EITS_Site_Inspector': 'EITS_Site_Inspector',
      'System Manager': 'admin',
      'Administrator': 'admin',
      'Sales User': 'EITS_Sale_Representative',
      'Sales Manager': 'EITS_Sale_Representative',
      'Quality Manager': 'EITS_Site_Inspector',
      'Quality Inspector': 'EITS_Site_Inspector',
      'Site Inspector': 'EITS_Site_Inspector',
      'Projects Manager': 'project_manager',
      'Projects User': 'project_manager',
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
      if (lowerRole.includes('admin') || lowerRole.includes('manager')) {
        return 'admin';
      }
      if (lowerRole.includes('inspector') || lowerRole.includes('quality') || lowerRole.includes('site')) {
        return 'EITS_Site_Inspector';
      }
      if (lowerRole.includes('project')) {
        return 'project_manager';
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
      'Inspector': 'inspector',
      'Site Inspector': 'inspector',
      'Quality Inspector': 'inspector',
      'Field Inspector': 'inspector',
      'Project': 'project_manager',
      'Project Manager': 'project_manager',
      'PM': 'project_manager',
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
    if (normalizedName.includes('inspector')) return 'inspector';
    if (normalizedName.includes('project')) return 'project_manager';
    if (normalizedName.includes('account') || normalizedName.includes('finance')) return 'accountUser';
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
    'site_inspector@eits.com': 'inspector',
    'quality_inspector@eits.com': 'inspector',
    'field_inspector@eits.com': 'inspector',
    'inspector@eits.com': 'inspector',
    'inspector': 'inspector',
    'project_manager@eits.com': 'project_manager',
    'pm@eits.com': 'project_manager',
    'project_manager': 'project_manager',
    'account@eits.com': 'accountUser',
    'accountant@eits.com': 'accountUser',
    'finance@eits.com': 'accountUser',
    'account_user@eits.com': 'accountUser',
    'account': 'accountUser',
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
    return 'inspector';
  }
  
  if (lowerUsername.includes('project') || lowerUsername.includes('pm')) {
    return 'project_manager';
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

  const checkAuthStatus = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const sessionCheck = await frappeAPI.checkSession();
    console.log('Session Check Result:', sessionCheck);
    
    if (sessionCheck.authenticated) {
      const username = sessionCheck.user?.username || sessionCheck.user || '';
      // Provide a default full_name if not available
      const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
      const email = sessionCheck.user?.email || username;
      const frappeRoles = sessionCheck.user?.roles || [];
      
      // Extract role names from Frappe roles array
      const roleNames = frappeRoles.map((r: any) => r.role || r).filter(Boolean);
      
      const mappedRole = mapUserToRole(username, fullName, frappeRoles);
      
      const userData: AuthUser = {
        username: username,
        full_name: fullName,
        email: email,
        role: mappedRole,
        roles: roleNames
      };
      
      console.log('Auth Status Check:', userData);
      
      setUser(userData);
    } else {
      setUser(null);
      if (sessionCheck.error && !sessionCheck.error.includes('No stored user data')) {
        console.warn('Session check warning:', sessionCheck.error);
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    setUser(null);
    setError('Authentication check failed');
  } finally {
    setLoading(false);
  }
};

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await frappeAPI.login(username, password);
      
      if (response.success && response.user) {
        // Get username and full_name from response
        const responseUsername = response.user.username || username;
        const fullName = response.data?.full_name || response.user.full_name || '';
        const email = (response.user && 'email' in response.user ? (response.user as any).email : undefined) || response.data?.email || responseUsername;
        const frappeRoles = response.data?.roles || (response.user && 'roles' in response.user ? (response.user as any).roles : []) || [];
        
        // Extract role names from Frappe roles array
        const roleNames = frappeRoles.map((r: any) => r.role || r).filter(Boolean);
        
        // Use our enhanced mapping function
        const mappedRole = mapUserToRole(responseUsername, fullName, frappeRoles);
        
        const userData: AuthUser = {
          username: responseUsername,
          full_name: fullName,
          email: email,
          role: mappedRole,
          roles: roleNames
        };

        console.log('Login Success:', {
          username: responseUsername,
          fullName,
          frappeRoles: roleNames,
          mappedRole,
          userData
        });

        setUser(userData);
        return { success: true, user: userData };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
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