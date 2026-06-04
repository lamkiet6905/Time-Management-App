export const API_BASE_URL = 'http://172.20.10.6:3000'; // IP máy tính — đổi theo mạng
// export const API_BASE_URL = 'http://10.0.2.2:3000'; // Android emulator
// export const API_BASE_URL = 'http://localhost:3000';  // iOS simulator

export const Colors = {
  brand: {
    violet: '#8A2BE2',
    violetLight: '#B088F9',
    violetDark: '#4B0082',
    gold: '#FFC107', // Màu vàng đặc trưng Brain Out
    goldLight: '#FFE066',
    red: '#FF4D4D',
    cyan: '#00CED1',
    emerald: '#4CAF50', // Xanh lá cây (dấu tick)
  },
  bg: {
    primary: '#FFFFFF', // Trắng sáng
    secondary: '#F5F5F5', // Xám nhạt
    card: '#FFFFFF', // Card trắng
    elevated: '#F0F0F0',
  },
  text: {
    primary: '#000000', // Chữ đen đặc
    secondary: '#555555', // Chữ xám
    muted: '#888888',
  },
  border: {
    default: '#000000', // Viền đen đặc trưng
    bright: '#333333',
  },
  status: {
    error: '#FF4D4D',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#00CED1',
  },
  // HP Bar gradient colors
  hp: {
    full: '#4CAF50',
    medium: '#FFC107',
    low: '#FF4D4D',
  },
};

export const DoodleStyle = {
  borderWidth: 2.5,
  borderColor: '#000000',
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5, // cho Android
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const FontSize = {
  xs: 11, sm: 13, base: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36,
};
