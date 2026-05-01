import { create } from 'zustand';
import api from '../services/api';
import { saveTokens, clearTokens, getToken } from '../services/authStorage';

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  exp: number;
  exp_to_next: number;
  hp: number;
  max_hp: number;
  streak_days: number;
  total_tasks_completed: number;
  pending_level_up: boolean;
  active_buffs: any[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, display_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await saveTokens(data.data.accessToken, data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Đăng nhập thất bại', isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password, display_name) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { username, email, password, display_name });
      await saveTokens(data.data.accessToken, data.data.refreshToken);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Đăng ký thất bại', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = await getToken('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.get('/user/profile');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
  },

  clearError: () => set({ error: null }),
}));
