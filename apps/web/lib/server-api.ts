import { ApiError, apiFetch } from './api';
import { getAccessToken } from './session';

export async function apiFetchWithSession<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError(401, 'Missing session');
  }

  return apiFetch<T>(path, init, token);
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export async function withSessionRedirect<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      const { redirect } = await import('next/navigation');
      redirect('/login');
    }

    throw error;
  }
}
