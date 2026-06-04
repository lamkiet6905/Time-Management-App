import * as SecureStore from 'expo-secure-store';

// ── Quản lý tokens trong SecureStore ────────────────────────
// SecureStore mã hóa data, an toàn hơn AsyncStorage

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
}

export async function getToken(key: 'accessToken' | 'refreshToken') {
  return await SecureStore.getItemAsync(key);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
