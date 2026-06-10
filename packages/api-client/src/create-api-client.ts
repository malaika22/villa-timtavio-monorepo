import { ApiError } from './api-error';
import type { ApiClient, ApiClientConfig } from './types';

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const err = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(err.message)) return err.message.join(', ');
    if (typeof err.message === 'string') return err.message;
  } catch {
    // ignore JSON parse failures
  }
  return `Request failed: ${res.status}`;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const {
    baseUrl,
    getAccessToken,
    requestInterceptors = [],
    responseInterceptors = [],
    onUnauthorized,
  } = config;

  async function request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

    let init: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    for (const interceptor of requestInterceptors) {
      init = await interceptor(url, init);
    }

    let res = await fetch(url, init);

    for (const interceptor of responseInterceptors) {
      res = await interceptor(res, { url, init });
    }

    if (res.status === 401) {
      onUnauthorized?.();
      throw new ApiError(401, 'Unauthorized');
    }

    if (!res.ok) {
      throw new ApiError(res.status, await parseErrorMessage(res));
    }

    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'GET' }),

    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'POST',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),

    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, {
        ...init,
        method: 'PATCH',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      }),

    delete: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'DELETE' }),
  };
}
