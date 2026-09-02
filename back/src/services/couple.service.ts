import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '../database/connection';
import {
  Metier,
  MetierActivite,
  ActiviteConnaissance,
  ActiviteDetail,
  CompetenceDetail,
  NiveauMaitrise,
  ActiviteMotCle,
} from '../models';
import { HttpError } from '../types/api';
import { marquerProximitePerimee } from './passerelle.service';

/**
 * Ajout et suppression de couples activité-compétence sur une fiche métier.
 *
 * Point de vigilance central : depuis la migration 008, les formacodes pendent du COUPLE et
 * non du code activité. Deux métiers qui emploient le même code activité peuvent donc porter
 * des domaines de connaissance différents — c'est le cas de 138 des 279 codes partagés.
 * Il n'existe par conséquent aucun jeu de formacodes déductible d'un code activité seul :
 * un ajout recopie toujours un couple existant, désigné explicitement par l'appelant.
 */

/** Réaligne `metier.nb_couple` sur le nombre réel de couples de la fiche. */
async function resynchroniserNbCouple(codeMetier: string, transaction: Transaction): Promise<void> {
  const total = await MetierActivite.count({ where: { codeMetier }, transaction });
  await Metier.update({ nbCouple: total }, { where: { codeMetier }, transaction, silent: true });
}

export interface VarianteCouple {
  coupleId: number;
  codeMetier: string;
  intituleMetier: string;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  /** Domaines portés par CE couple : ce qui sera recopié sur la fiche. */
  formacodes: Array<{ codeFormacode: string; intitule: string | null; niveau: number | null }>;
}

/**
 * Les couples déjà rédigés pour un code activité, chacun avec ses formacodes — de quoi
 * choisir lequel recopier. Le métier `exclure` (la fiche de destination) est retiré : il ne
 * peut pas se servir de modèle à lui-même.
 */
export async function listerVariantes(
  codeActivite: string,
  exclure?: string,
): Promise<VarianteCouple[]> {
  const couples = await MetierActivite.findAll({
    where: { codeActivite },
    include: [
      { model: Metier, as: 'metier', attributes: ['codeMetier', 'intitule'] },
      {
        model: ActiviteConnaissance,
        as: 'connaissances',
        separate: true,
        order: [['ordre', 'ASC']],
      },
    ],
    order: [['codeMetier', 'ASC']],
  });

  return couples
    .filter((c) => c.codeMetier !== exclure)
    .map((c) => {
      const brut = c.toJSON() as typeof c & {
        metier?: { intitule: string };
        connaissances?: ActiviteConnaissance[];
      };
      return {
        coupleId: c.id,
        codeMetier: c.codeMetier,
        intituleMetier: brut.metier?.intitule ?? c.codeMetier,
        intituleActivite: c.intituleActivite,
        intituleCompetence: c.intituleCompetence,
        formacodes: (brut.connaissances ?? []).map((k) => ({
          codeFormacode: k.codeFormacode,
          intitule: k.intitule,
          niveau: k.niveau,
        })),
      };
    });
}

/**
 * Les codes activité ajoutables à une fiche : tout le catalogue sauf ceux qu'elle porte déjà,
 * avec le nombre de rédactions disponibles. `recherche` filtre sur le code et les intitulés.
 */
export async function listerActivitesAjoutables(
  codeMetier: string,
  recherche: string | undefined,
  limite = 50,
): Promise<
  Array<{
    codeActivite: string;
    intituleActivite: string;
    intituleCompetence: string | null;
    nbVariantes: number;
  }>
> {
  const filtre = recherche?.trim()
    ? `AND (a.code_activite LIKE :terme OR a.intitule_activite LIKE :terme
            OR a.intitule_competence LIKE :terme)`
    : '';

  return sequelize.query(
    `SELECT a.code_activite       AS codeActivite,
            a.intitule_activite   AS intituleActivite,
            a.intitule_competence AS intituleCompetence,
            COUNT(ma.id)          AS nbVariantes
       FROM activite a
       JOIN metier_activite ma ON ma.code_activite = a.code_activite
      WHERE a.code_activite NOT IN (
              SELECT code_activite FROM metier_activite WHERE code_metier = :codeMetier)
        ${filtre}
      GROUP BY a.code_activite, a.intitule_activite, a.intitule_competence
      ORDER BY a.intitule_activite
      LIMIT :limite`,
    {
      replacements: { codeMetier, limite, ...(filtre ? { terme: `%${recherche!.trim()}%` } : {}) },
      type: QueryTypes.SELECT,
    },
  );
}

