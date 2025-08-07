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
  currentRole: string | null;
  availableRoles: string[];
  switchRole: (role: string) => void;
  getDisplayRoleName: (role: string) => string;
  isMultiRole: boolean;
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
  currentRole: null,
  availableRoles: [],
  switchRole: () => {},
  getDisplayRoleName: () => '',
  isMultiRole: false,
});

// Only these roles are allowed
type AllowedRole = 'EITS_Sale_Representative' | 'EITS_Site_Inspector' | 'EITS_Project_Manager' | 'accountUser';

// Function to filter and map only the allowed roles
const getAllowedRoles = (frappeRoles?: any[]): AllowedRole[] => {
  if (!frappeRoles || !Array.isArray(frappeRoles)) return ['accountUser']; // default role
  
  const roleNames = frappeRoles.map(r => r.role || r).filter(Boolean);
  
  const roleMap: Record<string, AllowedRole> = {
    'EITS_Sale_Representative': 'EITS_Sale_Representative',
    'EITS_Site_Inspector': 'EITS_Site_Inspector',
    'EITS_Project_Manager': 'EITS_Project_Manager',
    'System Manager': 'accountUser',
    'Administrator': 'accountUser',
    'Sales User': 'EITS_Sale_Representative',
    'Sales Manager': 'EITS_Sale_Representative',
    'Quality Manager': 'EITS_Site_Inspector',
    'Quality Inspector': 'EITS_Site_Inspector',
    'Site Inspector': 'EITS_Site_Inspector',
    'Projects Manager': 'EITS_Project_Manager',
    'Projects User': 'EITS_Project_Manager',
    'Accounts Manager': 'accountUser',
    'Accounts User': 'accountUser'
  };
  
  const mappedRoles = new Set<AllowedRole>();
  
  // Map only allowed roles
  for (const roleName of roleNames) {
    if (roleMap[roleName]) {
      mappedRoles.add(roleMap[roleName]);
    }
  }
  
  // If no roles found, use default
  if (mappedRoles.size === 0) {
    mappedRoles.add('accountUser');
  }
  
  return Array.from(mappedRoles);
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
  const [currentRole, setCurrentRole] = useState<AllowedRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AllowedRole[]>([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Persist current role in localStorage
  useEffect(() => {
    if (currentRole && user?.username) {
      localStorage.setItem(`currentRole_${user.username}`, currentRole);
    }
  }, [currentRole, user?.username]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sessionCheck = await frappeAPI.checkSession();
      
      if (sessionCheck.authenticated) {
        const username = sessionCheck.user?.username || sessionCheck.user || '';
        const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
        const email = sessionCheck.user?.email || username;
        const frappeRoles = sessionCheck.user?.roles || [];
        const requiresPasswordReset = sessionCheck.user?.requiresPasswordReset || false;
        
        if (requiresPasswordReset) {
          return {
            authenticated: false,
            requiresPasswordReset: true
          };
        }
        
        // Get only allowed roles for this user
        const allowedRoles = getAllowedRoles(frappeRoles);
        setAvailableRoles(allowedRoles);
        
        // Set current role (check localStorage first for persistence)
        const savedRole = localStorage.getItem(`currentRole_${username}`);
        const initialRole = (savedRole && allowedRoles.includes(savedRole as AllowedRole)) 
          ? savedRole as AllowedRole
          : allowedRoles[0]; // Default to first available role
        
        setCurrentRole(initialRole);
        
        const userData: AuthUser = {
          username: username,
          full_name: fullName,
          email: email,
          role: initialRole,
          roles: frappeRoles.map((r: any) => r.role || r),
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
const switchRole = async (role: string): Promise<boolean> => {
  if (availableRoles.includes(role as AllowedRole)) {
    try {
      // Immediately update both state and localStorage
      const username = user?.username || '';
      localStorage.setItem(`currentRole_${username}`, role);
      setCurrentRole(role as AllowedRole);
      
      // Update user object with new active role
      if (user) {
        const updatedUser = { ...user, role };
        setUser(updatedUser);
      }
      return true;
    } catch (error) {
      console.error("Error switching role:", error);
      return false;
    }
  }
  return false;
};

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await frappeAPI.login(username, password);
      
      if (response.success && response.user) {
        const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
        
        // Get only allowed roles
        const allowedRoles = getAllowedRoles(response.user.roles || []);
        setAvailableRoles(allowedRoles);
        
        const initialRole = allowedRoles[0]; // Default to first role
        setCurrentRole(initialRole);
        
        const userData: AuthUser = {
          username: username,
          full_name: response.user.full_name || username.split('@')[0] || 'User',
          email: response.user.email || username,
          role: initialRole,
          roles: response.user.roles || [],
          requiresPasswordReset: firstLoginCheck.requiresPasswordReset || false
        };

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
        const userDetails = await frappeAPI.getUserDetails(username);
        
        const allowedRoles = getAllowedRoles(userDetails.data?.roles || []);
        setAvailableRoles(allowedRoles);
        
        const initialRole = allowedRoles[0];
        setCurrentRole(initialRole);
        
        const userData: AuthUser = {
          username: username,
          full_name: userDetails.data?.full_name || username.split('@')[0] || 'User',
          email: userDetails.data?.email || username,
          role: initialRole,
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
      
      // Clear persisted role data
      if (user?.username) {
        localStorage.removeItem(`currentRole_${user.username}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentRole(null);
      setAvailableRoles([]);
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

  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!user || !currentRole) return false;
    
    try {
      const { hasPermission } = require('../middleware/roleMiddleware');
      return hasPermission(currentRole as any, resource as any, action as any);
    } catch {
      return false;
    }
  };

  // Helper function to get display name for roles
  const getDisplayRoleName = (role: string): string => {
    const roleDisplayMap: Record<string, string> = {
      'EITS_Sale_Representative': 'Sales Representative',
      'EITS_Site_Inspector': 'Site Inspector',
      'EITS_Project_Manager': 'Project Manager',
      'accountUser': 'Account User'
    };
    
    return roleDisplayMap[role] || role.replace(/_/g, ' ');
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
    role: currentRole,
    canAccess,
    currentRole,
    availableRoles,
    switchRole,
    getDisplayRoleName,
    isMultiRole: availableRoles.length > 1,
    hasRole: (roleToCheck: string): boolean => {
      return currentRole === roleToCheck;
    },
    hasAnyRole: (rolesToCheck: string[]): boolean => {
      if (!currentRole || !rolesToCheck.length) return false;
      return rolesToCheck.includes(currentRole);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};