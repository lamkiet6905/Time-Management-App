import { create } from 'zustand';
import api from '../services/api';

// ══════════════════════════════════════════════════════════════════
// CHARACTER STORE — Quản lý chỉ số nhân vật RPG (Zustand)
// ══════════════════════════════════════════════════════════════════

interface BuffInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  effect: number;
}

interface Buff {
  buff_type: string;
  unlock_level: number;
  is_active: boolean;
  info: BuffInfo;
}

interface CharacterProfile {
  id: number;
  name: string;
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
  sprite_status: string;
  party_id: number | null;
  buffs: Buff[];
}

interface CharacterState {
  profile: CharacterProfile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/character/profile');
      set({ profile: data.data, isLoading: false });
    } catch (err) {
      console.error('Lỗi fetch character profile:', err);
      set({ isLoading: false });
    }
  },
}));
