// hooks/useServerStatus.ts
import { useState, useEffect } from 'react';

interface ServerStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export const useServerStatus = (checkInterval = 30000) => { // Check every 30 seconds
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isOnline: true, // Assume online initially
    isChecking: true,
    lastChecked: null,
    error: null
  });

  const checkServerHealth = async (): Promise<boolean> => {
    try {
      // Import the frappeAPI client
      const { frappeAPI } = await import('../api/frappeClient');
      
      // Use the health check method from frappeAPI
      const healthResult = await frappeAPI.healthCheck();
      return healthResult.healthy;
    } catch (error) {
      console.error('Server health check failed:', error);
      
      // Check if it's a network error (server completely down)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return false; // Network error - server is down
      }
      
      // Check if it's an abort error (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return false; // Timeout - consider server down
      }
      
      // Check for other connection-related errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const connectionErrors = [
        'network',
        'connection',
        'ECONNREFUSED',
        'ERR_NETWORK',
        'ERR_INTERNET_DISCONNECTED',
        'Failed to fetch',
        'NetworkError',
        'ERR_CONNECTION_REFUSED',
        'Server is not reachable'
      ];
      
      const isConnectionError = connectionErrors.some(pattern => 
        errorMessage.toLowerCase().includes(pattern.toLowerCase())
      );
      
      return !isConnectionError; // Return false if it's a connection error
    }
  };

  const performHealthCheck = async () => {
    setServerStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const isOnline = await checkServerHealth();
      setServerStatus({
        isOnline,
        isChecking: false,
        lastChecked: new Date(),
        error: isOnline ? null : 'Server is not responding'
      });
    } catch (error) {
      setServerStatus({
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // Initial health check
  useEffect(() => {
    performHealthCheck();
  }, []);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(performHealthCheck, checkInterval);
    return () => clearInterval(interval);
  }, [checkInterval]);

  // Manual refresh function
  const refreshStatus = () => {
    performHealthCheck();
  };

  return {
    ...serverStatus,
    refreshStatus
  };
};