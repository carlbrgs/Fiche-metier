import { Op } from 'sequelize';
import { sequelize } from '../database/connection';
import {
  Metier,
  MetierActivite,
  ActiviteDetail,
  CompetenceDetail,
  NiveauMaitrise,
  ActiviteConnaissance,
} from '../models';
import { HttpError } from '../types/api';
import { marquerProximitePerimee } from './passerelle.service';

/**
 * Incohérences entre rédactions d'un même couple activité-compétence.
 *
 * Depuis la migration 008, les intitulés, détails, niveaux de maîtrise et domaines de
 * connaissance pendent du COUPLE (`metier_activite`) et non du code activité seul : rien
 * n'empêche deux métiers qui partagent un code de diverger sur leur contenu — c'est le cas
 * pour une partie du catalogue (voir couple.service.ts, « 138 des 279 codes partagés »).
 *
 * Les mots-clés sont volontairement exclus de la comparaison et de l'harmonisation :
 * décision explicite, ils ne sont pas considérés comme faisant partie du « contenu » du
 * couple pour cet usage.
 */

interface ContenuComparable {
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite: string[];
  detailsCompetence: string[];
  niveauxMaitrise: Array<{ niveau: number; description: string }>;
  connaissances: Array<{
    codeFormacode: string;
    niveau: number | null;
    dureeHeures: number | null;
    justificationDuree: string | null;
    codeNsf: string | null;
    estFondamental: boolean;
  }>;
}

/** Une ligne `metier_activite` telle que chargée avec tout ce qui compte pour la comparaison. */
interface CoupleCharge {
  id: number;
  codeMetier: string;
  codeActivite: string;
  intituleMetier: string;
  contenu: ContenuComparable;
  /** Domaines de connaissance avec leur intitulé — utile à l'affichage, pas à la comparaison. */
  connaissancesAffichage: Array<{ codeFormacode: string; intitule: string | null; niveau: number | null }>;
}

async function chargerCouples(codeActivite?: string): Promise<CoupleCharge[]> {
  const couples = await MetierActivite.findAll({
    where: codeActivite ? { codeActivite } : undefined,
    include: [
      { model: Metier, as: 'metier', attributes: ['codeMetier', 'intitule'] },
      { model: ActiviteDetail, as: 'detailsActivite', separate: true, order: [['ordre', 'ASC']] },
      { model: CompetenceDetail, as: 'detailsCompetence', separate: true, order: [['ordre', 'ASC']] },
      { model: NiveauMaitrise, as: 'niveauxMaitrise', separate: true, order: [['niveau', 'ASC']] },
      { model: ActiviteConnaissance, as: 'connaissances', separate: true, order: [['ordre', 'ASC']] },
    ],
    order: [['codeMetier', 'ASC']],
  });

  return couples.map((c) => {
    const brut = c.toJSON() as unknown as {
      metier?: { codeMetier: string; intitule: string };
      detailsActivite?: Array<{ libelle: string }>;
      detailsCompetence?: Array<{ libelle: string }>;
      niveauxMaitrise?: Array<{ niveau: number; description: string }>;
      connaissances?: Array<{
        codeFormacode: string;
        intitule: string | null;
        niveau: number | null;
        dureeHeures: number | null;
        justificationDuree: string | null;
        codeNsf: string | null;
        estFondamental: boolean;
      }>;
    };

    const connaissances = brut.connaissances ?? [];

    return {
      id: c.id,
      codeMetier: c.codeMetier,
      codeActivite: c.codeActivite,
      intituleMetier: brut.metier?.intitule ?? c.codeMetier,
      contenu: {
        intituleActivite: c.intituleActivite,
        intituleCompetence: c.intituleCompetence,
        detailsActivite: (brut.detailsActivite ?? []).map((d) => d.libelle),
        detailsCompetence: (brut.detailsCompetence ?? []).map((d) => d.libelle),
        niveauxMaitrise: (brut.niveauxMaitrise ?? [])
          .map((n) => ({ niveau: n.niveau, description: n.description }))
          .sort((a, b) => a.niveau - b.niveau),
        connaissances: connaissances
          .map((k) => ({
            codeFormacode: k.codeFormacode,
            niveau: k.niveau,
            dureeHeures: k.dureeHeures !== null ? Number(k.dureeHeures) : null,
            justificationDuree: k.justificationDuree,
            codeNsf: k.codeNsf,
            estFondamental: k.estFondamental,
          }))
          .sort((a, b) => a.codeFormacode.localeCompare(b.codeFormacode)),
      },
      connaissancesAffichage: connaissances
        .map((k) => ({ codeFormacode: k.codeFormacode, intitule: k.intitule, niveau: k.niveau }))
        .sort((a, b) => a.codeFormacode.localeCompare(b.codeFormacode)),
    };
  });
}

