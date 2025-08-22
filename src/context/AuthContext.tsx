// /* eslint-disable @typescript-eslint/no-require-imports */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { frappeAPI } from '../api/frappeClient';

// interface AuthUser {
//   requiresPasswordReset: any;
//   username: string;
//   full_name: string;
//   role: string;
//   email?: string;
//   roles?: string[]; // Array of all roles from Frappe
// }

// interface AuthContextType {
//   user: AuthUser | null;
//   login: (username: string, password: string) => Promise<{
//     success: boolean;
//     user?: AuthUser;
//     error?: string;
//     requiresPasswordReset?: boolean;
//     noValidRoles?: boolean; // Add this to indicate no valid roles
//   }>;
//   logout: () => Promise<void>;
//   refreshAuth: () => Promise<void>;
//   clearError: () => void;
//   resetPassword?: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
//   loading: boolean;
//   error: string | null;
//   isAuthenticated: boolean;
//   role: string | null;
//   hasRole: (roleToCheck: string) => boolean;
//   hasAnyRole: (rolesToCheck: string[]) => boolean;
//   canAccess: (resource: string, action?: string) => boolean;
//   currentRole: string | null;
//   availableRoles: string[];
//   switchRole: (role: string) => Promise<boolean>;
//   getDisplayRoleName: (role: string) => string;
//   isMultiRole: boolean;
//   isSwitchingRole: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   login: async () => ({ success: false }),
//   logout: async () => {},
//   refreshAuth: async () => {},
//   clearError: () => {},
//   loading: false,
//   error: null,
//   isAuthenticated: false,
//   role: null,
//   hasRole: () => false,
//   hasAnyRole: () => false,
//   canAccess: () => false,
//   currentRole: null,
//   availableRoles: [],
//   switchRole: async () => false,
//   getDisplayRoleName: () => '',
//   isMultiRole: false,
//   isSwitchingRole: false,
// });

// // Only these roles are allowed
// type AllowedRole = 'EITS_Sale_Representative' | 'EITS_Site_Inspector' | 'EITS_Project_Manager' | 'accountUser';

// // Modified function to NOT automatically default to any role
// const getAllowedRoles = (frappeRoles?: any[]): AllowedRole[] => {
//   console.log('=== ROLE DEBUGGING START ===');
//   console.log('Raw frappeRoles input:', frappeRoles);
//   console.log('frappeRoles type:', typeof frappeRoles);
//   console.log('Is array:', Array.isArray(frappeRoles));
  
//   if (!frappeRoles || !Array.isArray(frappeRoles)) {
//     console.log('No valid roles array, returning empty array');
//     return []; // Return empty array instead of default role
//   }
  
//   // Extract role names - handle both string and object formats
//   const roleNames = frappeRoles.map((r, index) => {
//     console.log(`Role ${index}:`, r);
//     if (typeof r === 'string') {
//       console.log(`Role ${index} is string:`, r);
//       return r;
//     }
//     if (typeof r === 'object' && r !== null) {
//       const roleName = r.role || r.name || '';
//       console.log(`Role ${index} is object, extracted name:`, roleName);
//       return roleName;
//     }
//     console.log(`Role ${index} is neither string nor valid object`);
//     return '';
//   }).filter(Boolean);
  
//   console.log('Extracted role names:', roleNames);
  
//   const roleMap: Record<string, AllowedRole> = {
//     'EITS_Sale_Representative': 'EITS_Sale_Representative',
//     'EITS_Site_Inspector': 'EITS_Site_Inspector', 
//     'EITS_Project_Manager': 'EITS_Project_Manager',
//     'Accounts Manager': 'accountUser',
//     'Accounts User': 'accountUser'
//   };
  
//   console.log('Available role mappings:', Object.keys(roleMap));
  
//   const mappedRoles = new Set<AllowedRole>();
  
//   // Map only allowed roles
//   for (const roleName of roleNames) {
//     console.log(`Checking role: "${roleName}"`);
//     if (roleMap[roleName]) {
//       mappedRoles.add(roleMap[roleName]);
//       console.log(`✅ Mapped: ${roleName} -> ${roleMap[roleName]}`);
//     } else {
//       console.log(`❌ Not mapped: ${roleName}`);
//     }
//   }
  
//   const finalRoles = Array.from(mappedRoles);
//   console.log('Final mapped roles:', finalRoles);
  
//   // Don't add default role if no valid roles found
//   if (finalRoles.length === 0) {
//     console.log('⚠️ No valid roles found, returning empty array');
//   }
  
