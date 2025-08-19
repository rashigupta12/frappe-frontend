/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { frappeAPI } from '../api/frappeClient';

interface ImageAttachment {
  remarks: string;
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

interface ReceiptFormData {
  date: string;
  bill_number: string;
  amountaed: string;
  paid_by: string;
  paid_from: string;
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
  custom_ifscibanswift_code: string; // Added field for IFSC/IBAN/SWIFT code
  custom_account_holder_name: string; // Added field for account holder name
}

interface ReceiptStoreActions {
  setField: <K extends keyof ReceiptFormData>(field: K, value: ReceiptFormData[K]) => void;
  uploadAndAddAttachment: (file: File) => Promise<{
    success: boolean;
    file_url?: any;
    file_name?: any;
    data?: any;
    error?: string;
  }>;
  removeAttachment: (index: number) => void;
  fetchSuppliers: () => Promise<void>;
  submitPayment: () => Promise<{ success: boolean; error?: string; data?: any }>;
  resetForm: () => void;
}

const initialState: ReceiptFormData = {
  date: new Date().toISOString().split('T')[0],
  bill_number: '',
  amountaed: '',
  paid_by: '',
  paid_from: '',
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
  custom_ifscibanswift_code: '', // Initialize IFSC/IBAN/SWIFT code field
  custom_account_holder_name: '', // Initialize account holder name field
};

export const useReceiptStore = create<ReceiptFormData & ReceiptStoreActions>((set, get) => ({
  ...initialState,

  setField: (field, value) => set({ [field]: value }),

  uploadAndAddAttachment: async (file: File) => {
    set({ isUploading: true, error: null });
    try {
      // Upload the file first to get the URL
      const uploadResponse = await frappeAPI.upload(file, {});

      console.log('Upload response:', uploadResponse); // Debug log

      // Create the attachment object in the format expected by the backend
      // Handle both possible response structures
      const fileData = uploadResponse.data.message || uploadResponse.data;
      
      if (!fileData.file_url) {
        throw new Error('File URL not found in upload response');
      }

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
        remarks: file.name || '' // Use the original file name as remarks
      };

      // Add to the attachments array
      set((state) => ({ 
        custom_attachments: [...state.custom_attachments, attachment],
        isUploading: false 
      }));

      // IMPORTANT: Return the upload response so handleImageUpload can use it
      return {
        success: true,
        file_url: fileData.file_url,
        file_name: fileData.name || file.name,
        data: fileData
      };
    } catch (error) {
      console.error('File upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      set({ error: errorMessage, isUploading: false });
      
      // Return error response
      return {
        success: false,
        error: errorMessage
      };
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
      paid_from,
      custom_purpose_of_payment,
      custom_mode_of_payment,
      custom_name_of_bank,
      custom_account_number,
      custom_card_number,
      custom_attachments,
      custom_ifscibanswift_code,
      custom_account_holder_name,
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

      // Prepare base receipt data
      const receiptData: Record<string, any> = {
        date,
        bill_number,
        amountaed: parseFloat(amountaed),
        paid_by,
        paid_from,
        custom_purpose_of_payment,
        custom_mode_of_payment,
        doctype: "EITS Payment",
        custom_attachments: formattedAttachments, // Use formatted attachments
      };

      // Add conditional fields based on payment mode
      if (custom_mode_of_payment === 'Bank') {
        receiptData.custom_name_of_bank = custom_name_of_bank;
        receiptData.custom_account_number = custom_account_number;
        receiptData.custom_ifscibanswift_code = custom_ifscibanswift_code; // Add IFSC/IBAN/SWIFT code
        receiptData.custom_account_holder_name = custom_account_holder_name; // Add account holder name
      } else if (custom_mode_of_payment === 'Credit Card') {
        receiptData.custom_name_of_bank = custom_name_of_bank;
        receiptData.custom_card_number = custom_card_number;
      }

      // Create the receipt record with attachments
      const receiptResponse = await frappeAPI.createReceipt(receiptData);

      // Reset form after successful submission
      set(initialState);
      
      set({ isLoading: false });
      return { success: true, data: receiptResponse.data };
    } catch (error) {
      console.error('Receipt submission failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Receipt submission failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  resetForm: () => set(initialState),
}));