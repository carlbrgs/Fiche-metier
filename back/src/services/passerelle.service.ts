import { QueryTypes } from 'sequelize';
import { sequelize } from '../database/connection';

export interface ParametresProximite {
  /** « Nombre d'heures max d'acquisition » (défaut 10 000 dans le classeur). */
  heuresMax: number;
  /** « Nombre min de domaines de connaissance commun » (défaut 1). */
  dcMin: number;
  /** « Nombre max de métiers à afficher » (défaut 15). */
  limite: number;
}

export interface MetierProche {
  codeMetier: string;
  intitule: string;
  codeFamille: string | null;
  dureeAcquisitionHeures: number | null;
  degreElargissement: number | null;
  nbDcCommuns: number | null;
}

/**
 * Lit la table matérialisée `metier_proximite`.
 * L'index (code_metier_source, duree_acquisition_heures) permet de servir le tri sans filesort.
 */
export async function trouverMetiersProches(
  codeMetier: string,
  { heuresMax, dcMin, limite }: ParametresProximite,
): Promise<MetierProche[]> {
  return sequelize.query<MetierProche>(
    `SELECT m.code_metier            AS codeMetier,
            m.intitule               AS intitule,
            m.code_famille           AS codeFamille,
            p.duree_acquisition_heures AS dureeAcquisitionHeures,
            p.degre_elargissement    AS degreElargissement,
            p.nb_dc_communs          AS nbDcCommuns
       FROM metier_proximite p
       JOIN metier m ON m.code_metier = p.code_metier_cible
      WHERE p.code_metier_source = :codeMetier
        AND p.code_metier_cible <> :codeMetier
        AND (p.duree_acquisition_heures IS NULL OR p.duree_acquisition_heures <= :heuresMax)
        AND (p.nb_dc_communs IS NULL OR p.nb_dc_communs >= :dcMin)
      ORDER BY p.duree_acquisition_heures ASC
      LIMIT :limite`,
    {
      replacements: { codeMetier, heuresMax, dcMin, limite },
      type: QueryTypes.SELECT,
    },
  );
}

export interface EcartConnaissance {
  codeFormacode: string;
  intitule: string;
  niveauSource: number | null;
  niveauCible: number | null;
  /** > 0 : à acquérir. <= 0 : déjà maîtrisé au niveau requis. */
  heuresAcquerir: number | null;
}

/**
 * Écart détaillé entre deux métiers, calculé à la volée depuis les domaines de connaissance
 * de leurs activités respectives (pas depuis la table matérialisée : on veut le détail).
 */
export async function comparerMetiers(
  codeSource: string,
  codeCible: string,
): Promise<{ ecarts: EcartConnaissance[]; totalHeures: number; nbDcCommuns: number }> {
  const ecarts = await sequelize.query<EcartConnaissance>(
    // Les connaissances pendent du couple (migration 008) : la jointure se fait sur son
    // identifiant. Le MAX retient le niveau le plus élevé quand un formacode revient sur
    // plusieurs couples du même métier.
    `WITH dc_source AS (
        SELECT ac.code_formacode, MAX(ac.niveau) AS niveau
          FROM metier_activite ma
          JOIN activite_connaissance ac ON ac.metier_activite_id = ma.id
         WHERE ma.code_metier = :codeSource
         GROUP BY ac.code_formacode
     ),
     dc_cible AS (
        SELECT ac.code_formacode, MAX(ac.niveau) AS niveau
          FROM metier_activite ma
          JOIN activite_connaissance ac ON ac.metier_activite_id = ma.id
         WHERE ma.code_metier = :codeCible
         GROUP BY ac.code_formacode
     )
     SELECT c.code_formacode AS codeFormacode,
            f.intitule       AS intitule,
            s.niveau         AS niveauSource,
            c.niveau         AS niveauCible,
            CASE
              WHEN s.niveau IS NOT NULL AND s.niveau >= c.niveau THEN 0
              ELSE COALESCE(fn_cible.duree_heures, 0) - COALESCE(fn_source.duree_heures, 0)
            END AS heuresAcquerir
       FROM dc_cible c
       JOIN formacode f ON f.code_formacode = c.code_formacode
       LEFT JOIN dc_source s ON s.code_formacode = c.code_formacode
       LEFT JOIN formacode_niveau fn_cible
              ON fn_cible.code_formacode = c.code_formacode
             AND fn_cible.niveau = c.niveau
       LEFT JOIN formacode_niveau fn_source
              ON fn_source.code_formacode = c.code_formacode
             AND fn_source.niveau = s.niveau
      ORDER BY heuresAcquerir DESC`,
    { replacements: { codeSource, codeCible }, type: QueryTypes.SELECT },
  );

  const totalHeures = ecarts.reduce((somme, e) => somme + Number(e.heuresAcquerir ?? 0), 0);
  const nbDcCommuns = ecarts.filter((e) => e.niveauSource !== null).length;

  return { ecarts, totalHeures, nbDcCommuns };
}

/**
 * Recalcule intégralement `metier_proximite` (333² ≈ 110 000 lignes).
 *
 * ⚠️ NON IMPLÉMENTÉ — la formule exacte du « degré d'élargissement » n'est pas déductible
 * des seules données : elle vit dans les formules de la feuille `Degre_Elargissement` et dans
 * le code VBA du classeur (xl/vbaProject.bin). Les valeurs observées sont des fractions
 * (0, 0.3333…), ce qui suggère un ratio de domaines de connaissance non partagés, mais le
 * dénominateur exact reste à confirmer avec le métier.
 *
 * `comparerMetiers()` ci-dessus fournit déjà le calcul de durée, qui est indépendant.
 * Voir docs/SCHEMA.md §5.
 */
export async function recalculerProximites(): Promise<never> {
  throw new Error(
    'recalculerProximites() : formule du degré d’élargissement à confirmer avec le métier ' +
      '(voir feuille Degre_Elargissement et docs/SCHEMA.md §5).',
  );
}
