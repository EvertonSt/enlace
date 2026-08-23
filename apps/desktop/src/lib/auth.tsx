import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  apiFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enlace-noc-token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('enlace-noc-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    async function fetchMe() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.role !== 'staff') { throw new Error('Not staff'); }
          setUser(data);
          localStorage.setItem('enlace-noc-user', JSON.stringify(data));
        } else {
          setToken(null); setUser(null);
          localStorage.removeItem('enlace-noc-token');
          localStorage.removeItem('enlace-noc-user');
        }
      } catch {
        setToken(null); setUser(null);
        localStorage.removeItem('enlace-noc-token');
        localStorage.removeItem('enlace-noc-user');
      } finally {
        setLoading(false);
      }
    }
    void fetchMe();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error ?? 'Login failed' };
      }
      const data = await res.json();
      if (data.user?.role !== 'staff') {
        return { error: 'Staff access required' };
      }
      localStorage.setItem('enlace-noc-token', data.token);
      localStorage.setItem('enlace-noc-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: 'Cannot reach server' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('enlace-noc-token');
    localStorage.removeItem('enlace-noc-user');
    setToken(null);
    setUser(null);
  }, []);

  const apiFetch = useCallback(async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
