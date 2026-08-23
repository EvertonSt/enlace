/**
 * Typed fetch wrapper shared by web, desktop, and mobile frontends.
 * Every call goes through this single gateway so auth tokens and base URL
 * are managed in one place.
 */

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}

let config: ApiClientConfig = {
  baseUrl: 'http://localhost:3001',
};

export function configureApiClient(overrides: Partial<ApiClientConfig>): void {
  config = { ...config, ...overrides };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = config.getToken?.();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${config.baseUrl}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(res.status, `API error ${res.status}: ${res.statusText}`, body);
  }

  return res.json() as Promise<T>;
}

// Convenience methods -------------------------------------------------------

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),

  post: <T>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data: unknown) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string) => apiFetch<T>(endpoint, { method: 'DELETE' }),
};
