// src/store/ticket-store.ts
import { create } from 'zustand';
import { ticketsAPI, Ticket } from '@/services/api';

interface TicketStore {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  fetchUserTickets: () => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set) => ({
  tickets: [],
  isLoading: false,
  error: null,
  fetchUserTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await ticketsAPI.getTickets();
      console.log('Fetched tickets:', response.data);
      set({ tickets: response.data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching tickets:', error.response?.data || error.message);
      set({ error: error.response?.data?.detail || 'Failed to fetch tickets', isLoading: false });
    }
  },
}));