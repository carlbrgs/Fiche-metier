import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenirVariantes, harmoniserCouple } from '@/api/activites';
import { ApiError } from '@/api/client';
import { useFetch } from '@/hooks/useFetch';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';
import type { VarianteDetaillee } from '@/types/api';

function Details({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="detail">—</span>;
  return (
    <ul className="couple__details">
      {items.map((d, i) => (
        <li key={i}>{d}</li>
      ))}
    </ul>
  );
}

interface Edition {
  intituleActivite: string;
  intituleCompetence: string;
  /** Une ligne de texte = un détail ; découpé au moment d'appliquer. */
  detailsActivite: string;
  detailsCompetence: string;
  /** Index 0..3 = niveaux 1..4 ; case vide = niveau non retenu. */
  niveaux: [string, string, string, string];
}

function editionDepuis(v: VarianteDetaillee): Edition {
  const niveaux: [string, string, string, string] = ['', '', '', ''];
  for (const n of v.niveauxMaitrise) {
    if (n.niveau >= 1 && n.niveau <= 4) niveaux[n.niveau - 1] = n.description;
  }
  return {
    intituleActivite: v.intituleActivite ?? '',
    intituleCompetence: v.intituleCompetence ?? '',
    detailsActivite: v.detailsActivite.join('\n'),
    detailsCompetence: v.detailsCompetence.join('\n'),
    niveaux,
  };
}

function lignes(texte: string): string[] {
  return texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function IncoherenceDetailPage() {
  const { code = '' } = useParams();
  const [recharger, setRecharger] = useState(0);
  const [selectionneId, setSelectionneId] = useState<number | null>(null);
  const [edition, setEdition] = useState<Edition | null>(null);
  const [applicationEnCours, setApplicationEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const variantes = useFetch((signal) => obtenirVariantes(code, signal), [code, recharger]);

  const donnees = variantes.donnees?.data ?? [];
  const totalMetiers = donnees.reduce((somme, v) => somme + v.metiers.length, 0);
  const selectionnee = donnees.find((v) => v.coupleModeleId === selectionneId) ?? null;

  function choisir(v: VarianteDetaillee) {
    // Re-cliquer sur la rédaction déjà choisie revient en arrière plutôt que de forcer à en
    // sélectionner une autre pour se raviser.
    if (selectionneId === v.coupleModeleId) {
      setSelectionneId(null);
      setEdition(null);
    } else {
      setSelectionneId(v.coupleModeleId);
      setEdition(editionDepuis(v));
    }
    setErreur(null);
  }

  async function appliquer() {
    if (!selectionnee || !edition) return;
    const nbAutres = totalMetiers - selectionnee.metiers.length;
    if (
      !window.confirm(
        `Appliquer cette rédaction aux ${nbAutres} autre(s) métier(s) qui portent ${code} ? ` +
          'Leurs détails, niveaux de maîtrise et domaines de connaissance actuels seront ' +
          'remplacés (les mots-clés ne sont pas touchés). Cette action est définitive.',
      )
    ) {
      return;
    }
    setApplicationEnCours(true);
    setErreur(null);
    try {
      await harmoniserCouple(code, selectionnee.coupleModeleId, {
        intituleActivite: edition.intituleActivite.trim() || null,
        intituleCompetence: edition.intituleCompetence.trim() || null,
        detailsActivite: lignes(edition.detailsActivite),
        detailsCompetence: lignes(edition.detailsCompetence),
        niveauxMaitrise: edition.niveaux
          .map((description, i) => ({ niveau: i + 1, description: description.trim() }))
          .filter((n) => n.description.length > 0),
      });
      setSelectionneId(null);
      setEdition(null);
      setRecharger((v) => v + 1);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Application impossible');
    } finally {
      setApplicationEnCours(false);
    }
  }

  return (
    <div className="page">
      <Link to="/activites/incoherences" className="lien-retour">
        ← Retour aux incohérences
      </Link>
      <h1>{code}</h1>
      <p className="fiche__famille">
        Choisissez d’abord une rédaction (« Partir de cette description »), modifiez-la si
        besoin, puis appliquez-la à tous les métiers concernés — une confirmation est demandée
        avant toute écriture. Les domaines de connaissance ne sont pas modifiables ici : ils
        sont repris tels quels de la rédaction choisie.
      </p>

      {erreur && <ErrorMessage message={erreur} />}
      {variantes.erreur && <ErrorMessage message={variantes.erreur} />}
      {variantes.chargement && <Loader />}

      {selectionnee && edition && (
        <div className="bandeau-alerte">
          <span>
            Rédaction retenue : « {edition.intituleActivite || 'Sans intitulé'} ». Elle sera
            appliquée aux {totalMetiers} métiers qui portent {code} (actuellement portée par{' '}
            {selectionnee.metiers.length}).
          </span>
          <div className="fiche__entete-boutons">
            <button
              type="button"
              className="bouton--secondaire"
              onClick={() => {
                setSelectionneId(null);
                setEdition(null);
              }}
              disabled={applicationEnCours}
            >
              Annuler la sélection
            </button>
            <button
              type="button"
              className="bouton--export"
              onClick={appliquer}
              disabled={applicationEnCours}
            >
              {applicationEnCours ? 'Application…' : 'Appliquer à tous'}
            </button>
          </div>
        </div>
      )}

      {variantes.donnees &&
        (donnees.length <= 1 ? (
          <p className="vide">Toutes les rédactions de ce code sont désormais identiques.</p>
        ) : (
          donnees.map((v) => {
            const estSelectionnee = v.coupleModeleId === selectionneId;
            return (
              <section
                key={v.coupleModeleId}
                className={
                  estSelectionnee ? 'fiche__section fiche__section--selectionnee' : 'fiche__section'
                }
              >
                <div className="fiche__entete-ligne">
                  <h2>{v.intituleActivite ?? 'Sans intitulé'}</h2>
                  <button
                    type="button"
                    className={estSelectionnee ? 'bouton--export' : 'bouton--secondaire'}
                    onClick={() => choisir(v)}
                    disabled={applicationEnCours}
                  >
                    {estSelectionnee ? 'Sélectionnée ✓' : 'Partir de cette description'}
                  </button>
                </div>

                <p className="detail">
                  Portée par {v.metiers.length} métier(s) : {v.metiers.map((m) => m.intitule).join(', ')}
                </p>

                {estSelectionnee && edition ? (
                  <div className="edition-couple">
                    <div className="passerelles-champ">
                      <label htmlFor={`ia-${v.coupleModeleId}`}>Intitulé de l’activité</label>
                      <input
                        id={`ia-${v.coupleModeleId}`}
                        type="text"
                        className="edition__texte"
                        value={edition.intituleActivite}
                        onChange={(e) => setEdition((s) => s && { ...s, intituleActivite: e.target.value })}
                      />
                    </div>
                    <div className="passerelles-champ">
                      <label htmlFor={`ic-${v.coupleModeleId}`}>Intitulé de la compétence</label>
                      <input
                        id={`ic-${v.coupleModeleId}`}
                        type="text"
                        className="edition__texte"
                        value={edition.intituleCompetence}
                        onChange={(e) => setEdition((s) => s && { ...s, intituleCompetence: e.target.value })}
                      />
                    </div>

                    <div className="edition-couple__details">
                      <div className="passerelles-champ">
                        <label htmlFor={`da-${v.coupleModeleId}`}>
                          Détails de l’activité (un détail par ligne)
                        </label>
                        <textarea
                          id={`da-${v.coupleModeleId}`}
                          className="edition__texte"
                          rows={6}
                          value={edition.detailsActivite}
                          onChange={(e) => setEdition((s) => s && { ...s, detailsActivite: e.target.value })}
                        />
                      </div>
                      <div className="passerelles-champ">
                        <label htmlFor={`dc-${v.coupleModeleId}`}>
                          Détails de la compétence (un détail par ligne)
                        </label>
                        <textarea
                          id={`dc-${v.coupleModeleId}`}
                          className="edition__texte"
                          rows={6}
                          value={edition.detailsCompetence}
                          onChange={(e) => setEdition((s) => s && { ...s, detailsCompetence: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="passerelles-champ">
                      <label>Niveaux de maîtrise (laisser vide si non retenu)</label>
                      <div className="edition-couple__niveaux">
                        {([0, 1, 2, 3] as const).map((i) => (
                          <div key={i} className="passerelles-champ">
                            <label htmlFor={`nm-${v.coupleModeleId}-${i}`} className="detail">
                              Niveau {i + 1}
                            </label>
                            <textarea
                              id={`nm-${v.coupleModeleId}-${i}`}
                              className="edition__texte"
                              rows={2}
                              value={edition.niveaux[i]}
                              onChange={(e) =>
                                setEdition((s) => {
                                  if (!s) return s;
                                  const niveaux = [...s.niveaux] as Edition['niveaux'];
                                  niveaux[i] = e.target.value;
                                  return { ...s, niveaux };
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {v.connaissances.length > 0 && (
                      <p className="detail">
                        Domaines de connaissance (repris tels quels) :{' '}
                        {v.connaissances
                          .map(
                            (c) =>
                              `${c.intitule ?? c.codeFormacode}${c.niveau !== null ? ` (niv. ${c.niveau})` : ''}`,
                          )
                          .join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <table className="tableau couple__table">
                      <thead>
                        <tr>
                          <th scope="col">{v.intituleActivite ?? 'Activité'}</th>
                          <th scope="col">{v.intituleCompetence ?? 'Compétence'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Details items={v.detailsActivite} />
                          </td>
                          <td>
                            <Details items={v.detailsCompetence} />
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {v.niveauxMaitrise.length > 0 && (
                      <p className="detail">
                        Niveaux de maîtrise :{' '}
                        {v.niveauxMaitrise.map((n) => `${n.niveau}. ${n.description}`).join(' — ')}
                      </p>
                    )}

                    {v.connaissances.length > 0 && (
                      <p className="detail">
                        Domaines de connaissance :{' '}
                        {v.connaissances
                          .map(
                            (c) =>
                              `${c.intitule ?? c.codeFormacode}${c.niveau !== null ? ` (niv. ${c.niveau})` : ''}`,
                          )
                          .join(', ')}
                      </p>
                    )}
                  </>
                )}
              </section>
            );
          })
        ))}
    </div>
  );
}