//   console.log('=== ROLE DEBUGGING END ===');
  
//   return finalRoles;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentRole, setCurrentRole] = useState<AllowedRole | null>(null);
//   const [availableRoles, setAvailableRoles] = useState<AllowedRole[]>([]);
//   const [isSwitchingRole, setIsSwitchingRole] = useState(false);

//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   // Persist current role in localStorage
//   useEffect(() => {
//     if (currentRole && user?.username) {
//       localStorage.setItem(`currentRole_${user.username}`, currentRole);
//     }
//   }, [currentRole, user?.username]);

//   const checkAuthStatus = async () => {
//   try {
//     setLoading(true);
//     setError(null);
    
//     const sessionCheck = await frappeAPI.checkSession();
//     console.log('Session check result:', sessionCheck);
    
//     if (sessionCheck.authenticated) {
//       const username = sessionCheck.user?.username || sessionCheck.user || '';
//       const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
//       const email = sessionCheck.user?.email || username;
      
//       // Get roles from details instead of user object
//       const frappeRoles = sessionCheck.details?.roles || sessionCheck.user?.roles || [];
//       console.log('Frappe roles from session:', frappeRoles);
      
//       const requiresPasswordReset = sessionCheck.user?.requiresPasswordReset || false;
      
//       // CRITICAL FIX: Handle password reset BEFORE any other logic
//       if (requiresPasswordReset) {
//         console.log('User requires password reset, clearing user state');
//         // Clear all user-related state
//         setUser(null);
//         setCurrentRole(null);
//         setAvailableRoles([]);
//         // Clear localStorage
//         localStorage.removeItem(`currentRole_${username}`);
        
//         // Set a special user object that indicates password reset is required
//         const passwordResetUser: AuthUser = {
//           username: username,
//           full_name: fullName,
//           email: email,
//           role: '', // Empty role
//           roles: [],
//           requiresPasswordReset: true
//         };
        
//         setUser(passwordResetUser);
        
//         return {
//           authenticated: false,
//           requiresPasswordReset: true,
//           user: passwordResetUser
//         };
//       }
      
//       // Get only allowed roles for this user
//       const allowedRoles = getAllowedRoles(frappeRoles);
      
//       // If no valid roles, logout the user
//       if (allowedRoles.length === 0) {
//         console.log('No valid roles found, logging out user');
//         await logout();
//         setError('Access denied: No valid roles assigned to your account.');
//         return { 
//           authenticated: false, 
//           error: 'No valid roles assigned',
//           noValidRoles: true 
//         };
//       }
      
//       setAvailableRoles(allowedRoles);
      
//       // Set current role (check localStorage first for persistence)
//       const savedRole = localStorage.getItem(`currentRole_${username}`);
//       const initialRole = (savedRole && allowedRoles.includes(savedRole as AllowedRole)) 
//         ? savedRole as AllowedRole
//         : allowedRoles[0]; // Default to first available role
      
//       setCurrentRole(initialRole);
      
//       const userData: AuthUser = {
//         username: username,
//         full_name: fullName,
//         email: email,
//         role: initialRole,
//         roles: frappeRoles.map((r: any) => typeof r === 'string' ? r : (r.role || r.name || '')),
//         requiresPasswordReset: false // Explicitly set to false for normal users
//       };
      
//       console.log('Setting user data:', userData);
//       setUser(userData);
//       return { authenticated: true, user: userData };
//     }
    
//     // Not authenticated - clear all state
//     setUser(null);
//     setCurrentRole(null);
//     setAvailableRoles([]);
//     return { authenticated: false };
//   } catch (error) {
//     console.error('Auth check failed:', error);
//     // Clear state on error
//     setUser(null);
//     setCurrentRole(null);
//     setAvailableRoles([]);
//     return { authenticated: false, error: 'Authentication check failed' };
//   } finally {
//     setLoading(false);
//   }
// };

// // Also update the login function for consistency
// const login = async (username: string, password: string) => {
//   try {
//     setLoading(true);
//     setError(null);
    
//     const response = await frappeAPI.login(username, password);
//     console.log('Login response:', response);
    
//     if (response.success && response.user) {
//       const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
      
//       // CRITICAL FIX: Check password reset requirement FIRST
//       if (firstLoginCheck.requiresPasswordReset) {
//         console.log('User requires password reset after login');
        
