/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/account/PaymentContainer.tsx or similar parent component
import React, { useState, useEffect, useCallback } from 'react';
import PaymentSummary from './PaymentSummary';
import { useAuth } from '../../context/AuthContext';
import { frappeAPI } from '../../api/frappeClient';
import type { Payment } from './type';

// Import your API service
// import { paymentAPI } from '../../services/paymentAPI';

const PaymentContainer: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuth();
  const userEmail = user?.user?.username ;

  // Fetch payments made by the current user
  const fetchUserPayments = useCallback(async () => {
    if (!userEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Option 1: Use the specific method for getting payments by paid_by
      const response = await frappeAPI.getPaymentbypaidby(userEmail);
      
      if (response?.data) {
        // The API returns only names, so we need to fetch full details for each payment
        const paymentDetails = await Promise.all(
          response.data.map(async (item: { name: string }) => {
            const detailResponse = await frappeAPI.getPaymentbyId(item.name);
            return detailResponse.data;
          })
        );
        
        setPayments(paymentDetails);
      }
      
      // Option 2: Alternative - use getAllPayments with filters
      // const response = await paymentAPI.getAllPayments({ paid_by: userEmail });
      // setPayments(response?.data || []);
      
    } catch (err) {
      console.error('Error fetching user payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Initial fetch
  useEffect(() => {
    fetchUserPayments();
  }, [fetchUserPayments]);

  // Handle edit payment
  // const handleEditPayment = useCallback((payment: Payment) => {
  //   // Open edit form/modal with payment data
    
  //   // You can implement your edit logic here
  // }, []);

  // Handle delete payment
  const handleDeletePayment = useCallback(async (paymentName: string) => {
    try {
      await frappeAPI.deletePayment(paymentName);

      // Remove from local state
      setPayments(prev => prev.filter(p => p.name !== paymentName));
      
      // Or refresh the entire list
      // await fetchUserPayments();
      
    } catch (err) {
      console.error('Error deleting payment:', err);
      // You might want to show an error message to the user
    }
  }, []);

 

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchUserPayments();
  }, [fetchUserPayments]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchUserPayments}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <PaymentSummary
      payments={payments}
      loading={loading}
      // onEdit={handleEditPayment}
      onDelete={handleDeletePayment}
      // onOpenForm={handleOpenForm}
      onRefresh={handleRefresh} onEdit={function (payment: Payment): void {
        console.error('Edit function not implemented' + payment.name);
        throw new Error('Function not implemented.');
      } } onOpenForm={function (): void {
        throw new Error('Function not implemented.');
      } }    />
  );
};

export default PaymentContainer;