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

export async function apiGet<T>(
  chemin: string,
  params?: Record<string, ParamValue>,
  signal?: AbortSignal,
): Promise<T> {
  const reponse = await fetch(construireUrl(chemin, params), {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!reponse.ok) {
    const corps = await reponse.json().catch(() => null);
    throw new ApiError(
      reponse.status,
      corps?.error?.message ?? `Erreur ${reponse.status}`,
      corps?.error?.code,
    );
  }

  return reponse.json() as Promise<T>;
}
