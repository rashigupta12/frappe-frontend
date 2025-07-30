/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/account/ReceiptContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ReceiptSummary from './ReceiptSummary';
import { useAuth } from '../../context/AuthContext';
import { frappeAPI } from '../../api/frappeClient';
import type { Receipt } from './ReciptSummary';

const ReceiptContainer: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuth();
  const userEmail = user?.user?.username;

  // Fetch receipts received by the current user
  const fetchUserReceipts = useCallback(async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Option 1: Use the specific method for getting receipts by paid_by
      const response = await frappeAPI.getReceiptByPaidBy(userEmail);

      if (response?.data) {
        // The API returns only names, so we need to fetch full details for each receipt
        const receiptDetails = await Promise.all(
          response.data.map(async (item: { name: string }) => {
            const detailResponse = await frappeAPI.getReceiptById(item.name);
            return detailResponse.data;
          })
        );
        
        setReceipts(receiptDetails);
      }
      
      // Option 2: Alternative - use getAllReceipts with filters
      // const response = await frappeAPI.getAllReceipts({ paid_from: userEmail });
      // setReceipts(response?.data || []);
      
    } catch (err) {
      console.error('Error fetching user receipts:', err);
      setError('Failed to load receipts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Initial fetch
  useEffect(() => {
    fetchUserReceipts();
  }, [fetchUserReceipts]);

  // Handle delete receipt
  const handleDeleteReceipt = useCallback(async (receiptName: string) => {
    try {
      await frappeAPI.deleteReceipt(receiptName);

      // Remove from local state
      setReceipts(prev => prev.filter(r => r.name !== receiptName));
      
      // Or refresh the entire list
      // await fetchUserReceipts();
      
    } catch (err) {
      console.error('Error deleting receipt:', err);
      // You might want to show an error message to the user
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchUserReceipts();
  }, [fetchUserReceipts]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchUserReceipts}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Map receipts to payments, ensuring 'paid_to' exists (fallback to empty string if missing)
  const payments = receipts.map((receipt) => ({
    ...receipt,
    paid_to: (receipt as any).paid_to ?? '', // Adjust as needed based on your data shape
  }));

  return (
    <ReceiptSummary
      payments={payments}
      loading={loading}
      onDelete={handleDeleteReceipt}
      onRefresh={handleRefresh} 
      onEdit={function (payment): void {
        console.error('Edit function not implemented' + payment.name);
        throw new Error('Function not implemented.');
      }} 
      onOpenForm={function (): void {
        throw new Error('Function not implemented.');
      }}
    />
  );
};

export default ReceiptContainer;