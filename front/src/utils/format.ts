import type { FamilleMetier } from '@/types/api';

/**
 * Libellé d'une famille métier préfixé de sa lettre : « A Conception, études, R&D… ».
 *
 * La lettre n'est pas stockée dans `intitule` — c'est déjà la clé primaire de la table.
 * La composer à l'affichage évite de la dupliquer en base, où elle finirait par diverger
 * du code au premier renommage.
 */
export function libelleFamille(
  famille: Pick<FamilleMetier, 'codeFamille' | 'intitule'> | null | undefined,
): string {
  if (!famille) return '';
  return `${famille.codeFamille} - ${famille.intitule}`;
}
