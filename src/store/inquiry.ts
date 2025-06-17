// import { create } from 'zustand';
// import { Inquiry } from './types';

// interface InquiryStore {
//   inquiries: Inquiry[];
//   loading: boolean;
//   error: string | null;
//   fetchInquiries: () => Promise<void>;
//   createInquiry: (inquiry: Inquiry) => Promise<void>;
//   updateInquiry: (id: string, inquiry: Partial<Inquiry>) => Promise<void>;
//   deleteInquiry: (id: string) => Promise<void>;
//   clearError: () => void;
// }

// export const useInquiryStore = create<InquiryStore>((set) => ({
//   inquiries: [],
//   loading: false,
//   error: null,

//   fetchInquiries: async () => {
//     set({ loading: true, error: null });
//     try {
//       const response = await fetch('/api/inquiries');
//       if (!response.ok) throw new Error('Failed to fetch inquiries');
//       const data = await response.json();
//       set({ inquiries: data });
//     } catch (error) {
//       set({ error: error instanceof Error ? error.message : 'Unknown error' });
//     } finally {
//       set({ loading: false });
//     }
//   },

//   createInquiry: async (inquiry) => {
//     set({ loading: true, error: null });
//     try {
//       const response = await fetch('/api/inquiries', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(inquiry),
//       });
//       if (!response.ok) throw new Error('Failed to create inquiry');
//       const newInquiry = await response.json();
//       set((state) => ({ inquiries: [...state.inquiries, newInquiry] }));
//     } catch (error) {
//       set({ error: error instanceof Error ? error.message : 'Unknown error' });
//       throw error;
//     } finally {
//       set({ loading: false });
//     }
//   },

//   updateInquiry: async (id, updates) => {
//     set({ loading: true, error: null });
//     try {
//       const response = await fetch(`/api/inquiries?id=${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(updates),
//       });
//       if (!response.ok) throw new Error('Failed to update inquiry');
//       const updatedInquiry = await response.json();
//       set((state) => ({
//         inquiries: state.inquiries.map((inq) =>
//           inq.id === id ? { ...inq, ...updatedInquiry } : inq
//         ),
//       }));
//     } catch (error) {
//       set({ error: error instanceof Error ? error.message : 'Unknown error' });
//       throw error;
//     } finally {
//       set({ loading: false });
//     }
//   },

//   deleteInquiry: async (id) => {
//     set({ loading: true, error: null });
//     try {
//       const response = await fetch(`/api/inquiries?id=${id}`, {
//         method: 'DELETE',
//       });
//       if (!response.ok) throw new Error('Failed to delete inquiry');
//       set((state) => ({
//         inquiries: state.inquiries.filter((inq) => inq.id !== id),
//       }));
//     } catch (error) {
//       set({ error: error instanceof Error ? error.message : 'Unknown error' });
//       throw error;
//     } finally {
//       set({ loading: false });
//     }
//   },

//   clearError: () => set({ error: null }),
// }));