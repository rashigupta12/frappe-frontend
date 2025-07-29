/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { frappeAPI } from '../api/frappeClient';
import { useAuth } from '../context/AuthContext';

interface ImageAttachment {
  name?: string;
  image: string;
  idx?: number;
  doctype?: string;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;
}

interface PaymentFormData {
  date: string;
  bill_number: string;
  amountaed: string;
  paid_by: string;
  paid_to: string;
  custom_purpose_of_payment: string;
  custom_mode_of_payment: 'Cash' | 'Bank' | 'Credit Card' | 'Credit' | '';
  custom_name_of_bank: string;
  custom_account_number: string;
  custom_card_number: string;
  custom_attachments: ImageAttachment[];
  suppliers: { label: string; value: string }[];
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
}

interface PaymentStoreActions {
  setField: <K extends keyof PaymentFormData>(field: K, value: PaymentFormData[K]) => void;
  uploadAndAddAttachment: (file: File) => Promise<void>;
  removeAttachment: (index: number) => void;
  fetchSuppliers: () => Promise<void>;
  submitPayment: () => Promise<{ success: boolean; error?: string; data?: any }>;
  resetForm: () => void;
}

const initialState: PaymentFormData = {
  date: new Date().toISOString().split('T')[0],
  bill_number: '',
  amountaed: '0.00',
  paid_by: '',
  paid_to: '',
  custom_purpose_of_payment: '',
  custom_mode_of_payment: '',
  custom_name_of_bank: '',
  custom_account_number: '',
  custom_card_number: '',
  custom_attachments: [],
  suppliers: [],
  isLoading: false,
  error: null,
  isUploading: false,
};

export const usePaymentStore = create<PaymentFormData & PaymentStoreActions>((set, get) => ({
  ...initialState,

  setField: (field, value) => set({ [field]: value }),

  uploadAndAddAttachment: async (file: File) => {
    set({ isUploading: true, error: null });
    try {
      // Upload the file first to get the URL
      const uploadResponse = await frappeAPI.upload(file, {
        folder: "Home",
        is_private: true,
      });

      console.log('Upload response:', uploadResponse); // Debug log

      // Create the attachment object in the format expected by the backend
      // Handle both possible response structures
      const fileData = uploadResponse.data.message || uploadResponse.data;
      const attachment: ImageAttachment = {
        image: fileData.file_url, // Use the correct path from upload response
        doctype: "Image Attachments",
        // Store additional metadata that might be useful
        name: fileData.name,
        owner: fileData.owner,
        creation: fileData.creation,
        modified: fileData.modified,
        modified_by: fileData.modified_by,
        docstatus: fileData.docstatus,
      };

      // Add to the attachments array
      set((state) => ({ 
        custom_attachments: [...state.custom_attachments, attachment],
        isUploading: false 
      }));
    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      set({ error: errorMessage, isUploading: false });
    }
  },
  

  removeAttachment: (index) =>
    set((state) => ({
      custom_attachments: state.custom_attachments.filter((_, i) => i !== index),
    })),

  fetchSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await frappeAPI.getSupplier();
      const suppliers = response.data.map((supplier: any) => ({
        label: supplier.name,
        value: supplier.name,
      }));
      set({ suppliers, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch suppliers', isLoading: false });
    }
  },

  submitPayment: async () => {
    const {
      date,
      bill_number,
      amountaed,
      paid_by,
      paid_to,
      custom_purpose_of_payment,
      custom_mode_of_payment,
      custom_name_of_bank,
      custom_account_number,
      custom_card_number,
      custom_attachments,
    } = get();

    set({ isLoading: true, error: null });

    try {
      // Prepare the attachments in the correct format for submission
      const formattedAttachments = custom_attachments.map((attachment, index) => ({
        image: attachment.image,
        doctype: "Image Attachments",
        idx: index + 1, // Set proper index for child table
        // Don't include parent fields here as they will be set by the backend
      }));

      // Prepare base payment data
      const paymentData: Record<string, any> = {
        date,
        bill_number,
        amountaed: parseFloat(amountaed),
        paid_by,
        paid_to,
        custom_purpose_of_payment,
        custom_mode_of_payment,
        doctype: "EITS Payment",
        custom_attachments: formattedAttachments, // Use formatted attachments
      };

      // Add conditional fields based on payment mode
      if (custom_mode_of_payment === 'Bank') {
        paymentData.custom_name_of_bank = custom_name_of_bank;
        paymentData.custom_account_number = custom_account_number;
      } else if (custom_mode_of_payment === 'Credit Card') {
        paymentData.custom_name_of_bank = custom_name_of_bank;
        paymentData.custom_card_number = custom_card_number;
      }

      // Create the payment record with attachments
      const paymentResponse = await frappeAPI.createPayment(paymentData);

      // Reset form after successful submission
      set(initialState);
      
      set({ isLoading: false });
      return { success: true, data: paymentResponse.data };
    } catch (error) {
      console.error('Payment submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment submission failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  resetForm: () => set(initialState),
}));