import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("athlytic-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authApi = {
  login: (payload: { email: string; password: string; role: string }) => api.post("/auth/login", payload),
  register: (payload: { name: string; email: string; password: string; role: string; sport?: string }) =>
    api.post("/auth/register", payload),
};

export const profileApi = {
  getMe: () => api.get("/profile/me"),
  updateMe: (payload: Record<string, unknown>) => api.put("/profile/me", payload),
};

export const dashboardApi = {
  getAthleteDashboard: () => api.get("/dashboard/athlete"),
  getCoachDashboard: () => api.get("/dashboard/coach"),
  getNotifications: () => api.get("/dashboard/notifications"),
};

export const nutritionApi = {
  list: () => api.get("/nutrition"),
  summary: () => api.get("/nutrition/summary"),
  create: (payload: Record<string, unknown>) => api.post("/nutrition", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/nutrition/${id}`, payload),
  remove: (id: string) => api.delete(`/nutrition/${id}`),
};

export const workoutApi = {
  list: () => api.get("/workouts"),
  create: (payload: Record<string, unknown>) => api.post("/workouts", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/workouts/${id}`, payload),
  remove: (id: string) => api.delete(`/workouts/${id}`),
};

export const runningApi = {
  list: () => api.get("/running"),
  create: (payload: Record<string, unknown>) => api.post("/running", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/running/${id}`, payload),
  remove: (id: string) => api.delete(`/running/${id}`),
  delete: (id: string) => api.delete(`/running/${id}`),
};

export const sleepApi = {
  list: () => api.get("/sleep"),
  summary: () => api.get("/sleep/summary"),
  create: (payload: Record<string, unknown>) => api.post("/sleep", payload),
  update: (id: string, payload: Record<string, unknown>) => api.put(`/sleep/${id}`, payload),
  remove: (id: string) => api.delete(`/sleep/${id}`),
};

export const goalApi = {
  list: () => api.get("/goals"),
  create: (payload: Record<string, unknown>) => api.post("/goals", payload),
};

export const communityApi = {
  list: () => api.get("/community"),
  create: (payload: Record<string, unknown>) => api.post("/community", payload),
};

export const reportsApi = {
  getWeeklyReports: () => api.get("/reports/weekly"),
};

export const integrationApi = {
  syncProvider: (provider: string) => api.post(`/integrations/sync/${provider}`),
};

export const coachApi = {
  getAthletes: () => api.get("/coach/athletes"),
  updateNotes: (athleteId: string, notes: string) => api.put(`/coach/athletes/${athleteId}/notes`, { notes }),
};

export const biomarkerApi = {
  list: () => api.get("/biomarkers"),
  create: (payload: Record<string, unknown>) => api.post("/biomarkers", payload),
  remove: (id: string) => api.delete(`/biomarkers/${id}`),
};

export default api;
