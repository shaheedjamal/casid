import axios from 'axios';

const TOKEN_STORAGE_KEY = 'casid_admin_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      const isAuthEndpoint =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/setup');
      if (!isAuthEndpoint) {
        setStoredToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export function extractApiError(err: unknown, fallback = 'Request failed. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const serverMsg = err.response?.data?.error;
    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      return serverMsg;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
