import { API_BASE_URL } from '../config/api';
import { refreshSession } from './authRefresh';
import { usePaywallStore } from '../store/paywallStore';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Custom fetch client that handles:
 *  - Automatic absolute URL resolution (prepending API_BASE_URL)
 *  - Setting credentials: 'include' for secure HTTP-only cookies
 *  - Intercepting 401 Unauthorized errors and attempting silent token refresh
 *  - Retrying original request after successful token rotation
 */
export async function apiClient(
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  // Default headers and options
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, attempt token refresh and retry
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      // Retry original request
      response = await fetch(url, fetchOptions);
    }
  }

  // Intercept Plan Limit Exceeded errors for REST responses
  if (!response.ok) {
    try {
      const clone = response.clone();
      const errData = (await clone.json()) as {
        code?: string;
        message?: string;
      };
      // Check structured error code first (set by BadRequestException in subscription.service.ts)
      // Fall back to message string matching for legacy error shapes
      const isPlanLimitError =
        errData?.code === 'PLAN_LIMIT_EXCEEDED' ||
        (errData?.message?.includes('Plan limit exceeded') ?? false);

      if (isPlanLimitError) {
        let limitType: 'project' | 'member' | 'storage' = 'project';
        const msg = errData.message ?? '';
        if (msg.includes('member')) {
          limitType = 'member';
        } else if (msg.includes('storage')) {
          limitType = 'storage';
        }
        usePaywallStore.getState().openPaywall(limitType);
      }
    } catch {
      // Non-JSON or parsing error — ignore
    }
  }

  return response;
}

/** Helper wrapper for GET requests */
apiClient.get = (path: string, options?: RequestOptions) =>
  apiClient(path, { ...options, method: 'GET' });

/** Helper wrapper for POST requests */
apiClient.post = (path: string, body?: unknown, options?: RequestOptions) =>
  apiClient(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

/** Helper wrapper for PUT requests */
apiClient.put = (path: string, body?: unknown, options?: RequestOptions) =>
  apiClient(path, {
    ...options,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

/** Helper wrapper for PATCH requests */
apiClient.patch = (path: string, body?: unknown, options?: RequestOptions) =>
  apiClient(path, {
    ...options,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

/** Helper wrapper for DELETE requests */
apiClient.delete = (path: string, options?: RequestOptions) =>
  apiClient(path, { ...options, method: 'DELETE' });
