import { Request, Response } from 'express';
import { Op, WhereOptions, InferAttributes, QueryTypes } from 'sequelize';
import { z } from 'zod';
import { sequelize } from '../database/connection';
import { Formacode, FormacodeNiveau, Nsf } from '../models';
import { HttpError } from '../types/api';
import { lirePagination, construireReponsePaginee } from '../middlewares/pagination';
import { marquerProximitePerimee } from '../services/passerelle.service';

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

/** GET /api/formacodes/:code — formacode, ses durées par niveau et les métiers qui le portent. */
export async function obtenirFormacode(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const codeFormacode = req.params.code;

  const formacode = await Formacode.findByPk(codeFormacode, {
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

  if (!formacode) throw HttpError.notFound(`Formacode ${codeFormacode}`);

  // Un même formacode peut revenir sur plusieurs couples d'un même métier, avec un niveau
  // différent à chacun (migration 008) : un métier par ligne, niveau le plus élevé retenu —
  // même logique que dc_source/dc_cible dans passerelle.service.ts.
  const metiers = await sequelize.query<{
    codeMetier: string;
    intitule: string;
    codeFamille: string | null;
    niveauMax: number | null;
    nbCouples: number;
  }>(
    `SELECT m.code_metier AS codeMetier, m.intitule AS intitule, m.code_famille AS codeFamille,
            MAX(ac.niveau) AS niveauMax, COUNT(*) AS nbCouples
       FROM activite_connaissance ac
       JOIN metier_activite ma ON ma.id = ac.metier_activite_id
       JOIN metier m ON m.code_metier = ma.code_metier
      WHERE ac.code_formacode = :codeFormacode
      GROUP BY m.code_metier, m.intitule, m.code_famille
      ORDER BY m.intitule ASC`,
    { replacements: { codeFormacode }, type: QueryTypes.SELECT },
  );

  res.json({ ...formacode.toJSON(), metiers });
}

const ORIGINES = ['base_formacodes', 'base_competences', 'outil_fiche_metier'] as const;

const schemaLigneNiveau = z.object({
  niveau: z.number().int().min(1).max(4),
  origine: z.enum(ORIGINES),
  estNiveauUnique: z.boolean().default(false),
  dureeHeures: z.number().min(0).max(100000).nullable(),
  dureeSemaines: z.number().min(0).max(10000).nullable(),
  dureeMois: z.number().min(0).max(1000).nullable(),
  methodeCalcul: z.string().trim().max(2000).nullable(),
  source: z.string().trim().max(2000).nullable(),
});

const schemaModificationNiveaux = z.object({
  niveaux: z.array(schemaLigneNiveau).max(12),
});

/** Signature stable d'un jeu de lignes, pour détecter si une durée a changé. */
function signatureDurees(lignes: { niveau: number; origine: string; dureeHeures: number | null }[]): string {
  return [...lignes]
    .sort((a, b) => a.niveau - b.niveau || a.origine.localeCompare(b.origine))
    .map((l) => `${l.niveau}|${l.origine}|${l.dureeHeures ?? ''}`)
    .join(';');
}

/**
 * PUT /api/formacodes/:code/niveaux — remplace en bloc les lignes (niveau, origine) d'un
 * formacode : ajout, suppression et modification passent tous par le même jeu envoyé au
 * complet, comme `modifierConditions`/`modifierAcces` (metier_activite.controller.ts).
 *
 * Une ligne par (niveau, origine) — jusqu'à 3 sources possibles par niveau, dont
 * `outil_fiche_metier`, la seule modifiable ici sans passer par un ré-import de classeur.
 *
 * Une durée changée peut affecter n'importe quel métier dont un couple porte ce formacode,
 * qu'il soit source ou cible d'une passerelle (services/passerelle.service.ts) : tous sont
 * marqués périmés, pas seulement une fiche précise.
 */
export async function modifierFormacodeNiveaux(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const codeFormacode = req.params.code;
  const formacode = await Formacode.findByPk(codeFormacode, { attributes: ['codeFormacode'] });
  if (!formacode) throw HttpError.notFound(`Formacode ${codeFormacode}`);

  const { niveaux } = schemaModificationNiveaux.parse(req.body);

  const cles = niveaux.map((l) => `${l.niveau}|${l.origine}`);
  if (cles.length !== new Set(cles).size) {
    throw HttpError.badRequest('Un même couple (niveau, origine) est envoyé deux fois');
  }

  const avant = await FormacodeNiveau.findAll({ where: { codeFormacode } });
  const proximiteTouchee = signatureDurees(avant) !== signatureDurees(niveaux);

  await sequelize.transaction(async (transaction) => {
    const gardees = new Set(cles);

    for (const l of niveaux) {
      await FormacodeNiveau.upsert(
        {
          codeFormacode,
          niveau: l.niveau,
          origine: l.origine,
          estNiveauUnique: l.estNiveauUnique,
          dureeHeures: l.dureeHeures,
          dureeSemaines: l.dureeSemaines,
          dureeMois: l.dureeMois,
          methodeCalcul: l.methodeCalcul,
          source: l.source,
        },
        { transaction },
      );
    }

    for (const ligne of avant) {
      if (!gardees.has(`${ligne.niveau}|${ligne.origine}`)) {
        await ligne.destroy({ transaction });
      }
    }

    if (proximiteTouchee) {
      const metiers = await sequelize.query<{ codeMetier: string }>(
        `SELECT DISTINCT ma.code_metier AS codeMetier
           FROM metier_activite ma
           JOIN activite_connaissance ac ON ac.metier_activite_id = ma.id
          WHERE ac.code_formacode = :codeFormacode`,
        { replacements: { codeFormacode }, type: QueryTypes.SELECT, transaction },
      );
      for (const m of metiers) await marquerProximitePerimee(m.codeMetier, transaction);
    }
  });

  const apres = await FormacodeNiveau.findAll({
    where: { codeFormacode },
    order: [
      ['origine', 'ASC'],
      ['niveau', 'ASC'],
    ],
  });
  res.json({ data: apres, proximitePerimee: proximiteTouchee });
}
