import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 12_000,
});

let accessToken: string | null = localStorage.getItem('accessToken');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem('refreshToken', token);
  else localStorage.removeItem('refreshToken');
}

function isAuthUrl(url?: string) {
  return /\/auth\/(login|refresh|logout|forgot-password|reset-password)/.test(url ?? '');
}

function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);
    if (error.response?.status === 401 && !original._retry && !isAuthUrl(original.url)) {
      original._retry = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearSession();
        return Promise.reject(error);
      }
      if (!refreshing) {
        refreshing = api
          .post('/auth/refresh', { refreshToken })
          .then((r) => {
            const token = r.data.data?.accessToken ?? r.data.accessToken;
            const refresh = r.data.data?.refreshToken ?? r.data.refreshToken;
            setAccessToken(token);
            setRefreshToken(refresh);
            return (token as string) ?? null;
          })
          .catch(() => {
            clearSession();
            return null;
          })
          .finally(() => {
            refreshing = null;
          });
      }
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(payload: { data?: T; success?: boolean } | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default api;
