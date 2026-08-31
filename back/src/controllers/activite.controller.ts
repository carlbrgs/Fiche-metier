import { Request, Response } from 'express';
import { Op, WhereOptions, InferAttributes } from 'sequelize';
import { sequelize } from '../database/connection';
import {
  Activite,
  ActiviteDetail,
  CompetenceDetail,
  NiveauMaitrise,
  ActiviteConnaissance,
  FamilleActivite,
  DossierSource,
  Formacode,
  MotCle,
  Metier,
  MetierActivite,
} from '../models';
import { HttpError } from '../types/api';
import { lirePagination, construireReponsePaginee } from '../middlewares/pagination';

/** GET /api/activites?search=&famille=&formacode=&page=&limit= */
export async function listerActivites(req: Request, res: Response): Promise<void> {
  const pagination = lirePagination(req);
  const { search, famille, formacode } = req.query;

  const where: WhereOptions<InferAttributes<Activite>> = {};
  if (famille) where.codeFamilleActivite = String(famille);
  if (search) {
    const terme = `%${String(search)}%`;
    Object.assign(where, {
      [Op.or]: [
        { intituleActivite: { [Op.like]: terme } },
        { intituleCompetence: { [Op.like]: terme } },
      ],
    });
  }

  // Les connaissances pendent du couple, plus du catalogue (migration 008) : le filtre
  // par formacode passe donc par une sous-requête, une jointure directe n'étant plus
  // possible depuis `activite`.
  if (formacode) {
    where.codeActivite = {
      [Op.in]: sequelize.literal(
        `(SELECT DISTINCT ma.code_activite
            FROM metier_activite ma
            JOIN activite_connaissance ac ON ac.metier_activite_id = ma.id
           WHERE ac.code_formacode = ${sequelize.escape(String(formacode))})`,
      ),
    } as never;
  }

  const { rows, count } = await Activite.findAndCountAll({
    where,
    include: [
      { model: FamilleActivite, as: 'famille' },
      { model: DossierSource, as: 'dossierSource' },
    ],
    order: [['codeActivite', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  res.json(construireReponsePaginee(rows, count, pagination));
}

/**
 * GET /api/activites/:code — l'entrée de catalogue et ses emplois.
 *
 * Depuis la migration 006, le contenu rédactionnel (intitulés, tâches, mots-clés) ne
 * pend plus du code activité mais du couple : 121 codes sont formulés différemment
 * selon le métier. On renvoie donc le catalogue d'un côté, et de l'autre la liste des
 * couples qui emploient ce code, chacun avec sa rédaction propre.
 */
export async function obtenirActivite(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const activite = await Activite.findByPk(req.params.code, {
    include: [
      { model: FamilleActivite, as: 'famille' },
      { model: DossierSource, as: 'dossierSource' },
    ],
  });

  if (!activite) throw HttpError.notFound(`Activité ${req.params.code}`);

  const couples = await MetierActivite.findAll({
    where: { codeActivite: req.params.code },
    include: [
      { model: Metier, as: 'metier', attributes: ['codeMetier', 'intitule', 'codeFamille'] },
      { model: ActiviteDetail, as: 'detailsActivite', separate: true, order: [['ordre', 'ASC']] },
      {
        model: CompetenceDetail,
        as: 'detailsCompetence',
        separate: true,
        order: [['ordre', 'ASC']],
      },
      { model: NiveauMaitrise, as: 'niveauxMaitrise', separate: true, order: [['niveau', 'ASC']] },
      { model: MotCle, as: 'motsCles', through: { attributes: ['ordre'] } },
      {
        model: ActiviteConnaissance,
        as: 'connaissances',
        separate: true,
        order: [['ordre', 'ASC']],
        include: [{ model: Formacode, as: 'formacode' }],
      },
    ],
    order: [['codeMetier', 'ASC']],
  });

  res.json({ ...activite.toJSON(), couples });
}
