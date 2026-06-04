import axios from 'axios';
import { API_BASE_URL } from '../constants/theme';
import { getToken, saveTokens, clearTokens } from './authStorage';

// ── Axios Instance với interceptors ──────────────────────────
// Tự động gắn token + auto refresh khi hết hạn

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào mỗi request
api.interceptors.request.use(async (config) => {
  const token = await getToken('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tự động refresh token khi hết hạn (401 + TOKEN_EXPIRED)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const refreshToken = await getToken('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        await saveTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original); // retry request gốc với token mới
      } catch {
        await clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
