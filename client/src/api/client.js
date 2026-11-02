import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/invalid token -> back to login (but not for a failed login attempt itself).
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Turns any axios error into a readable message from the API's { error: { message, details } } shape.
export function errorMessage(err) {
  const e = err.response?.data?.error;
  if (e?.details?.length) return e.details.map((d) => d.message).join('. ');
  return e?.message || err.message || 'Something went wrong';
}

export default api;
