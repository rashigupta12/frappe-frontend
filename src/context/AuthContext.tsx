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
  switchRole: (role: string) => Promise<boolean>;
  getDisplayRoleName: (role: string) => string;
  isMultiRole: boolean;
  isSwitchingRole: boolean; // Add this to track role switching state
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
  switchRole: async () => false,
  getDisplayRoleName: () => '',
  isMultiRole: false,
  isSwitchingRole: false,
});

// Only these roles are allowed
type AllowedRole = 'EITS_Sale_Representative' | 'EITS_Site_Inspector' | 'EITS_Project_Manager' | 'accountUser';

// Function to filter and map only the allowed roles
// Fixed getAllowedRoles function
const getAllowedRoles = (frappeRoles?: any[]): AllowedRole[] => {
  console.log('Processing roles:', frappeRoles); // Add debugging
  
  if (!frappeRoles || !Array.isArray(frappeRoles)) return ['accountUser']; // Keep default for safety
  
  // Extract role names - handle both string and object formats
  const roleNames = frappeRoles.map(r => {
    if (typeof r === 'string') return r;
    if (typeof r === 'object' && r !== null) {
      return r.role || r.name || '';
    }
    return '';
  }).filter(Boolean);
  
  console.log('Extracted role names:', roleNames); // Add debugging
  
  const roleMap: Record<string, AllowedRole> = {
    'EITS_Sale_Representative': 'EITS_Sale_Representative',
    'EITS_Site_Inspector': 'EITS_Site_Inspector', 
    'EITS_Project_Manager': 'EITS_Project_Manager', // This should match your data
    'Accounts Manager': 'accountUser',
    'Accounts User': 'accountUser'
  };
  
  const mappedRoles = new Set<AllowedRole>();
  
  // Map only allowed roles
  for (const roleName of roleNames) {
    if (roleMap[roleName]) {
      mappedRoles.add(roleMap[roleName]);
      console.log(`Mapped role: ${roleName} -> ${roleMap[roleName]}`); // Add debugging
    }
  }
  
  // If no roles found, use default
  if (mappedRoles.size === 0) {
    console.log('No valid roles found, defaulting to accountUser'); // Add debugging
    mappedRoles.add('accountUser');
  }
  
  const finalRoles = Array.from(mappedRoles);
  console.log('Final mapped roles:', finalRoles); // Add debugging
  
  return finalRoles;
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
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

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
    console.log('Session check result:', sessionCheck); // Add debugging
    
    if (sessionCheck.authenticated) {
      const username = sessionCheck.user?.username || sessionCheck.user || '';
      const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
      const email = sessionCheck.user?.email || username;
      
      // Get roles from details instead of user object
      const frappeRoles = sessionCheck.details?.roles || sessionCheck.user?.roles || [];
      console.log('Frappe roles from session:', frappeRoles); // Add debugging
      
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
        roles: frappeRoles.map((r: any) => typeof r === 'string' ? r : (r.role || r.name || '')),
        requiresPasswordReset: undefined
      };
      
      console.log('Setting user data:', userData); // Add debugging
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

  // Improved switchRole function with better state management
 const switchRole = async (role: string): Promise<boolean> => {
  if (!availableRoles.includes(role as AllowedRole)) {
    return false;
  }

  try {
    setIsSwitchingRole(true);
    localStorage.setItem(`currentRole_${user?.username || ''}`, role);
    setCurrentRole(role as AllowedRole);
    
    if (user) {
      setUser({ ...user, role });
    }
    
    return true;
  } catch (error) {
    console.error("Error switching role:", error);
    return false;
  } finally {
    setIsSwitchingRole(false);
  }
};
const login = async (username: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await frappeAPI.login(username, password);
    console.log('Login response:', response); // Add debugging
    
    if (response.success && response.user) {
      const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
      
      // Use details.roles instead of user.roles - this is key!
      const rawRoles = response.details?.roles || response.user.roles || [];
      console.log('Raw roles from login:', rawRoles); // Add debugging
      
      // Get only allowed roles
      const allowedRoles = getAllowedRoles(rawRoles);
      setAvailableRoles(allowedRoles);
      
      const initialRole = allowedRoles[0]; // Default to first role
      setCurrentRole(initialRole);
      
      const userData: AuthUser = {
        username: username,
        full_name: response.user.full_name || username.split('@')[0] || 'User',
        email: response.user.email || username,
        role: initialRole,
        roles: rawRoles.map((r: any) => typeof r === 'string' ? r : (r.role || r.name || '')),
        requiresPasswordReset: firstLoginCheck.requiresPasswordReset || false
      };

      setUser(userData);
      console.log('User logged in:', userData);
      
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
      localStorage.removeItem('isRoleSwitching');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCurrentRole(null);
      setAvailableRoles([]);
      setError(null);
      setLoading(false);
      setIsSwitchingRole(false);
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
    isSwitchingRole,
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