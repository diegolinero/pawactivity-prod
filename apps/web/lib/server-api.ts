import { apiFetch } from './api';
import { getAccessToken } from './session';

export async function apiFetchWithSession<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Missing session');
  }

  return apiFetch<T>(path, init, token);
}
