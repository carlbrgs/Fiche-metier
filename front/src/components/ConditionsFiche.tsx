import type { MetierCondition } from '@/types/api';

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
export function ConditionsFiche({ conditions }: { conditions: MetierCondition[] }) {
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
        {triees.map((c) => (
          <tr key={c.codeCondition}>
            <th scope="row" className="conditions__libelle">
              {c.critere?.libelle ?? c.codeCondition}
            </th>
            <td className="colonne-croix">
              {c.valeur === 'non_significatif' && <span className="croix">X</span>}
            </td>
            <td className="colonne-croix">
              {c.valeur === 'significatif' && <span className="croix">X</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
