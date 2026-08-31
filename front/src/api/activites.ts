import { apiGet } from './client';
import type { Activite, Formacode, Referentiels, PaginatedResponse } from '@/types/api';

export interface FiltresActivites {
  search?: string;
  famille?: string;
  formacode?: string;
  page?: number;
  limit?: number;
}

export function listerActivites(filtres: FiltresActivites, signal?: AbortSignal) {
  return apiGet<PaginatedResponse<Activite>>('/activites', { ...filtres }, signal);
}

export function obtenirActivite(code: string, signal?: AbortSignal) {
  return apiGet<Activite>(`/activites/${encodeURIComponent(code)}`, undefined, signal);
}

export interface FiltresFormacodes {
  search?: string;
  nsf?: string;
  fondamental?: boolean;
  page?: number;
  limit?: number;
}

export function listerFormacodes(filtres: FiltresFormacodes, signal?: AbortSignal) {
  return apiGet<PaginatedResponse<Formacode>>('/formacodes', { ...filtres }, signal);
}

export function obtenirFormacode(code: string, signal?: AbortSignal) {
  return apiGet<Formacode>(`/formacodes/${encodeURIComponent(code)}`, undefined, signal);
}

export function obtenirReferentiels(signal?: AbortSignal) {
  return apiGet<Referentiels>('/referentiels', undefined, signal);
}
