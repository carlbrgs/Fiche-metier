import { NiveauBarres } from './NiveauBarres';
import type { MetierTransversale } from '@/types/api';

const SANS_GROUPE = 'Autres ressources';

/**
 * Valeur d'un `<select>` de la section. `''` n'est pas « non concerné » mais « la fiche ne
 * porte pas cette ressource » : une ligne absente ne doit pas être créée en base tant que
 * l'utilisateur n'a rien choisi pour elle. Seule la fiche D309 est dans ce cas (16 des 17
 * ressources du référentiel), mais inventer une donnée pour combler le trou serait pire.
 */
export const VALEUR_ABSENTE = '';
export const VALEUR_NON_CONCERNE = 'nc';

/** Valeur de départ d'une ressource, telle que la fiche la porte aujourd'hui. */
export function valeurInitiale(t: MetierTransversale): string {
  if (t.nonConcerne) return VALEUR_NON_CONCERNE;
  return t.niveau === null ? VALEUR_ABSENTE : String(t.niveau);
}

interface Edition {
  valeurs: Record<string, string>;
  onChange: (codeTransversale: string, valeur: string) => void;
  desactive: boolean;
}

interface Props {
  transversales: MetierTransversale[];
  /** Fourni uniquement en mode édition : remplace l'affichage par un sélecteur de niveau. */
  edition?: Edition;
}

const PALIERS = [1, 2, 3, 4];

/**
 * Description du niveau retenu : c'est le texte du palier correspondant.
 * Les 4 paliers sont communs à tous les métiers (référentiel `competence_transversale`) ;
 * seul celui qui est retenu change d'un métier à l'autre.
 */
function descriptionPalier(t: MetierTransversale, niveau: number | null): string | null {
  const c = t.competence;
  if (!c || niveau === null) return null;
  return [c.palier1, c.palier2, c.palier3, c.palier4][niveau - 1] ?? null;
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

/** Cellule d'édition : le niveau se choisit, le palier retenu s'affiche dessous. */
function CelluleEdition({ t, edition }: { t: MetierTransversale; edition: Edition }) {
  const valeur = edition.valeurs[t.codeTransversale] ?? valeurInitiale(t);
  const niveau = /^[1-4]$/.test(valeur) ? Number(valeur) : null;
  const description = descriptionPalier(t, niveau);

  return (
    <div className="transversales__edition">
      <select
        aria-label={`Niveau — ${t.competence?.libelle ?? t.codeTransversale}`}
        value={valeur}
        disabled={edition.desactive}
        onChange={(e) => edition.onChange(t.codeTransversale, e.target.value)}
      >
        {/* Proposé seulement tant que la ressource est absente : une fois un niveau choisi,
            on ne peut pas revenir à « non renseigné », la ligne existe désormais en base. */}
        {valeur === VALEUR_ABSENTE && <option value={VALEUR_ABSENTE}>— Non renseigné —</option>}
        <option value={VALEUR_NON_CONCERNE}>Non concerné</option>
        {PALIERS.map((n) => (
          <option key={n} value={String(n)}>
            Niveau {n}
          </option>
        ))}
      </select>

      {niveau !== null && (
        <p className="detail">{description ?? `Niveau ${niveau}`}</p>
      )}
    </div>
  );
}

export function TransversalesFiche({ transversales, edition }: Props) {
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
              {items.map((t) => (
                <tr key={t.codeTransversale}>
                  <th scope="row" className="transversales__ressource">
                    {t.competence?.libelle ?? t.codeTransversale}
                  </th>
                  <td>
                    {edition ? (
                      <CelluleEdition t={t} edition={edition} />
                    ) : t.nonConcerne || t.niveau === null ? (
                      <span className="detail">Non concerné</span>
                    ) : (
                      <div className="transversales__niveau">
                        <NiveauBarres niveau={t.niveau} />
                        {/* Le palier peut manquer dans le référentiel : on retombe
                            sur le numéro de niveau plutôt que d'afficher une case vide. */}
                        <p>{descriptionPalier(t, t.niveau) ?? `Niveau ${t.niveau}`}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
