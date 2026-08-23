import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Customer {
  id: string;
  name: string;
  planId: string;
  plan?: {
    id: string;
    name: string;
    speedMbps: number;
    dataCapGb: number | null;
    price: number;
    currency: string;
  };
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  apiFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('enlace-token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('enlace-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full user data on mount if token exists
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setCustomer(data.customer);
          localStorage.setItem('enlace-user', JSON.stringify(data));
        } else {
          // Token invalid
          setToken(null);
          setUser(null);
          setCustomer(null);
          localStorage.removeItem('enlace-token');
          localStorage.removeItem('enlace-user');
        }
      } catch {
        // Server unavailable — keep existing user data
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
      localStorage.setItem('enlace-token', data.token);
      localStorage.setItem('enlace-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCustomer(data.customer);
      return {};
    } catch {
      // Server unavailable — demo mode
      const mockUser = { id: 'cust-001', name: 'Everton S. Andrade', email, role: 'customer' };
      localStorage.setItem('enlace-token', 'demo-token');
      localStorage.setItem('enlace-user', JSON.stringify(mockUser));
      setToken('demo-token');
      setUser(mockUser);
      return {};
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('enlace-token');
    localStorage.removeItem('enlace-user');
    setToken(null);
    setUser(null);
    setCustomer(null);
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
    <AuthContext.Provider value={{ token, user, customer, loading, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
