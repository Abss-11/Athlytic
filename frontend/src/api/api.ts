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

export const dashboardApi = {
  getAthleteDashboard: () => api.get("/dashboard/athlete"),
  getCoachDashboard: () => api.get("/dashboard/coach"),
};

export const nutritionApi = {
  list: () => api.get("/nutrition"),
  create: (payload: Record<string, unknown>) => api.post("/nutrition", payload),
};

export const workoutApi = {
  list: () => api.get("/workouts"),
  create: (payload: Record<string, unknown>) => api.post("/workouts", payload),
};

export const runningApi = {
  list: () => api.get("/running"),
  create: (payload: Record<string, unknown>) => api.post("/running", payload),
};

export const goalApi = {
  list: () => api.get("/goals"),
  create: (payload: Record<string, unknown>) => api.post("/goals", payload),
};

export const communityApi = {
  list: () => api.get("/community"),
  create: (payload: Record<string, unknown>) => api.post("/community", payload),
};

export default api;
