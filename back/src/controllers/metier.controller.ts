import { Request, Response } from 'express';
import { Op, WhereOptions, InferAttributes, QueryTypes } from 'sequelize';
import { sequelize } from '../database/connection';
import {
  Metier,
  MetierAppellation,
  MetierRome,
  MetierCondition,
  MetierTransversale,
  MetierAcces,
  CritereCondition,
  CompetenceTransversale,
  CritereAcces,
  FamilleMetier,
  DossierSource,
  Activite,
  ActiviteConnaissance,
  Formacode,
  MetierActivite,
  ActiviteDetail,
  CompetenceDetail,
  NiveauMaitrise,
  MotCle,
} from '../models';
import { HttpError } from '../types/api';
import { lirePagination, construireReponsePaginee } from '../middlewares/pagination';

/** GET /api/metiers?search=&famille=&dossier=&rome=&page=&limit= */
export async function listerMetiers(req: Request, res: Response): Promise<void> {
  const pagination = lirePagination(req);
  const { search, famille, dossier, rome } = req.query;

  const where: WhereOptions<InferAttributes<Metier>> = {};
  if (famille) where.codeFamille = String(famille);
  if (dossier) where.dossierSourceId = Number(dossier);

  if (search) {
    const terme = `%${String(search)}%`;
    Object.assign(where, {
      // Le code métier est inclus : « D192 » doit trouver la fiche correspondante.
      [Op.or]: [
        { codeMetier: { [Op.like]: terme } },
        { intitule: { [Op.like]: terme } },
        { definition: { [Op.like]: terme } },
      ],
    });
  }

  // Un métier porte jusqu'à 3 codes ROME : une sous-requête évite la jointure, qui
  // dupliquerait les lignes et fausserait le compte de la pagination.
  if (rome) {
    where.codeMetier = {
      [Op.in]: sequelize.literal(
        `(SELECT code_metier FROM metier_rome WHERE code_rome = ${sequelize.escape(String(rome))})`,
      ),
    } as never;
  }

  const { rows, count } = await Metier.findAndCountAll({
    where,
    include: [
      { model: FamilleMetier, as: 'famille' },
      { model: DossierSource, as: 'dossierSource' },
      { model: MetierAppellation, as: 'appellations', separate: true, order: [['ordre', 'ASC']] },
    ],
    order: [['intitule', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  res.json(construireReponsePaginee(rows, count, pagination));
}

/** GET /api/metiers/:code — fiche métier complète. */
export async function obtenirMetier(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const metier = await Metier.findByPk(req.params.code, {
    include: [
      { model: FamilleMetier, as: 'famille' },
      { model: DossierSource, as: 'dossierSource' },
      { model: MetierAppellation, as: 'appellations', separate: true, order: [['ordre', 'ASC']] },
      { model: MetierRome, as: 'codesRome', separate: true, order: [['ordre', 'ASC']] },
      {
        model: MetierCondition,
        as: 'conditions',
        include: [{ model: CritereCondition, as: 'critere' }],
      },
      {
        model: MetierTransversale,
        as: 'transversales',
        include: [{ model: CompetenceTransversale, as: 'competence' }],
      },
      { model: MetierAcces, as: 'acces', include: [{ model: CritereAcces, as: 'critere' }] },
    ],
  });

  if (!metier) throw HttpError.notFound(`Métier ${req.params.code}`);
  res.json(metier);
}

/**
 * GET /api/metiers/:code/activites — les couples activité-compétence de la fiche.
 *
 * On interroge `MetierActivite` et non `Activite` : les intitulés et les détails sont
 * contextualisés par métier, ils pendent du couple (docs/SCHEMA.md §4).
 */
export async function obtenirActivitesMetier(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const metier = await Metier.findByPk(req.params.code, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${req.params.code}`);

  const couples = await MetierActivite.findAll({
    where: { codeMetier: req.params.code },
    include: [
      { model: ActiviteDetail, as: 'detailsActivite', separate: true, order: [['ordre', 'ASC']] },
      {
        model: CompetenceDetail,
        as: 'detailsCompetence',
        separate: true,
        order: [['ordre', 'ASC']],
      },
      { model: NiveauMaitrise, as: 'niveauxMaitrise', separate: true, order: [['niveau', 'ASC']] },
      { model: MotCle, as: 'motsCles', through: { attributes: ['ordre'] } },
      // Les connaissances pendent du couple depuis la migration 008, plus du catalogue.
      {
        model: ActiviteConnaissance,
        as: 'connaissances',
        separate: true,
        order: [['ordre', 'ASC']],
        include: [{ model: Formacode, as: 'formacode' }],
      },
      { model: Activite, as: 'activite' },
    ],
    order: [['ordre', 'ASC']],
  });

  res.json({ data: couples });
}

/**
 * GET /api/metiers/:code/connaissances — domaines structurants du métier.
 *
 * Un même formacode revient sur plusieurs couples : la fiche Excel n'en affiche qu'une
 * ligne. On dédoublonne en retenant le niveau le plus élevé — c'est l'exigence qui
 * s'impose au métier dans son ensemble.
 *
 * Le libellé et le NSF viennent en priorité de `formacode` : la collecte saisit les
 * intitulés en capitales, et laisse le NSF vide sur plus de la moitié des lignes —
 * la fiche D194 « Superviseur de production » ne renseigne ni l'un ni l'autre. Le
 * référentiel `Formacode_niveau` les connaît, on retombe donc dessus.
 */
export async function obtenirConnaissancesMetier(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const metier = await Metier.findByPk(req.params.code, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${req.params.code}`);

  const domaines = await sequelize.query(
    `SELECT ac.code_formacode                       AS codeFormacode,
            COALESCE(f.intitule, MIN(ac.intitule))  AS intitule,
            MAX(ac.niveau)                          AS niveau,
            MAX(ac.duree_heures)                    AS dureeHeures,
            COALESCE(f.code_nsf, MIN(ac.code_nsf))  AS codeNsf
       FROM metier_activite ma
       JOIN activite_connaissance ac ON ac.metier_activite_id = ma.id
       LEFT JOIN formacode f ON f.code_formacode = ac.code_formacode
      WHERE ma.code_metier = :code
      GROUP BY ac.code_formacode, f.intitule, f.code_nsf
      ORDER BY intitule`,
    { replacements: { code: req.params.code }, type: QueryTypes.SELECT },
  );

  res.json({ data: domaines });
}
