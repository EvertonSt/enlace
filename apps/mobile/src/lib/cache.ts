import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'enlace-cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple async cache backed by AsyncStorage.
 * - GET requests are cached with configurable TTL
 * - Cache is per-endpoint (keyed by URL)
 * - Stale data is served when offline
 * - Write operations (POST/PATCH/DELETE) are never cached
 */

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export async function isCacheFresh(key: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return false;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.timestamp < entry.ttl;
  } catch {
    return false;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Ignore
  }
}

/**
 * Cached fetch: tries network first, falls back to cache on failure.
 * Only caches GET requests. Returns { data, fromCache }.
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<{ data: T; fromCache: boolean }> {
  const method = (options.method ?? 'GET').toUpperCase();
  const cacheKey = url;

  if (method !== 'GET') {
    // Write operations — no caching, just fetch
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    // Invalidate related cache entries on write
    await clearCache();
    return { data: await res.json() as T, fromCache: false };
  }

  // GET — try network first
  try {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const data = await res.json() as T;

    // Store in cache (fire and forget)
    void setCache(cacheKey, data);
    return { data, fromCache: false };
  } catch {
    // Network failed — try cache
    const cached = await getCached<T>(cacheKey);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    throw new Error('No network and no cached data available');
  }
}
