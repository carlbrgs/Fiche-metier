import { apiGet, apiPost } from './client';

export function connecter(identifiants: { username: string; password: string }) {
  return apiPost<{ authentifie: boolean }>('/auth/login', identifiants);
}

export function deconnecter() {
  return apiPost<{ authentifie: boolean }>('/auth/logout');
}

export function obtenirSession(signal?: AbortSignal) {
  return apiGet<{ authentifie: boolean }>('/auth/me', undefined, signal);
}
