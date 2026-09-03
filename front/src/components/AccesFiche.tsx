import type { CritereAcces, MetierAcces } from '@/types/api';

const SANS_GROUPE = 'Autres conditions';

/** ACCES_3 et ACCES_4 sont les deux bornes d'une même question : elles se fusionnent. */
const BORNE_BASSE = 'ACCES_3';
const BORNE_HAUTE = 'ACCES_4';

/** Niveaux RNCP portés par ACCES_3/ACCES_4 — mêmes valeurs que back/services/passerelle.service.ts. */
export const NIVEAUX_RNCP = ['Niv.3', 'Niv.4', 'Niv.5', 'Niv.6', 'Niv.7', 'Niv.8'] as const;

interface EntreeTexte {
  type: 'texte';
  code: string;
  question: string;
  reponse: string | null;
}

interface EntreeRncp {
  type: 'rncp';
  codeBasse: string;
  codeHaute: string;
  question: string;
  basse: string | null;
  haute: string | null;
}

type Entree = EntreeTexte | EntreeRncp;

/**
 * Rend la phrase du niveau attendu comme la fiche Excel :
 * bornes identiques  -> « Un diplôme de Niv.4 est attendu. »
 * bornes différentes -> « Un diplôme de Niv.4 à un Niv.5 est attendu. »
 */
function phraseNiveau(basse: string | null, haute: string | null): string | null {
  if (!basse && !haute) return null;
  if (!basse || !haute || basse === haute) return `Un diplôme de ${basse ?? haute} est attendu.`;
  return `Un diplôme de ${basse} à un ${haute} est attendu.`;
}

/**
 * Construit les 6 questions à partir des 7 critères, groupées comme sur la fiche Excel.
 *
 * `referentiels` fournit la liste complète des critères : c'est elle qui pilote
 * l'affichage, et non les seules réponses du métier. Une question sans réponse reste
 * visible — elle a été posée, l'absence de réponse est une information.
 */
function construireEntrees(
  acces: MetierAcces[],
  referentiels: CritereAcces[],
): Array<[string, Entree[]]> {
  const parCode = new Map(acces.map((a) => [a.codeAcces, a.valeur] as const));
  const groupes = new Map<string, Entree[]>();

  const criteres = [...referentiels].sort((a, b) => a.ordre - b.ordre);

  for (const critere of criteres) {
    // La borne haute est absorbée par la borne basse, qui porte la question.
    if (critere.codeAcces === BORNE_HAUTE) continue;

    const cle = critere.groupe ?? SANS_GROUPE;
    if (!groupes.has(cle)) groupes.set(cle, []);

    if (critere.codeAcces === BORNE_BASSE) {
      groupes.get(cle)!.push({
        type: 'rncp',
        codeBasse: BORNE_BASSE,
        codeHaute: BORNE_HAUTE,
        question: critere.libelle,
        basse: parCode.get(BORNE_BASSE) ?? null,
        haute: parCode.get(BORNE_HAUTE) ?? null,
      });
    } else {
      groupes.get(cle)!.push({
        type: 'texte',
        code: critere.codeAcces,
        question: critere.libelle,
        reponse: parCode.get(critere.codeAcces) ?? null,
      });
    }
  }

  return [...groupes.entries()];
}

interface Edition {
  /** Indexé par code (ACCES_1..7) — `''` = non renseigné. */
  valeurs: Record<string, string>;
  onChange: (codeAcces: string, valeur: string) => void;
  desactive: boolean;
}

interface Props {
  acces: MetierAcces[];
  /** Liste complète des critères, issue de /api/referentiels. */
  criteres: CritereAcces[];
  /** Fourni uniquement en mode édition : remplace le texte par des champs de saisie. */
  edition?: Edition;
}

export function AccesFiche({ acces, criteres, edition }: Props) {
  // Repli sur les critères portés par les réponses tant que les référentiels ne sont
  // pas chargés : la fiche reste lisible, seules les questions sans réponse manquent.
  const reference =
    criteres.length > 0
      ? criteres
      : acces.flatMap((a) => (a.critere ? [a.critere] : []));

  const groupes = construireEntrees(acces, reference);
  if (groupes.length === 0) return null;

  return (
    <>
      {groupes.map(([groupe, entrees]) => (
        <div key={groupe} className="acces__groupe">
          <h4 className="acces__titre">{groupe}</h4>
          <dl className="acces__liste">
            {entrees.map((e) => {
              if (e.type === 'rncp') {
                const basse = edition ? (edition.valeurs[e.codeBasse] ?? e.basse ?? '') : e.basse;
                const haute = edition ? (edition.valeurs[e.codeHaute] ?? e.haute ?? '') : e.haute;
                return (
                  <div key={e.codeBasse} className="acces__entree">
                    <dt>{e.question}</dt>
                    {edition ? (
                      <dd className="acces__reponse-edition">
                        <div className="acces__rncp">
                          <select
                            aria-label={`${e.question} — niveau minimum`}
                            value={basse ?? ''}
                            disabled={edition.desactive}
                            onChange={(ev) => edition.onChange(e.codeBasse, ev.target.value)}
                          >
                            <option value="">— Non renseigné —</option>
                            {NIVEAUX_RNCP.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <span className="detail">à</span>
                          <select
                            aria-label={`${e.question} — niveau maximum`}
                            value={haute ?? ''}
                            disabled={edition.desactive}
                            onChange={(ev) => edition.onChange(e.codeHaute, ev.target.value)}
                          >
                            <option value="">— Non renseigné —</option>
                            {NIVEAUX_RNCP.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      </dd>
                    ) : (
                      <dd className={phraseNiveau(e.basse, e.haute) ? undefined : 'detail'}>
                        {phraseNiveau(e.basse, e.haute) ?? 'Non renseigné'}
                      </dd>
                    )}
                  </div>
                );
              }

              const reponse = edition ? (edition.valeurs[e.code] ?? e.reponse ?? '') : e.reponse;
              return (
                <div key={e.code} className="acces__entree">
                  <dt>{e.question}</dt>
                  {edition ? (
                    <dd className="acces__reponse-edition">
                      <input
                        type="text"
                        className="edition__texte"
                        aria-label={e.question}
                        value={reponse ?? ''}
                        disabled={edition.desactive}
                        onChange={(ev) => edition.onChange(e.code, ev.target.value)}
                      />
                    </dd>
                  ) : (
                    <dd className={e.reponse ? undefined : 'detail'}>{e.reponse ?? 'Non renseigné'}</dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      ))}
    </>
  );
}
