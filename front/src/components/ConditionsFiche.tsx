import type { MetierCondition } from '@/types/api';

type ValeurCondition = 'significatif' | 'non_significatif';

interface Edition {
  valeurs: Record<string, ValeurCondition>;
  onChange: (codeCondition: string, valeur: ValeurCondition) => void;
  desactive: boolean;
}

interface Props {
  conditions: MetierCondition[];
  /** Fourni uniquement en mode édition : remplace les croix par des cases à cocher. */
  edition?: Edition;
}

/**
 * Les 15 conditions d'exercice, avec une croix dans la colonne retenue — même
 * présentation que la fiche métier Excel.
 *
 * Toutes les conditions sont affichées, y compris les non significatives : « non
 * significatif » est une réponse, pas une absence de réponse. N'afficher que les
 * significatives ferait disparaître la moitié de l'information.
 *
 * Le balisage `scope="row"` / `scope="col"` suffit à rendre la croix intelligible à la
 * voix : la cellule est annoncée avec l'intitulé de sa ligne et de sa colonne.
 */
export function ConditionsFiche({ conditions, edition }: Props) {
  if (conditions.length === 0) return null;

  const triees = [...conditions].sort(
    (a, b) => (a.critere?.ordre ?? 0) - (b.critere?.ordre ?? 0),
  );

  return (
    <table className="tableau tableau--conditions">
      <thead>
        <tr>
          <th scope="col">Condition</th>
          <th scope="col" className="colonne-croix">
            Non significatif
          </th>
          <th scope="col" className="colonne-croix">
            Significatif
          </th>
        </tr>
      </thead>
      <tbody>
        {triees.map((c) => {
          const libelle = c.critere?.libelle ?? c.codeCondition;
          const valeur = edition ? (edition.valeurs[c.codeCondition] ?? c.valeur) : c.valeur;
          return (
            <tr key={c.codeCondition}>
              <th scope="row" className="conditions__libelle">
                {libelle}
              </th>
              <td className="colonne-croix">
                {edition ? (
                  <input
                    type="radio"
                    name={`condition-${c.codeCondition}`}
                    aria-label={`${libelle} — non significatif`}
                    checked={valeur === 'non_significatif'}
                    disabled={edition.desactive}
                    onChange={() => edition.onChange(c.codeCondition, 'non_significatif')}
                  />
                ) : (
                  valeur === 'non_significatif' && <span className="croix">X</span>
                )}
              </td>
              <td className="colonne-croix">
                {edition ? (
                  <input
                    type="radio"
                    name={`condition-${c.codeCondition}`}
                    aria-label={`${libelle} — significatif`}
                    checked={valeur === 'significatif'}
                    disabled={edition.desactive}
                    onChange={() => edition.onChange(c.codeCondition, 'significatif')}
                  />
                ) : (
                  valeur === 'significatif' && <span className="croix">X</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