function signature(c: ContenuComparable): string {
  return JSON.stringify(c);
}

export interface CodeIncoherent {
  codeActivite: string;
  intituleActivite: string;
  nbVariantes: number;
  nbMetiers: number;
}

/** Les codes activité pour lesquels toutes les rédactions ne sont pas identiques. */
export async function listerIncoherences(): Promise<CodeIncoherent[]> {
  const couples = await chargerCouples();

  const parCode = new Map<string, { intitule: string; signatures: Set<string>; nbMetiers: number }>();
  for (const c of couples) {
    if (!parCode.has(c.codeActivite)) {
      parCode.set(c.codeActivite, {
        intitule: c.contenu.intituleActivite ?? c.codeActivite,
        signatures: new Set(),
        nbMetiers: 0,
      });
    }
    const entree = parCode.get(c.codeActivite)!;
    entree.signatures.add(signature(c.contenu));
    entree.nbMetiers++;
  }

  return [...parCode.entries()]
    .filter(([, e]) => e.signatures.size > 1)
    .map(([codeActivite, e]) => ({
      codeActivite,
      intituleActivite: e.intitule,
      nbVariantes: e.signatures.size,
      nbMetiers: e.nbMetiers,
    }))
    .sort((a, b) => b.nbVariantes - a.nbVariantes || a.codeActivite.localeCompare(b.codeActivite));
}

export interface VarianteDetaillee {
  /** Un couple représentatif de cette rédaction — sert de « modèle » si on l'harmonise. */
  coupleModeleId: number;
  metiers: Array<{ codeMetier: string; intitule: string }>;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite: string[];
  detailsCompetence: string[];
  niveauxMaitrise: Array<{ niveau: number; description: string }>;
  connaissances: Array<{ codeFormacode: string; intitule: string | null; niveau: number | null }>;
}

/** Les rédactions distinctes d'un code activité, chacune avec les métiers qui la portent. */
export async function obtenirVariantes(codeActivite: string): Promise<VarianteDetaillee[]> {
  const couples = await chargerCouples(codeActivite);
  if (couples.length === 0) throw HttpError.notFound(`Activité ${codeActivite}`);

  const groupes = new Map<string, VarianteDetaillee>();
  for (const c of couples) {
    const sig = signature(c.contenu);
    if (!groupes.has(sig)) {
      groupes.set(sig, {
        coupleModeleId: c.id,
        metiers: [],
        intituleActivite: c.contenu.intituleActivite,
        intituleCompetence: c.contenu.intituleCompetence,
        detailsActivite: c.contenu.detailsActivite,
        detailsCompetence: c.contenu.detailsCompetence,
        niveauxMaitrise: c.contenu.niveauxMaitrise,
        connaissances: c.connaissancesAffichage,
      });
    }
    groupes.get(sig)!.metiers.push({ codeMetier: c.codeMetier, intitule: c.intituleMetier });
  }

  return [...groupes.values()].sort((a, b) => b.metiers.length - a.metiers.length);
}

export interface EditionModele {
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite: string[];
  detailsCompetence: string[];
  niveauxMaitrise: Array<{ niveau: number; description: string }>;
}

/**
 * Recopie intégralement la rédaction du couple `coupleModeleId` sur tous les autres couples
 * du même code activité — intitulés, détails, niveaux de maîtrise et domaines de connaissance.
 * Les mots-clés ne sont jamais touchés (`ActiviteMotCle` n'apparaît nulle part ici).
 *
 * `edition`, si fourni, réécrit d'abord le modèle lui-même (tout sauf les domaines de
 * connaissance : les modifier à la main risquerait de référencer un formacode qui n'existe
 * pas — ils restent hérités tels quels). Le tout dans une seule transaction : la fiche modèle
 * et les fiches alignées dessus changent ensemble, ou pas du tout.
 *
 * Périme les passerelles de chaque métier affecté (y compris le modèle s'il est réécrit) :
 * les domaines de connaissance harmonisés peuvent différer de ceux portés avant.
 */
