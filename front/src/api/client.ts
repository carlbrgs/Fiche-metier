const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ParamValue = string | number | boolean | undefined | null;

function construireUrl(chemin: string, params?: Record<string, ParamValue>): string {
  const url = new URL(`${BASE_URL}${chemin}`, window.location.origin);
  for (const [cle, valeur] of Object.entries(params ?? {})) {
    // On omet les filtres vides plutôt que d'envoyer `?famille=` que le back devrait ignorer.
    if (valeur !== undefined && valeur !== null && valeur !== '') {
      url.searchParams.set(cle, String(valeur));
    }
  }
  return url.pathname + url.search;
}

/**
 * Une session expirée (401) renvoie tout le monde à `/login` plutôt que de laisser chaque
 * page afficher son propre message d'erreur cryptique — c'est le seul statut qui concerne
 * l'authentification plutôt que la donnée demandée.
 */
function gererExpirationSession(status: number): void {
  if (status === 401 && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export async function apiGet<T>(
  chemin: string,
  params?: Record<string, ParamValue>,
  signal?: AbortSignal,
): Promise<T> {
  const reponse = await fetch(construireUrl(chemin, params), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  });

  if (!reponse.ok) {
    gererExpirationSession(reponse.status);
    const corps = await reponse.json().catch(() => null);
    throw new ApiError(
      reponse.status,
      corps?.error?.message ?? `Erreur ${reponse.status}`,
      corps?.error?.code,
    );
  }

  return reponse.json() as Promise<T>;
}

async function envoyer<T>(
  methode: 'POST' | 'PATCH' | 'PUT',
  chemin: string,
  corps?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const reponse = await fetch(construireUrl(chemin), {
    method: methode,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'include',
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
    signal,
  });

  if (!reponse.ok) {
    gererExpirationSession(reponse.status);
    const corpsErreur = await reponse.json().catch(() => null);
    throw new ApiError(
      reponse.status,
      corpsErreur?.error?.message ?? `Erreur ${reponse.status}`,
      corpsErreur?.error?.code,
    );
  }

  return reponse.json() as Promise<T>;
}

export function apiPost<T>(chemin: string, corps?: unknown, signal?: AbortSignal): Promise<T> {
  return envoyer<T>('POST', chemin, corps, signal);
}

export function apiPatch<T>(chemin: string, corps?: unknown, signal?: AbortSignal): Promise<T> {
  return envoyer<T>('PATCH', chemin, corps, signal);
}

/** Remplacement d'un ensemble complet — voir les niveaux transverses, écrits en bloc. */
export function apiPut<T>(chemin: string, corps?: unknown, signal?: AbortSignal): Promise<T> {
  return envoyer<T>('PUT', chemin, corps, signal);
}

/**
 * Une suppression répond 204 sans corps : `envoyer()` ne convient pas, son `response.json()`
 * final lèverait sur une réponse vide.
 */
export async function apiDelete(chemin: string, signal?: AbortSignal): Promise<void> {
  const reponse = await fetch(construireUrl(chemin), {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal,
  });

  if (!reponse.ok) {
    gererExpirationSession(reponse.status);
    const corpsErreur = await reponse.json().catch(() => null);
    throw new ApiError(
      reponse.status,
      corpsErreur?.error?.message ?? `Erreur ${reponse.status}`,
      corpsErreur?.error?.code,
    );
  }
}
