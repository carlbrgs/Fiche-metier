import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from './client';
import type {
  Metier,
  Couple,
  MetierProche,
  MetierOption,
  MetierTransversale,
  ConnaissanceMetier,
  ActiviteAjoutable,
  VarianteCouple,
  EtatProximites,
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

/** Tous les métiers (champs minimaux), pour un sélecteur — voir PasserellesPage. */
export function listerMetiersOptions(signal?: AbortSignal) {
  return apiGet<{ data: MetierOption[] }>('/metiers/options', undefined, signal);
}

export function obtenirMetier(code: string, signal?: AbortSignal) {
  return apiGet<Metier>(`/metiers/${encodeURIComponent(code)}`, undefined, signal);
}

/** Champs simples uniquement — pas les listes (appellations, ROME, conditions, couples…). */
export interface ModificationMetier {
  definition?: string | null;
  remarque?: string | null;
  responsTransverse?: 'oui' | 'non' | null;
  interfaceAmontAval?: string | null;
}

export function modifierMetier(code: string, modification: ModificationMetier, signal?: AbortSignal) {
  return apiPatch<Metier>(`/metiers/${encodeURIComponent(code)}`, modification, signal);
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

// ---------- Édition des ressources transverses ----------

export interface NiveauTransversale {
  codeTransversale: string;
  /** 1 à 4 — les quatre paliers du référentiel. `null` si « non concerné ». */
  niveau: number | null;
  nonConcerne: boolean;
}

/**
 * Écrit les niveaux en bloc (PUT) : la section s'enregistre d'un seul geste. La réponse
 * signale si le changement a périmé les passerelles — seuls TRANSV_2, 8 et 10 y entrent.
 */
export function modifierTransversales(
  code: string,
  transversales: NiveauTransversale[],
  signal?: AbortSignal,
) {
  return apiPut<{ data: MetierTransversale[]; proximitePerimee: boolean }>(
    `/metiers/${encodeURIComponent(code)}/transversales`,
    { transversales },
    signal,
  );
}

// ---------- Édition des couples activité-compétence ----------

/** Le catalogue des activités que cette fiche ne porte pas encore. */
export function listerCouplesAjoutables(code: string, search: string, signal?: AbortSignal) {
  return apiGet<{ data: ActiviteAjoutable[] }>(
    `/metiers/${encodeURIComponent(code)}/couples-ajoutables`,
    { search },
    signal,
  );
}

/**
 * Les rédactions existantes d'un code activité, chacune avec ses formacodes. L'ajout en
 * recopie une : les domaines de connaissance pendent du couple, pas du code activité, et
 * diffèrent d'une fiche à l'autre pour la moitié des codes partagés.
 */
export function listerVariantesCouple(code: string, codeActivite: string, signal?: AbortSignal) {
  return apiGet<{ data: VarianteCouple[] }>(
    `/metiers/${encodeURIComponent(code)}/couples-ajoutables/${encodeURIComponent(codeActivite)}`,
    undefined,
    signal,
  );
}

export function ajouterCouple(code: string, coupleSourceId: number, signal?: AbortSignal) {
  return apiPost<Couple>(
    `/metiers/${encodeURIComponent(code)}/couples`,
    { coupleSourceId },
    signal,
  );
}

export function supprimerCouple(code: string, coupleId: number, signal?: AbortSignal) {
  return apiDelete(`/metiers/${encodeURIComponent(code)}/couples/${coupleId}`, signal);
}

/** Les passerelles affichées sur cette fiche datent-elles d'avant sa dernière modification ? */
export function obtenirEtatProximites(code: string, signal?: AbortSignal) {
  return apiGet<EtatProximites>(
    `/metiers/${encodeURIComponent(code)}/proximites/etat`,
    undefined,
    signal,
  );
}

/** Rejoue le calcul complet (~110 000 lignes) — plusieurs secondes. */
export function recalculerProximites(signal?: AbortSignal) {
  return apiPost<{ lignes: number; calculeLe: string }>(
    '/passerelles/recalculer',
    undefined,
    signal,
  );
}

export interface ParametresProximite {
  heuresMax?: number;
  dcMin?: number;
  /** Exclut les régressions (défaut 0,1 côté API) : un métier moins qualifiant n'est pas un élargissement. */
  degreMin?: number;
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
