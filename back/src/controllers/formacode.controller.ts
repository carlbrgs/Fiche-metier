import { Request, Response } from 'express';
import { Op, WhereOptions, InferAttributes } from 'sequelize';
import { Formacode, FormacodeNiveau, Nsf } from '../models';
import { HttpError } from '../types/api';
import { lirePagination, construireReponsePaginee } from '../middlewares/pagination';

/** GET /api/formacodes?search=&nsf=&fondamental=&page=&limit= */
export async function listerFormacodes(req: Request, res: Response): Promise<void> {
  const pagination = lirePagination(req);
  const { search, nsf, fondamental } = req.query;

  const where: WhereOptions<InferAttributes<Formacode>> = {};
  if (nsf) where.codeNsf = String(nsf);
  if (fondamental !== undefined) where.estFondamental = fondamental === 'true';
  if (search) {
    const terme = `%${String(search)}%`;
    Object.assign(where, {
      [Op.or]: [{ intitule: { [Op.like]: terme } }, { codeFormacode: { [Op.like]: terme } }],
    });
  }

  const { rows, count } = await Formacode.findAndCountAll({
    where,
    include: [{ model: Nsf, as: 'nsf' }],
    order: [['intitule', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
  });

  res.json(construireReponsePaginee(rows, count, pagination));
}

/** GET /api/formacodes/:code — formacode et ses durées par niveau d'approfondissement. */
export async function obtenirFormacode(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const formacode = await Formacode.findByPk(req.params.code, {
    include: [
      { model: Nsf, as: 'nsf' },
      {
        model: FormacodeNiveau,
        as: 'niveaux',
        separate: true,
        order: [
          ['origine', 'ASC'],
          ['niveau', 'ASC'],
        ],
      },
    ],
  });

  if (!formacode) throw HttpError.notFound(`Formacode ${req.params.code}`);
  res.json(formacode);
}
