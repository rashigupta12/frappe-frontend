/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { frappeAPI } from '../api/frappeClient';

interface AuthUser {
  username: string;
  full_name: string;
  role: string;
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
});

const mapUserToRole = (username: string, fullName: string): string => {
 
  
  // First try to map from full_name if it exists
  if (fullName && fullName.trim() !== '') {
    const roleMap: Record<string, string> = {
      'Sales': 'sales',
      'User': 'user',
      'Admin': 'admin',
      'Administrator': 'admin',
      'Sales Rep': 'sales',
      'Sales Representative': 'sales',
      'Customer': 'user',
      'Client': 'user',
      'Inspector': 'inspector',
      'Site Inspector': 'inspector',
      'Quality Inspector': 'inspector',
      'Field Inspector': 'inspector'
    };
    
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
    if (normalizedName.includes('sales')) return 'sales';
    if (normalizedName.includes('admin')) return 'admin';
    if (normalizedName.includes('inspector')) return 'inspector';
  }
  
  // Fallback to username-based mapping when full_name is empty
  const usernameToRoleMap: Record<string, string> = {
    // Exact username matches
    'sales_rep@eits.com': 'sales',
    'admin@eits.com': 'admin',
    'user@eits.com': 'user',
    'site_inspector@eits.com': 'inspector',
    'quality_inspector@eits.com': 'inspector',
    'field_inspector@eits.com': 'inspector',
    'inspector@eits.com': 'inspector',
    
    // Pattern-based matches
    'inspection_': 'inspector',
    '_inspector': 'inspector'
  };
  
  // Try exact username match first
  if (usernameToRoleMap[username]) {
    return usernameToRoleMap[username];
  }
  
  // Try pattern matching on username
  const lowerUsername = username.toLowerCase();
  
  if (lowerUsername.includes('sales') || lowerUsername.includes('sale')) {
    
    return 'sales';
  }
  
  if (lowerUsername.includes('admin')) {
   
    return 'admin';
  }
  
  if (lowerUsername.includes('inspector') || lowerUsername.includes('inspection')) {
    
    return 'inspector';
  }
  
  
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
      
      if (sessionCheck.authenticated) {
        const username = sessionCheck.user?.username || sessionCheck.user || '';
        const fullName = sessionCheck.user?.full_name || '';
        const mappedRole = mapUserToRole(username, fullName);
        
        const userData: AuthUser = {
          username: username,
          full_name: fullName,
          role: mappedRole
        };
        
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
        
        // Use our enhanced mapping function
        const mappedRole = mapUserToRole(responseUsername, fullName);
        
        const userData: AuthUser = {
          username: responseUsername,
          full_name: fullName,
          role: mappedRole
        };
        

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};