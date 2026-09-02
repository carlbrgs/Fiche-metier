import { useState } from 'react';
import { listerCouplesAjoutables, listerVariantesCouple } from '@/api/metiers';
import { useFetch } from '@/hooks/useFetch';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';
import type { ActiviteAjoutable, VarianteCouple } from '@/types/api';

interface Props {
  codeMetier: string;
  /** Reçoit le couple à recopier ; le parent enchaîne l'appel d'ajout et le rechargement. */
  onAjouter: (variante: VarianteCouple) => void;
  onAnnuler: () => void;
  ajoutEnCours: boolean;
}

const VIDE: { data: ActiviteAjoutable[] } = { data: [] };

/**
 * Ajout d'un couple à une fiche, en deux temps.
 *
 * 1. Choisir le code activité, parmi celles que la fiche ne porte pas encore.
 * 2. Choisir la rédaction à recopier. Cette étape n'est pas cosmétique : depuis la
 *    migration 008 les domaines de connaissance pendent du couple et non du code activité,
 *    et pour 138 des 279 codes employés par plusieurs fiches, les formacodes diffèrent d'une
 *    fiche à l'autre. Les formacodes de chaque rédaction sont donc affichés — ce sont eux
 *    qui alimenteront le tableau des domaines structurants du métier.
 */
export function AjoutCouple({ codeMetier, onAjouter, onAnnuler, ajoutEnCours }: Props) {
  const [recherche, setRecherche] = useState('');
  const [rechercheValidee, setRechercheValidee] = useState('');
  const [codeChoisi, setCodeChoisi] = useState<string | null>(null);

  // La recherche n'est lancée qu'à la validation : le catalogue fait 1 350 lignes, une
  // requête par frappe n'apporterait rien ici.
  const ajoutables = useFetch(
    (signal) =>
      rechercheValidee
        ? listerCouplesAjoutables(codeMetier, rechercheValidee, signal)
        : Promise.resolve(VIDE),
    [codeMetier, rechercheValidee],
  );

  const variantes = useFetch(
    (signal) =>
      codeChoisi
        ? listerVariantesCouple(codeMetier, codeChoisi, signal)
        : Promise.resolve({ data: [] as VarianteCouple[] }),
    [codeMetier, codeChoisi],
  );

  return (
    <div className="ajout-couple">
      <div className="ajout-couple__entete">
        <h3>Ajouter un couple activité-compétence</h3>
        <button type="button" className="bouton--secondaire" onClick={onAnnuler}>
          Fermer
        </button>
      </div>

      <form
        className="ajout-couple__recherche"
        onSubmit={(e) => {
          e.preventDefault();
          setCodeChoisi(null);
          setRechercheValidee(recherche.trim());
        }}
      >
        <label htmlFor="ajout-couple-recherche">Chercher une activité</label>
        <input
          id="ajout-couple-recherche"
          type="search"
          value={recherche}
          placeholder="code ou intitulé, ex. « qualité »"
          onChange={(e) => setRecherche(e.target.value)}
        />
        <button type="submit" className="bouton--secondaire">
          Chercher
        </button>
      </form>

      {ajoutables.chargement && <Loader />}
      {ajoutables.erreur && <ErrorMessage message={ajoutables.erreur} />}

      {rechercheValidee && ajoutables.donnees?.data.length === 0 && (
        <p className="vide">
          Aucune activité disponible pour « {rechercheValidee} ». Les activités déjà portées
          par cette fiche sont exclues des résultats.
        </p>
      )}

      {(ajoutables.donnees?.data.length ?? 0) > 0 && (
        <ul className="ajout-couple__resultats">
          {ajoutables.donnees!.data.map((a) => (
            <li key={a.codeActivite}>
              <button
                type="button"
                className={
                  codeChoisi === a.codeActivite
                    ? 'ajout-couple__activite ajout-couple__activite--choisie'
                    : 'ajout-couple__activite'
                }
                onClick={() => setCodeChoisi(a.codeActivite)}
              >
                <span className="couple__code">{a.codeActivite}</span>
                <span className="ajout-couple__intitule">{a.intituleActivite}</span>
                <span className="detail">
                  {/* `COUNT()` peut remonter en chaîne selon le driver : on force le nombre
                      avant de décider de l'accord. */}
                  {Number(a.nbVariantes)} rédaction{Number(a.nbVariantes) > 1 ? 's' : ''}{' '}
                  disponible{Number(a.nbVariantes) > 1 ? 's' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {codeChoisi && (
        <div className="ajout-couple__variantes">
          <h4>Reprendre la rédaction de quelle fiche ?</h4>
          <p className="detail">
            Les domaines de connaissance sont propres à chaque fiche : ceux de la rédaction
            choisie seront recopiés sur ce métier et alimenteront son tableau de domaines
            structurants.
          </p>

          {variantes.chargement && <Loader />}
          {variantes.erreur && <ErrorMessage message={variantes.erreur} />}

          <ul className="liste">
            {(variantes.donnees?.data ?? []).map((v) => (
              <li key={v.coupleId} className="ajout-couple__variante">
                <div>
                  <strong>{v.intituleMetier}</strong>{' '}
                  <span className="couple__code">{v.codeMetier}</span>
                  <p className="detail">{v.intituleActivite ?? '—'}</p>
                  {v.formacodes.length === 0 ? (
                    <p className="detail">Aucun domaine de connaissance sur ce couple.</p>
                  ) : (
                    <ul className="badges">
                      {v.formacodes.map((f) => (
                        <li key={f.codeFormacode} className="badge">
                          {f.codeFormacode}
                          {f.niveau !== null && ` · niv. ${f.niveau}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  className="bouton--export"
                  onClick={() => onAjouter(v)}
                  disabled={ajoutEnCours}
                >
                  {ajoutEnCours ? 'Ajout…' : 'Reprendre'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
