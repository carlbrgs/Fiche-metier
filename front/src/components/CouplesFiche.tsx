import type { Couple, Detail } from '@/types/api';

const ORDINAUX = ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième'];

function ordinal(n: number): string {
  return ORDINAUX[n - 1] ?? `${n}ᵉ`;
}

function ListeDetails({ details }: { details: Detail[] }) {
  if (details.length === 0) return <span className="detail">—</span>;

  return (
    <ul className="couple__details">
      {[...details]
        .sort((a, b) => a.ordre - b.ordre)
        .map((d) => (
          <li key={d.id}>{d.libelle}</li>
        ))}
    </ul>
  );
}

/**
 * Les couples activité-compétence du métier. Leur nombre varie d'une fiche à l'autre
 * (3 à 6 selon le métier), l'outil de collecte prévoyant 6 blocs au maximum.
 *
 * Les deux colonnes ne sont pas appariées ligne à ligne : une activité peut compter
 * 6 tâches détaillées face à 4 compétences détaillées. Chaque colonne porte donc sa
 * propre liste, comme sur la fiche Excel.
 */
export function CouplesFiche({ couples }: { couples: Couple[] }) {
  if (couples.length === 0) return null;

  return (
    <>
      {[...couples]
        .sort((a, b) => a.ordre - b.ordre)
        .map((c) => (
          <article key={c.id} className="couple">
            <header className="couple__entete">
              <span>{ordinal(c.ordre)} couple activité-compétence professionnelles</span>
              <span className="couple__code">{c.codeActivite}</span>
            </header>

            <table className="tableau couple__table">
              <thead>
                <tr>
                  <th scope="col">{c.intituleActivite ?? 'Activité'}</th>
                  <th scope="col">{c.intituleCompetence ?? 'Compétence'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <ListeDetails details={c.detailsActivite ?? []} />
                  </td>
                  <td>
                    <ListeDetails details={c.detailsCompetence ?? []} />
                  </td>
                </tr>
              </tbody>
            </table>

            {(c.motsCles ?? []).length > 0 && (
              <div className="couple__mots">
                <span className="couple__mots-titre">
                  Mots clés du couple activité-compétence
                </span>
                <ul className="badges">
                  {c.motsCles!.map((m) => (
                    <li key={m.id} className="badge">
                      {m.libelle}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
    </>
  );
}
