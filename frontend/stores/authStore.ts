import { create } from 'zustand';
import api from '../services/api';
import { saveTokens, clearTokens, getToken } from '../services/authStorage';

// ══════════════════════════════════════════════════════════════════
// AUTH STORE — Quản lý trạng thái đăng nhập toàn cục (Zustand)
// ══════════════════════════════════════════════════════════════════

interface User {
  id: number;
  name: string;
  email: string;
  level: number;
  exp: number;
  exp_to_next: number;
  hp: number;
  max_hp: number;
  strength: number;
  speed: number;
  gold: string;
  avatar_original_url: string | null;
  avatar_pixel_url: string | null;
  sprite_idle_url: string | null;
  sprite_attack_url: string | null;
  sprite_hurt_url: string | null;
  sprite_status: 'none' | 'processing' | 'ready' | 'failed';
  party_id: number | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      const { accessToken, refreshToken, ...userData } = data.data;
      await saveTokens(accessToken, refreshToken);
      // Lấy full profile sau khi đăng ký (bao gồm RPG stats)
      const profile = await api.get('/auth/me');
      set({ user: profile.data.data, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, ...userData } = data.data;
      await saveTokens(accessToken, refreshToken);
      // Lấy full profile (bao gồm RPG stats)
      const profile = await api.get('/auth/me');
      set({ user: profile.data.data, isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, error: null });
  },

  // Chạy khi mở app: tự đăng nhập lại nếu có token cũ
  initialize: async () => {
    try {
      const token = await getToken('accessToken');
      if (token) {
        const { data } = await api.get('/auth/me');
        set({ user: data.data, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    } catch {
      await clearTokens();
      set({ isInitialized: true });
    }
  },

  // Refresh user data (gọi sau khi score habit, complete task...)
  refreshUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data });
    } catch {}
  },

  clearError: () => set({ error: null }),
}));
