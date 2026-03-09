// TaskManager Frontend - Axios API client setup with interceptors

import axios, { type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _silent?: boolean;
    _retry?: boolean;
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Geçersiz istek',
  403: 'Bu işlem için yetkiniz yok',
  404: 'İstenen kaynak bulunamadı',
  409: 'Çakışma - kayıt zaten mevcut',
  422: 'Doğrulama hatası',
  429: 'Çok fazla istek, lütfen bekleyin',
  500: 'Sunucu hatası, lütfen tekrar deneyin',
  502: 'Servis şu an erişilemez',
  503: 'Servis bakımda',
};

let lastToastTime = 0;
const TOAST_THROTTLE_MS = 3000;

const isAuthRequest = (url?: string) =>
  url?.includes('/api/auth/login') || url?.includes('/api/auth/register') || url?.includes('/api/auth/refresh');

const isSilentRequest = (config?: InternalAxiosRequestConfig) =>
  config?._silent === true;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    if (isAuthRequest(requestUrl)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest?._retry) {
      if (originalRequest) originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (isSilentRequest(originalRequest)) {
      return Promise.reject(error);
    }

    if (status && status !== 401) {
      const now = Date.now();
      if (now - lastToastTime > TOAST_THROTTLE_MS) {
        lastToastTime = now;
        const serverMsg = error.response?.data?.message || error.response?.data?.error;
        const msg = serverMsg || ERROR_MESSAGES[status] || `Hata (${status})`;
        toast.error(msg);
      }
    } else if (!error.response) {
      const now = Date.now();
      if (now - lastToastTime > TOAST_THROTTLE_MS) {
        lastToastTime = now;
        toast.error('Sunucuya bağlanılamıyor');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
