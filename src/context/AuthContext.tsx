/* eslint-disable no-unused-vars */
// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { frappeAPI } from '../api/frappeClient'; // Adjust the import path as necessary

interface AuthUser {
  username: string;
  full_name: string;
}

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
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
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check localStorage for existing user data
      const storedUser = localStorage.getItem('frappe_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData.username);
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          localStorage.removeItem('frappe_user');
        }
      }
      
      // Always check with the server since Frappe uses session cookies
      const sessionCheck = await frappeAPI.checkSession();
      
      if (sessionCheck.authenticated) {
        // Session is valid, set user data
        setUser(sessionCheck.user);
        
        // Store basic info in localStorage for UI purposes
        const userData = {
          username: sessionCheck.user,
          full_name: sessionCheck.user // You can enhance this with more user data
        };
        localStorage.setItem('frappe_user', JSON.stringify(userData));
      } else {
        // Session is invalid, clear everything
        setUser(null);
        localStorage.removeItem('frappe_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('frappe_user');
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
      
      if (response.message === 'Logged In') {
        // After successful login, get complete user info
        try {
          const userInfo = await frappeAPI.getUserInfo();
          const userData = {
            username: userInfo.message || username,
            full_name: response.full_name || userInfo.full_name || 'User'
          };
          setUser(userInfo.message || username);
          
          // Store user data in localStorage
          localStorage.setItem('frappe_user', JSON.stringify(userData));
          
          return { success: true, user: userData };
        } catch (userInfoError) {
          console.error('Failed to get user info after login:', userInfoError);
          // Set basic user info from login response
          const basicUserData = {
            username: username,
            full_name: response.full_name || 'User'
          };
          setUser(username);
          localStorage.setItem('frappe_user', JSON.stringify(basicUserData));
          return { success: true, user: basicUserData };
        }
      } else {
        throw new Error(response.message || 'Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      interface ErrorWithResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      }
      
      const err = error as ErrorWithResponse;
      if (typeof error === 'object' && error !== null) {
        if ('response' in err && typeof err.response?.data?.message === 'string') {
          errorMessage = err.response!.data!.message!;
        } else if ('message' in err && typeof err.message === 'string') {
          errorMessage = err.message!;
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
      // Even if logout API fails, we should clear local state
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('frappe_user');
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};