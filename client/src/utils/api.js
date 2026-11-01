import axios from "axios";
import { clearSession, getSession } from "./session";

const api = axios.create();

api.interceptors.request.use((config) => {
  const session = getSession();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = /\/api\/auth\/(login|register)$/.test(err.config?.url || "");
    if (err.response?.status === 401 && !isAuthCall) {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