//         const passwordResetUser: AuthUser = {
//           username: username,
//           full_name: response.user.full_name || username.split('@')[0] || 'User',
//           email: response.user.email || username,
//           role: '', // Empty role
//           roles: [],
//           requiresPasswordReset: true
//         };
        
//         setUser(passwordResetUser);
//         setCurrentRole(null);
//         setAvailableRoles([]);
        
//         return { 
//           success: true, 
//           user: passwordResetUser,
//           requiresPasswordReset: true
//         };
//       }
      
//       // Use details.roles instead of user.roles - this is key!
//       const rawRoles = response.details?.roles || response.user.roles || [];
//       console.log('Raw roles from login:', rawRoles);
      
//       // Get only allowed roles
//       const allowedRoles = getAllowedRoles(rawRoles);
      
//       // If no valid roles found, logout and return error
//       if (allowedRoles.length === 0) {
//         console.log('No valid roles found during login, logging out');
//         await frappeAPI.logout(); // Logout from Frappe
        
//         // Clear any stored data
//         localStorage.removeItem(`currentRole_${username}`);
//         setUser(null);
//         setCurrentRole(null);
//         setAvailableRoles([]);
        
//         return { 
//           success: false, 
//           error: 'Access denied: No valid roles assigned to your account.',
//           noValidRoles: true
//         };
//       }
      
//       setAvailableRoles(allowedRoles);
      
//       const initialRole = allowedRoles[0]; // Default to first role
//       setCurrentRole(initialRole);
      
//       const userData: AuthUser = {
//         username: username,
//         full_name: response.user.full_name || username.split('@')[0] || 'User',
//         email: response.user.email || username,
//         role: initialRole,
//         roles: rawRoles.map((r: any) => typeof r === 'string' ? r : (r.role || r.name || '')),
//         requiresPasswordReset: false // Explicitly set to false for normal users
//       };

//       setUser(userData);
//       console.log('User logged in:', userData);
      
//       return { 
//         success: true, 
//         user: userData,
//         requiresPasswordReset: false
//       };
//     }
    
//     return { 
//       success: false, 
//       error: response.error || 'Login failed' 
//     };
//   } catch (error) {
//     console.error('Login error:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
//     setError(errorMessage);
//     return { success: false, error: errorMessage };
//   } finally {
//     setLoading(false);
//   }
// };

//   // Improved switchRole function with better state management
//   const switchRole = async (role: string): Promise<boolean> => {
//     if (!availableRoles.includes(role as AllowedRole)) {
//       return false;
//     }

//     try {
//       setIsSwitchingRole(true);
//       localStorage.setItem(`currentRole_${user?.username || ''}`, role);
//       setCurrentRole(role as AllowedRole);
      
//       if (user) {
//         setUser({ ...user, role });
//       }
      
//       return true;
//     } catch (error) {
//       console.error("Error switching role:", error);
//       return false;
//     } finally {
//       setIsSwitchingRole(false);
//     }
//   };

//   const resetPassword = async (username: string, newPassword: string) => {
//   try {
//     setLoading(true);
//     setError(null);

//     const result = await frappeAPI.resetFirstTimePassword(username, newPassword);
    
//     if (result.success) {
//       const userDetails = await frappeAPI.getUserDetails(username);
      
//       const allowedRoles = getAllowedRoles(userDetails.data?.roles || []);
      
//       // If no valid roles after password reset, logout
//       if (allowedRoles.length === 0) {
//         await frappeAPI.logout();
//         setError('Access denied: No valid roles assigned to your account.');
//         return { 
//           success: false, 
//           error: 'No valid roles assigned',
//           noValidRoles: true 
//         };
//       }
      
//       setAvailableRoles(allowedRoles);
      
//       const initialRole = allowedRoles[0];
//       setCurrentRole(initialRole);
      
//       const userData: AuthUser = {
//         username: username,
//         full_name: userDetails.data?.full_name || username.split('@')[0] || 'User',
//         email: userDetails.data?.email || username,
//         role: initialRole,
//         roles: userDetails.data?.roles?.map((r: any) => r.role || r) || [],
//         requiresPasswordReset: false // FIXED: Set to false after successful reset
//       };

//       setUser(userData);
//       return { success: true };
//     } else {
//       setError(result.error || 'Password reset failed');
//       return { success: false, error: result.error || 'Password reset failed' };
//     }
//   } catch (error) {
//     console.error('Password reset error:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
//     setError(errorMessage);
//     return { success: false, error: errorMessage };
//   } finally {
//     setLoading(false);
//   }
// };