/**
 * Ajoute un couple à une fiche en recopiant intégralement `coupleSourceId` : intitulés
 * contextualisés, détails activité et compétence, niveaux de maîtrise, mots-clés et
 * domaines de connaissance. Le couple copié est ensuite modifiable indépendamment — les
 * deux fiches ne partagent aucune ligne.
 */
export async function ajouterCouple(
  codeMetier: string,
  coupleSourceId: number,
): Promise<MetierActivite> {
  const source = await MetierActivite.findByPk(coupleSourceId);
  if (!source) throw HttpError.notFound(`Couple ${coupleSourceId}`);
  if (source.codeMetier === codeMetier) {
    throw HttpError.badRequest('Ce couple appartient déjà à cette fiche');
  }

  const dejaPresent = await MetierActivite.findOne({
    where: { codeMetier, codeActivite: source.codeActivite },
  });
  if (dejaPresent) {
    throw HttpError.badRequest(
      `L'activité ${source.codeActivite} figure déjà sur cette fiche`,
    );
  }

  return sequelize.transaction(async (transaction) => {
    // `ordre` est unique par (code_metier, ordre) : le nouveau couple se place en fin de
    // fiche. MAX + 1 plutôt que COUNT + 1 — les suppressions laissent des trous.
    const [{ maxOrdre }] = await sequelize.query<{ maxOrdre: number | null }>(
      `SELECT MAX(ordre) AS maxOrdre FROM metier_activite WHERE code_metier = :codeMetier`,
      { replacements: { codeMetier }, type: QueryTypes.SELECT, transaction },
    );

    const couple = await MetierActivite.create(
      {
        codeMetier,
        codeActivite: source.codeActivite,
        ordre: (maxOrdre ?? 0) + 1,
        intituleActivite: source.intituleActivite,
        intituleCompetence: source.intituleCompetence,
      },
      { transaction },
    );

    const [details, competences, niveaux, motsCles, connaissances] = await Promise.all([
      ActiviteDetail.findAll({ where: { metierActiviteId: source.id }, transaction }),
      CompetenceDetail.findAll({ where: { metierActiviteId: source.id }, transaction }),
      NiveauMaitrise.findAll({ where: { metierActiviteId: source.id }, transaction }),
      ActiviteMotCle.findAll({ where: { metierActiviteId: source.id }, transaction }),
      ActiviteConnaissance.findAll({ where: { metierActiviteId: source.id }, transaction }),
    ]);

    await Promise.all([
      ActiviteDetail.bulkCreate(
        details.map((d) => ({ metierActiviteId: couple.id, libelle: d.libelle, ordre: d.ordre })),
        { transaction },
      ),
      CompetenceDetail.bulkCreate(
        competences.map((d) => ({
          metierActiviteId: couple.id,
          libelle: d.libelle,
          ordre: d.ordre,
        })),
        { transaction },
      ),
      NiveauMaitrise.bulkCreate(
        niveaux.map((n) => ({
          metierActiviteId: couple.id,
          niveau: n.niveau,
          description: n.description,
        })),
        { transaction },
      ),
      ActiviteMotCle.bulkCreate(
        motsCles.map((m) => ({
          metierActiviteId: couple.id,
          motCleId: m.motCleId,
          ordre: m.ordre,
        })),
        { transaction },
      ),
      ActiviteConnaissance.bulkCreate(
        connaissances.map((k) => ({
          metierActiviteId: couple.id,
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

    await resynchroniserNbCouple(codeMetier, transaction);
    await marquerProximitePerimee(codeMetier, transaction);
    return couple;
  });
}

/**
 * Retire un couple de la fiche. Les détails, niveaux, mots-clés et domaines de connaissance
 * partent avec lui : les cinq tables filles sont en `ON DELETE CASCADE` (migration 001).
 * Le tableau des domaines structurants étant recalculé à la volée par un `GROUP BY` sur les
 * couples restants, il n'y a rien d'autre à synchroniser.
 */
export async function supprimerCouple(codeMetier: string, coupleId: number): Promise<void> {
  const couple = await MetierActivite.findOne({ where: { id: coupleId, codeMetier } });
  if (!couple) throw HttpError.notFound(`Couple ${coupleId} sur la fiche ${codeMetier}`);

  await sequelize.transaction(async (transaction) => {
    await couple.destroy({ transaction });
    await resynchroniserNbCouple(codeMetier, transaction);
    await marquerProximitePerimee(codeMetier, transaction);
  });
}

