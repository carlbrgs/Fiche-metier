import { apiGet } from './client';
import type { ExportGeneral } from '@/types/api';

export function obtenirExportGeneral(signal?: AbortSignal) {
  return apiGet<ExportGeneral>('/export/general', undefined, signal);
}
