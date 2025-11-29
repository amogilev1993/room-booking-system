import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Создаём экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Если refresh не удался, разлогиниваем
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refreshToken) => api.post('/auth/logout/', { refresh: refreshToken }),
  getMe: () => api.get('/auth/me/'),
  updateMe: (data) => api.patch('/auth/me/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// Schedule API
export const scheduleAPI = {
  getSchedule: (date) => api.get('/schedule/', { params: { date } }),
};

// Rooms API
export const roomsAPI = {
  list: (params) => api.get('/rooms/', { params }),
  get: (id) => api.get(`/rooms/${id}/`),
  create: (data) => api.post('/rooms/', data),
  update: (id, data) => api.patch(`/rooms/${id}/`, data),
  delete: (id) => api.delete(`/rooms/${id}/`),
};

// Bookings API
export const bookingsAPI = {
  list: (params) => api.get('/bookings/', { params }),
  get: (id) => api.get(`/bookings/${id}/`),
  create: (data) => api.post('/bookings/', data),
  delete: (id) => api.delete(`/bookings/${id}/`),
  my: (params) => api.get('/bookings/my/', { params }),
  getByToken: (token) => api.get(`/cancel/${token}/`),
  cancelByToken: (token) => api.delete(`/cancel/${token}/`),
};

// Admin Bookings API
export const adminBookingsAPI = {
  list: (params) => api.get('/admin/bookings/', { params }),
  delete: (id) => api.delete(`/admin/bookings/${id}/`),
};

export default api;
