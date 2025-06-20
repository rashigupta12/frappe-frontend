/* eslint-disable @typescript-eslint/no-explicit-any */
// contexts/AssignContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { frappeAPI } from '../api/frappeClient';

interface AssignContextType {
  loading: boolean;
  error: string | null;
  success: boolean;
  inspectors: Array<{ value: string; label: string }>;
  fetchInspectors: () => Promise<void>;
  assignInquiry: (inquiry: any, assignmentData: any) => Promise<void>;
  resetStatus: () => void;
}

const AssignContext = createContext<AssignContextType | undefined>(undefined);

export const AssignProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inspectors, setInspectors] = useState<Array<{ value: string; label: string }>>([]);

  // Wrap fetchInspectors with useCallback to prevent unnecessary re-renders
  const fetchInspectors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await frappeAPI.ispectionUser(); // Note: this should probably be renamed to 'inspectionUser'
      
      // Filter users who are likely inspectors (you might need to adjust this based on your user roles)
      const inspectorUsers = response.data.map((user: any) => ({
        value: user.name,
        label: user.full_name || user.name
      }));
      setInspectors(inspectorUsers);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch inspectors');
      console.error('Error fetching inspectors:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Wrap assignInquiry with useCallback as well
  const assignInquiry = useCallback(async (inquiry: any, assignmentData: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Update the lead
      await frappeAPI.updateLead(inquiry.name, {
        status: 'Open',
      });

      // Create ToDo - Add assigned_by field based on your requirement
      await frappeAPI.toDo({
        ...assignmentData,
        reference_type: 'Lead',
        reference_name: inquiry.name,
        assigned_by: assignmentData.assigned_by || 'Administrator', // You might want to get this from auth context
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign inquiry');
      console.error('Error assigning inquiry:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const resetStatus = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return (
    <AssignContext.Provider
      value={{
        loading,
        error,
        success,
        inspectors,
        fetchInspectors,
        assignInquiry,
        resetStatus
      }}
    >
      {children}
    </AssignContext.Provider>
  );
};

export const useAssign = () => {
  const context = useContext(AssignContext);
  if (!context) {
    throw new Error('useAssign must be used within an AssignProvider');
  }
  return context;
};