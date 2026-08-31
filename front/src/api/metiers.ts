import { apiGet } from './client';
import type {
  Metier,
  Couple,
  MetierProche,
  ConnaissanceMetier,
  PaginatedResponse,
} from '@/types/api';

export interface FiltresMetiers {
  /** Cherche dans le code métier, l'intitulé et la définition. */
  search?: string;
  famille?: string;
  dossier?: number;
  /** Code ROME exact, ex. « A1413 ». */
  rome?: string;
  page?: number;
  limit?: number;
}

export function listerMetiers(filtres: FiltresMetiers, signal?: AbortSignal) {
  return apiGet<PaginatedResponse<Metier>>('/metiers', { ...filtres }, signal);
}

export function obtenirMetier(code: string, signal?: AbortSignal) {
  return apiGet<Metier>(`/metiers/${encodeURIComponent(code)}`, undefined, signal);
}

/** Les couples activité-compétence de la fiche, dans l'ordre des blocs de collecte. */
export function obtenirActivitesMetier(code: string, signal?: AbortSignal) {
  return apiGet<{ data: Couple[] }>(
    `/metiers/${encodeURIComponent(code)}/activites`,
    undefined,
    signal,
  );
}

/** Domaines de connaissance du métier, déjà dédoublonnés au niveau le plus élevé. */
export function obtenirConnaissancesMetier(code: string, signal?: AbortSignal) {
  return apiGet<{ data: ConnaissanceMetier[] }>(
    `/metiers/${encodeURIComponent(code)}/connaissances`,
    undefined,
    signal,
  );
}

export interface ParametresProximite {
  heuresMax?: number;
  dcMin?: number;
  limite?: number;
}

export function listerMetiersProches(
  code: string,
  parametres: ParametresProximite,
  signal?: AbortSignal,
) {
  return apiGet<{ data: MetierProche[] }>(
    `/passerelles/${encodeURIComponent(code)}/proches`,
    { ...parametres },
    signal,
  );
}
