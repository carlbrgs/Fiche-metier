import type { CritereAcces, MetierAcces } from '@/types/api';

const SANS_GROUPE = 'Autres conditions';

/** ACCES_3 et ACCES_4 sont les deux bornes d'une même question : elles se fusionnent. */
const BORNE_BASSE = 'ACCES_3';
const BORNE_HAUTE = 'ACCES_4';

interface Entree {
  code: string;
  question: string;
  reponse: string | null;
}

/**
 * Rend la phrase du niveau attendu comme la fiche Excel :
 * bornes identiques  -> « Un diplôme de Niv.4 est attendu. »
 * bornes différentes -> « Un diplôme de Niv.4 à un Niv.5 est attendu. »
 */
function phraseNiveau(basse: string | undefined, haute: string | undefined): string | null {
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
  const parCode = new Map(acces.map((a) => [a.codeAcces, a] as const));
  const groupes = new Map<string, Entree[]>();

  const criteres = [...referentiels].sort((a, b) => a.ordre - b.ordre);

  for (const critere of criteres) {
    // La borne haute est absorbée par la borne basse, qui porte la question.
    if (critere.codeAcces === BORNE_HAUTE) continue;

    const reponse =
      critere.codeAcces === BORNE_BASSE
        ? phraseNiveau(parCode.get(BORNE_BASSE)?.valeur, parCode.get(BORNE_HAUTE)?.valeur)
        : (parCode.get(critere.codeAcces)?.valeur ?? null);

    const cle = critere.groupe ?? SANS_GROUPE;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push({
      code: critere.codeAcces,
      question: critere.libelle,
      reponse: reponse || null,
    });
  }

  return [...groupes.entries()];
}

interface Props {
  acces: MetierAcces[];
  /** Liste complète des critères, issue de /api/referentiels. */
  criteres: CritereAcces[];
}

export function AccesFiche({ acces, criteres }: Props) {
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
            {entrees.map((e) => (
              <div key={e.code} className="acces__entree">
                <dt>{e.question}</dt>
                <dd className={e.reponse ? undefined : 'detail'}>
                  {e.reponse ?? 'Non renseigné'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </>
  );
}