//   const logout = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       await frappeAPI.logout();
      
//       // Clear persisted role data
//       if (user?.username) {
//         localStorage.removeItem(`currentRole_${user.username}`);
//       }
//       localStorage.removeItem('isRoleSwitching');
//     } catch (error) {
//       console.error('Logout error:', error);
//     } finally {
//       setUser(null);
//       setCurrentRole(null);
//       setAvailableRoles([]);
//       setError(null);
//       setLoading(false);
//       setIsSwitchingRole(false);
//     }
//   };

//   const refreshAuth = async () => {
//     await checkAuthStatus();
//   };

//   const clearError = () => {
//     setError(null);
//   };

//   const canAccess = (resource: string, action: string = 'read'): boolean => {
//     if (!user || !currentRole) return false;
    
//     try {
//       const { hasPermission } = require('../middleware/roleMiddleware');
//       return hasPermission(currentRole as any, resource as any, action as any);
//     } catch {
//       return false;
//     }
//   };

//   // Helper function to get display name for roles
//   const getDisplayRoleName = (role: string): string => {
//     const roleDisplayMap: Record<string, string> = {
//       'EITS_Sale_Representative': 'Sales Representative',
//       'EITS_Site_Inspector': 'Site Inspector',
//       'EITS_Project_Manager': 'Project Manager',
//       'accountUser': 'Account User'
//     };
    
//     return roleDisplayMap[role] || role.replace(/_/g, ' ');
//   };

//  const value = {
//   user,
//   login,
//   logout,
//   refreshAuth,
//   clearError,
//   resetPassword,
//   loading,
//   error,
//   // CRITICAL FIX: Only authenticated if user exists AND doesn't need password reset AND has valid roles
//   isAuthenticated: !!user && !user?.requiresPasswordReset && !!currentRole,
//   needsPasswordReset: !!user?.requiresPasswordReset, // New property to check password reset status
//   role: currentRole,
//   canAccess,
//   currentRole,
//   availableRoles,
//   switchRole,
//   getDisplayRoleName,
//   isMultiRole: availableRoles.length > 1,
//   isSwitchingRole,
//   hasRole: (roleToCheck: string): boolean => {
//     return currentRole === roleToCheck;
//   },
//   hasAnyRole: (rolesToCheck: string[]): boolean => {
//     if (!currentRole || !rolesToCheck.length) return false;
//     return rolesToCheck.includes(currentRole);
//   },
// };
//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

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
    noValidRoles?: boolean;
    serverError?: boolean; // Add server error flag
  }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  resetPassword?: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string; serverError?: boolean }>;
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
  isSwitchingRole: boolean;
  serverError: boolean; // Add server error state
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
  serverError: false,
});

// Helper function to check if error is a server connection error
const isServerConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for common network/server error patterns
  const errorMessage = error.message || error.toString() || '';
  const errorPatterns = [
    'fetch',
    'network',
    'connection',
    'ECONNREFUSED',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'Failed to fetch',
    'NetworkError',
    'ERR_CONNECTION_REFUSED'
  ];
  
  return errorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  ) || error instanceof TypeError && errorMessage.includes('fetch');
};

// Only these roles are allowed
type AllowedRole = 'EITS_Sale_Representative' | 'EITS_Site_Inspector' | 'EITS_Project_Manager' | 'accountUser';

