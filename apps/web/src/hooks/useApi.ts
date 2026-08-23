import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface UseApiOptions {
  immediate?: boolean;
  headers?: Record<string, string>;
}

interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  execute: (body?: unknown) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions = {},
): UseApiResult<T> {
  const { immediate = false, headers = {} } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (body?: unknown): Promise<T | null> => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('enlace-token');
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: body ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errBody.error ?? `HTTP ${res.status}`);
        }

        const json = (await res.json()) as T;
        setData(json);
        return json;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return null;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, headers],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) void execute();
    return () => { abortRef.current?.abort(); };
  }, [immediate, execute]);

  return { data, error, loading, execute, reset };
}

export function useApiGet<T>(endpoint: string): UseApiResult<T> {
  return useApi<T>(endpoint, { immediate: true });
}
