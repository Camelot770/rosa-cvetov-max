import { create } from 'zustand';
import api from '../api/client';

interface User {
  id: number;
  telegramId?: string;
  maxId?: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
  bonusPoints: number;
  addresses: any[];
}

interface UserState {
  user: User | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/user/profile');
      set({ user: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
