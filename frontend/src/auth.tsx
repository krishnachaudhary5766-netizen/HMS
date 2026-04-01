import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "./lib/api";

type User = {
  id: number;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("hms_auth");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { access: string; refresh: string };
      setAuthToken(parsed.access);
      api
        .get<User>("/me/")
        .then((res) => setUser(res.data))
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const tokenRes = await api.post<{ access: string; refresh: string }>("/auth/token/", {
      username,
      password,
    });
    const { access, refresh } = tokenRes.data;
    localStorage.setItem("hms_auth", JSON.stringify({ access, refresh }));
    setAuthToken(access);
    const meRes = await api.get<User>("/me/");
    setUser(meRes.data);
  };

  const logout = () => {
    localStorage.removeItem("hms_auth");
    setAuthToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