// Modified function to NOT automatically default to any role
const getAllowedRoles = (frappeRoles?: any[]): AllowedRole[] => {
  console.log('=== ROLE DEBUGGING START ===');
  console.log('Raw frappeRoles input:', frappeRoles);
  console.log('frappeRoles type:', typeof frappeRoles);
  console.log('Is array:', Array.isArray(frappeRoles));
  
  if (!frappeRoles || !Array.isArray(frappeRoles)) {
    console.log('No valid roles array, returning empty array');
    return []; // Return empty array instead of default role
  }
  
  // Extract role names - handle both string and object formats
  const roleNames = frappeRoles.map((r, index) => {
    console.log(`Role ${index}:`, r);
    if (typeof r === 'string') {
      console.log(`Role ${index} is string:`, r);
      return r;
    }
    if (typeof r === 'object' && r !== null) {
      const roleName = r.role || r.name || '';
      console.log(`Role ${index} is object, extracted name:`, roleName);
      return roleName;
    }
    console.log(`Role ${index} is neither string nor valid object`);
    return '';
  }).filter(Boolean);
  
  console.log('Extracted role names:', roleNames);
  
  const roleMap: Record<string, AllowedRole> = {
    'EITS_Sale_Representative': 'EITS_Sale_Representative',
    'EITS_Site_Inspector': 'EITS_Site_Inspector', 
    'EITS_Project_Manager': 'EITS_Project_Manager',
    'Accounts Manager': 'accountUser',
    'Accounts User': 'accountUser'
  };
  
  console.log('Available role mappings:', Object.keys(roleMap));
  
  const mappedRoles = new Set<AllowedRole>();
  
  // Map only allowed roles
  for (const roleName of roleNames) {
    console.log(`Checking role: "${roleName}"`);
    if (roleMap[roleName]) {
      mappedRoles.add(roleMap[roleName]);
      console.log(`✅ Mapped: ${roleName} -> ${roleMap[roleName]}`);
    } else {
      console.log(`❌ Not mapped: ${roleName}`);
    }
  }
  
  const finalRoles = Array.from(mappedRoles);
  console.log('Final mapped roles:', finalRoles);
  
  // Don't add default role if no valid roles found
  if (finalRoles.length === 0) {
    console.log('⚠️ No valid roles found, returning empty array');
  }
  
  console.log('=== ROLE DEBUGGING END ===');
  
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
  const [serverError, setServerError] = useState(false); // Add server error state
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
      setServerError(false);
      
      const sessionCheck = await frappeAPI.checkSession();
      console.log('Session check result:', sessionCheck);
      
      if (sessionCheck.authenticated) {
        const username = sessionCheck.user?.username || sessionCheck.user || '';
        const fullName = sessionCheck.user?.full_name || username.split('@')[0] || 'User';
        const email = sessionCheck.user?.email || username;
        
        // Get roles from details instead of user object
        const frappeRoles = sessionCheck.details?.roles || sessionCheck.user?.roles || [];
        console.log('Frappe roles from session:', frappeRoles);
        
        const requiresPasswordReset = sessionCheck.user?.requiresPasswordReset || false;
        
        // CRITICAL FIX: Handle password reset BEFORE any other logic
        if (requiresPasswordReset) {
          console.log('User requires password reset, clearing user state');
          // Clear all user-related state
          setUser(null);
          setCurrentRole(null);
          setAvailableRoles([]);
          // Clear localStorage
          localStorage.removeItem(`currentRole_${username}`);
          
          // Set a special user object that indicates password reset is required
          const passwordResetUser: AuthUser = {
            username: username,
            full_name: fullName,
            email: email,
            role: '', // Empty role
            roles: [],
            requiresPasswordReset: true
          };
          
          setUser(passwordResetUser);
          
          return {
            authenticated: false,
            requiresPasswordReset: true,
            user: passwordResetUser
          };
        }
        
        // Get only allowed roles for this user
        const allowedRoles = getAllowedRoles(frappeRoles);
        
        // If no valid roles, logout the user
        if (allowedRoles.length === 0) {
          console.log('No valid roles found, logging out user');
          await logout();
          setError('Access denied: No valid roles assigned to your account.');
          return { 
            authenticated: false, 
            error: 'No valid roles assigned',
            noValidRoles: true 
          };
        }
        
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
          requiresPasswordReset: false // Explicitly set to false for normal users
        };
        
        console.log('Setting user data:', userData);
        setUser(userData);
        return { authenticated: true, user: userData };
      }
      
      // Not authenticated - clear all state
      setUser(null);
      setCurrentRole(null);
      setAvailableRoles([]);
      return { authenticated: false };
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Check if it's a server connection error
      if (isServerConnectionError(error)) {
        setServerError(true);
        setError('Unable to connect to server');
      } else {
        setError('Authentication check failed');
      }
      
      // Clear state on error
      setUser(null);
      setCurrentRole(null);
      setAvailableRoles([]);
      return { authenticated: false, error: 'Authentication check failed' };
    } finally {
      setLoading(false);
    }
  };

  // Also update the login function for consistency
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setServerError(false);
      
      const response = await frappeAPI.login(username, password);
      console.log('Login response:', response);
      
      if (response.success && response.user) {
        const firstLoginCheck = await frappeAPI.checkFirstLogin(username);
        
        // CRITICAL FIX: Check password reset requirement FIRST
        if (firstLoginCheck.requiresPasswordReset) {
          console.log('User requires password reset after login');
          
          const passwordResetUser: AuthUser = {
            username: username,
            full_name: response.user.full_name || username.split('@')[0] || 'User',
            email: response.user.email || username,
            role: '', // Empty role
            roles: [],
            requiresPasswordReset: true
          };
          
          setUser(passwordResetUser);
          setCurrentRole(null);
          setAvailableRoles([]);
          
          return { 
            success: true, 
            user: passwordResetUser,
            requiresPasswordReset: true
          };
        }
        
        // Use details.roles instead of user.roles - this is key!
        const rawRoles = response.details?.roles || response.user.roles || [];
        console.log('Raw roles from login:', rawRoles);
        
        // Get only allowed roles
        const allowedRoles = getAllowedRoles(rawRoles);
        
        // If no valid roles found, logout and return error
        if (allowedRoles.length === 0) {
          console.log('No valid roles found during login, logging out');
          await frappeAPI.logout(); // Logout from Frappe
          
          // Clear any stored data
          localStorage.removeItem(`currentRole_${username}`);
          setUser(null);
          setCurrentRole(null);
          setAvailableRoles([]);
          
          return { 
            success: false, 
            error: 'Access denied: No valid roles assigned to your account.',
            noValidRoles: true
          };
        }
        
        setAvailableRoles(allowedRoles);
        
        const initialRole = allowedRoles[0]; // Default to first role
        setCurrentRole(initialRole);
        
        const userData: AuthUser = {
          username: username,
          full_name: response.user.full_name || username.split('@')[0] || 'User',
          email: response.user.email || username,
          role: initialRole,
          roles: rawRoles.map((r: any) => typeof r === 'string' ? r : (r.role || r.name || '')),
          requiresPasswordReset: false // Explicitly set to false for normal users
        };

        setUser(userData);
        console.log('User logged in:', userData);
        
        return { 
          success: true, 
          user: userData,
          requiresPasswordReset: false
        };
      }
      
      return { 
        success: false, 
        error: response.error || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if it's a server connection error
      if (isServerConnectionError(error)) {
        setServerError(true);
        const errorMessage = 'Unable to connect to server. Please check your connection.';
        setError(errorMessage);
        return { success: false, error: errorMessage, serverError: true };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
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

  const resetPassword = async (username: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      setServerError(false);

      const result = await frappeAPI.resetFirstTimePassword(username, newPassword);
      
      if (result.success) {
        const userDetails = await frappeAPI.getUserDetails(username);
        
        const allowedRoles = getAllowedRoles(userDetails.data?.roles || []);
        
        // If no valid roles after password reset, logout
        if (allowedRoles.length === 0) {
          await frappeAPI.logout();
          setError('Access denied: No valid roles assigned to your account.');
          return { 
            success: false, 
            error: 'No valid roles assigned',
            noValidRoles: true 
          };
        }
        
        setAvailableRoles(allowedRoles);
        
        const initialRole = allowedRoles[0];
        setCurrentRole(initialRole);
        
        const userData: AuthUser = {
          username: username,
          full_name: userDetails.data?.full_name || username.split('@')[0] || 'User',
          email: userDetails.data?.email || username,
          role: initialRole,
          roles: userDetails.data?.roles?.map((r: any) => r.role || r) || [],
          requiresPasswordReset: false // FIXED: Set to false after successful reset
        };

        setUser(userData);
        return { success: true };
      } else {
        setError(result.error || 'Password reset failed');
        return { success: false, error: result.error || 'Password reset failed' };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Check if it's a server connection error
      if (isServerConnectionError(error)) {
        setServerError(true);
        const errorMessage = 'Unable to connect to server. Please check your connection.';
        setError(errorMessage);
        return { success: false, error: errorMessage, serverError: true };
      }
      
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
      setServerError(false);
      await frappeAPI.logout();
      
      // Clear persisted role data
      if (user?.username) {
        localStorage.removeItem(`currentRole_${user.username}`);
      }
      localStorage.removeItem('isRoleSwitching');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
    } finally {
      setUser(null);
      setCurrentRole(null);
      setAvailableRoles([]);
      setError(null);
      setServerError(false);
      setLoading(false);
      setIsSwitchingRole(false);
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const clearError = () => {
    setError(null);
    setServerError(false);
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
    serverError, // Add server error to context value
    // CRITICAL FIX: Only authenticated if user exists AND doesn't need password reset AND has valid roles
    isAuthenticated: !!user && !user?.requiresPasswordReset && !!currentRole,
    needsPasswordReset: !!user?.requiresPasswordReset, // New property to check password reset status
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