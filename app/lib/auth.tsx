"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// ✅ Daftar username yang dianggap admin — tambah username lain jika perlu
const ADMIN_USERNAMES = ["admin", "superadmin"];

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("komik_token");
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: User = await res.json();
        console.log("👤 User:", data.username);
        console.log("🔐 isAdmin:", ADMIN_USERNAMES.includes(data.username));
        setUser(data);
      } else {
        console.warn("⚠️ Token tidak valid, logout otomatis");
        localStorage.removeItem("komik_token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("komik_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || "Username atau password salah");
    }
    const data = await res.json();
    const accessToken: string = data.access_token;
    localStorage.setItem("komik_token", accessToken);
    setToken(accessToken);
    await fetchCurrentUser(accessToken);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || "Registrasi gagal");
      }
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { });
    }
    localStorage.removeItem("komik_token");
    setToken(null);
    setUser(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    const t = token ?? localStorage.getItem("komik_token");
    if (t) await fetchCurrentUser(t);
  }, [token]);

  const isAdmin = !!user && ADMIN_USERNAMES.includes(user.username);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isLoggedIn: !!user,
        isAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}