import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { cachedFetch, clearCache } from './cache';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

// SecureStore keys
const TOKEN_KEY = 'enlace-token';
const USER_KEY = 'enlace-user';
const CRED_EMAIL_KEY = 'enlace-cred-email';
const CRED_PASS_KEY = 'enlace-cred-pass';
const BIOMETRIC_ENABLED_KEY = 'enlace-biometric-enabled';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
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
  isOnline: boolean;
  /** Whether biometric credentials are stored and ready to use */
  hasBiometricCredentials: boolean;
  setOnline: (online: boolean) => void;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  /** Login using stored credentials (for biometric re-auth) */
  loginWithStoredCredentials: () => Promise<{ error?: string }>;
  /** Store credentials for future biometric login */
  storeCredentials: (email: string, password: string) => Promise<void>;
  /** Clear stored credentials */
  clearStoredCredentials: () => Promise<void>;
  logout: () => void;
  apiFetch: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  // Restore session on mount + check for stored biometric credentials
  useEffect(() => {
    async function restore() {
      try {
        // Check if biometric credentials exist
        const storedEmail = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
        setHasBiometricCredentials(!!storedEmail);

        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Validate token
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            setCustomer(data.customer);
          } else if (res.status === 401 || res.status === 403) {
            // Token invalid — clear
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            setToken(null);
            setUser(null);
            setCustomer(null);
          }
        }
      } catch {
        // Offline — keep stored session data
      } finally {
        setLoading(false);
      }
    }
    void restore();
  }, []);

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
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCustomer(data.customer);
      return {};
    } catch {
      return { error: 'Cannot reach server — login requires network' };
    }
  }, []);

  /**
   * Login using previously stored credentials (after biometric auth succeeds).
   */
  const loginWithStoredCredentials = useCallback(async () => {
    const email = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(CRED_PASS_KEY);

    if (!email || !password) {
      return { error: 'No stored credentials found' };
    }

    return login(email, password);
  }, [login]);

  /**
   * Store email + password in SecureStore for future biometric re-login.
   */
  const storeCredentials = useCallback(async (email: string, password: string) => {
    await SecureStore.setItemAsync(CRED_EMAIL_KEY, email);
    await SecureStore.setItemAsync(CRED_PASS_KEY, password);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    setHasBiometricCredentials(true);
  }, []);

  /**
   * Clear stored credentials (disable biometric login).
   */
  const clearStoredCredentials = useCallback(async () => {
    await SecureStore.deleteItemAsync(CRED_EMAIL_KEY);
    await SecureStore.deleteItemAsync(CRED_PASS_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    setHasBiometricCredentials(false);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    // Keep stored credentials so biometric login still works after re-login
    await clearCache();
    setToken(null);
    setUser(null);
    setCustomer(null);
  }, []);

  const apiFetch = useCallback(async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = `${API_URL}${endpoint}`;
    const { data } = await cachedFetch<T>(url, { ...options, headers });
    return data;
  }, [token]);

  const setOnline = useCallback((online: boolean) => {
    setIsOnline(online);
  }, []);

  return (
    <AuthContext.Provider value={{
      token, user, customer, loading, isOnline, hasBiometricCredentials,
      setOnline, login, loginWithStoredCredentials, storeCredentials, clearStoredCredentials, logout, apiFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
