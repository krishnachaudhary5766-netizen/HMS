import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Basic auto-logout on 401 (token expired/invalid). Refresh flow can be added later.
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem("hms_auth");
      } catch {}
    }
    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

