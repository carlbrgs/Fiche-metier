import { NiveauBarres } from './NiveauBarres';
import type { MetierTransversale } from '@/types/api';

const SANS_GROUPE = 'Autres ressources';

/**
 * Description du niveau retenu : c'est le texte du palier correspondant.
 * Les 4 paliers sont communs à tous les métiers (référentiel `competence_transversale`) ;
 * seul celui qui est retenu change d'un métier à l'autre.
 */
function descriptionPalier(t: MetierTransversale): string | null {
  const c = t.competence;
  if (!c || t.niveau === null) return null;
  return [c.palier1, c.palier2, c.palier3, c.palier4][t.niveau - 1] ?? null;
}

/** Regroupe en conservant l'ordre du référentiel, celui de la fiche métier Excel. */
function grouper(transversales: MetierTransversale[]): Array<[string, MetierTransversale[]]> {
  const tries = [...transversales].sort(
    (a, b) => (a.competence?.ordre ?? 0) - (b.competence?.ordre ?? 0),
  );

  const groupes = new Map<string, MetierTransversale[]>();
  for (const t of tries) {
    const cle = t.competence?.groupe ?? SANS_GROUPE;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(t);
  }
  return [...groupes.entries()];
}

export function TransversalesFiche({ transversales }: { transversales: MetierTransversale[] }) {
  if (transversales.length === 0) return null;

  return (
    <>
      {grouper(transversales).map(([groupe, items]) => (
        <div key={groupe} className="transversales__groupe">
          <h3 className="transversales__titre">{groupe}</h3>

          <table className="tableau tableau--transversales">
            <thead>
              <tr>
                <th scope="col">Ressource</th>
                <th scope="col">Niveau d’approfondissement de la ressource retenu</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const description = descriptionPalier(t);
                return (
                  <tr key={t.codeTransversale}>
                    <th scope="row" className="transversales__ressource">
                      {t.competence?.libelle ?? t.codeTransversale}
                    </th>
                    <td>
                      {t.nonConcerne || t.niveau === null ? (
                        <span className="detail">Non concerné</span>
                      ) : (
                        <div className="transversales__niveau">
                          <NiveauBarres niveau={t.niveau} />
                          {/* Le palier peut manquer dans le référentiel : on retombe
                              sur le numéro de niveau plutôt que d'afficher une case vide. */}
                          <p>{description ?? `Niveau ${t.niveau}`}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
