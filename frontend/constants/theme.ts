// Theme colors and design tokens for LifeRPG
export const Colors = {
  // Background layers
  bg: {
    primary: '#0D0D1A',
    secondary: '#12122A',
    card: '#1A1A35',
    elevated: '#22224A',
    overlay: 'rgba(13, 13, 26, 0.85)',
  },
  // Brand purple/blue gradient
  brand: {
    purple: '#7B5EA7',
    violet: '#9B6FD4',
    blue: '#4A90D9',
    indigo: '#5C6BC0',
  },
  // RPG colors
  rpg: {
    hp: '#FF4D6D',
    hpBg: '#3D1A24',
    hpGlow: 'rgba(255, 77, 109, 0.4)',
    exp: '#F4A261',
    expBg: '#3D2A10',
    expGlow: 'rgba(244, 162, 97, 0.4)',
    level: '#FFD700',
    streak: '#FF6B35',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
  // Difficulty colors
  difficulty: {
    easy: '#4CAF50',
    normal: '#2196F3',
    hard: '#FF9800',
    epic: '#E91E63',
  },
  // Rarity colors
  rarity: {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
  },
  // Priority
  priority: {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
  },
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B8B8D4',
    muted: '#6B6B8A',
    accent: '#A78BFA',
  },
  // Status
  status: {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  },
  // Borders
  border: {
    default: 'rgba(123, 94, 167, 0.3)',
    bright: 'rgba(123, 94, 167, 0.6)',
    gold: 'rgba(255, 215, 0, 0.4)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const API_BASE_URL = 'http://192.168.1.12:3000/api'; // Used for physical phone connection