export async function harmoniserCouple(
  codeActivite: string,
  coupleModeleId: number,
  edition?: EditionModele,
): Promise<{ nbMetiersAffectes: number }> {
  const modele = await MetierActivite.findByPk(coupleModeleId);
  if (!modele) throw HttpError.notFound(`Couple ${coupleModeleId}`);
  if (modele.codeActivite !== codeActivite) {
    throw HttpError.badRequest(`Le couple ${coupleModeleId} ne porte pas le code ${codeActivite}`);
  }

  const autres = await MetierActivite.findAll({
    where: { codeActivite, id: { [Op.ne]: coupleModeleId } },
  });

  await sequelize.transaction(async (transaction) => {
    if (edition) {
      await modele.update(
        { intituleActivite: edition.intituleActivite, intituleCompetence: edition.intituleCompetence },
        { transaction },
      );
      await Promise.all([
        ActiviteDetail.destroy({ where: { metierActiviteId: modele.id }, transaction }),
        CompetenceDetail.destroy({ where: { metierActiviteId: modele.id }, transaction }),
        NiveauMaitrise.destroy({ where: { metierActiviteId: modele.id }, transaction }),
      ]);
      await Promise.all([
        ActiviteDetail.bulkCreate(
          edition.detailsActivite.map((libelle, i) => ({ metierActiviteId: modele.id, libelle, ordre: i + 1 })),
          { transaction },
        ),
        CompetenceDetail.bulkCreate(
          edition.detailsCompetence.map((libelle, i) => ({ metierActiviteId: modele.id, libelle, ordre: i + 1 })),
          { transaction },
        ),
        NiveauMaitrise.bulkCreate(
          edition.niveauxMaitrise.map((n) => ({
            metierActiviteId: modele.id,
            niveau: n.niveau,
            description: n.description,
          })),
          { transaction },
        ),
      ]);
      await marquerProximitePerimee(modele.codeMetier, transaction);
    }

    if (autres.length === 0) return;

    const [detailsModele, competencesModele, niveauxModele, connaissancesModele] = await Promise.all([
      ActiviteDetail.findAll({ where: { metierActiviteId: coupleModeleId }, transaction }),
      CompetenceDetail.findAll({ where: { metierActiviteId: coupleModeleId }, transaction }),
      NiveauMaitrise.findAll({ where: { metierActiviteId: coupleModeleId }, transaction }),
      ActiviteConnaissance.findAll({ where: { metierActiviteId: coupleModeleId }, transaction }),
    ]);
    const intituleActivite = edition ? edition.intituleActivite : modele.intituleActivite;
    const intituleCompetence = edition ? edition.intituleCompetence : modele.intituleCompetence;

    for (const cible of autres) {
      await cible.update({ intituleActivite, intituleCompetence }, { transaction });

      await Promise.all([
        ActiviteDetail.destroy({ where: { metierActiviteId: cible.id }, transaction }),
        CompetenceDetail.destroy({ where: { metierActiviteId: cible.id }, transaction }),
        NiveauMaitrise.destroy({ where: { metierActiviteId: cible.id }, transaction }),
        ActiviteConnaissance.destroy({ where: { metierActiviteId: cible.id }, transaction }),
      ]);

      await Promise.all([
        ActiviteDetail.bulkCreate(
          detailsModele.map((d) => ({ metierActiviteId: cible.id, libelle: d.libelle, ordre: d.ordre })),
          { transaction },
        ),
        CompetenceDetail.bulkCreate(
          competencesModele.map((d) => ({ metierActiviteId: cible.id, libelle: d.libelle, ordre: d.ordre })),
          { transaction },
        ),
        NiveauMaitrise.bulkCreate(
          niveauxModele.map((n) => ({
            metierActiviteId: cible.id,
            niveau: n.niveau,
            description: n.description,
          })),
          { transaction },
        ),
        ActiviteConnaissance.bulkCreate(
          connaissancesModele.map((k) => ({
            metierActiviteId: cible.id,
            codeFormacode: k.codeFormacode,
            intitule: k.intitule,
            niveau: k.niveau,
            dureeHeures: k.dureeHeures,
            justificationDuree: k.justificationDuree,
            codeNsf: k.codeNsf,
            estFondamental: k.estFondamental,
            ordre: k.ordre,
          })),
          { transaction },
        ),
      ]);

      await marquerProximitePerimee(cible.codeMetier, transaction);
    }
  });

  return { nbMetiersAffectes: autres.length };
}
