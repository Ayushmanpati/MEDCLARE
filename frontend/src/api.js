import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('medclare_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Reports
export const uploadReport = (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || 'Medical Report');
    return api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const listReports = () => api.get('/reports/');
export const getReport = (id) => api.get(`/reports/${id}`);
export const processReport = (id, level = 'standard', lang = 'en') =>
    api.post(`/reports/${id}/process`, { personalization_level: level, lang });

// Verification
export const verifyReport = (id, action, notes) =>
    api.post(`/reports/${id}/verify`, { action, notes });
export const editExplanation = (id, text, notes) =>
    api.post(`/reports/${id}/edit`, { explanation_text: text, notes });
export const getVersions = (id) => api.get(`/reports/${id}/versions`);

export default api;
