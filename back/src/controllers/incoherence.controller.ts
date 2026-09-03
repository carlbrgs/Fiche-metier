import { Request, Response } from 'express';
import { z } from 'zod';
import { listerIncoherences, obtenirVariantes, harmoniserCouple } from '../services/incoherence.service';

/** GET /api/activites/incoherences */
export async function lister(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listerIncoherences() });
}

/** GET /api/activites/:codeActivite/variantes */
export async function obtenir(
  req: Request<{ codeActivite: string }>,
  res: Response,
): Promise<void> {
  res.json({ data: await obtenirVariantes(req.params.codeActivite) });
}

const schemaEdition = z.object({
  intituleActivite: z.string().trim().max(500).nullable(),
  intituleCompetence: z.string().trim().max(500).nullable(),
  // ACT_DET_1..9 / COMP_DET_1..9 : neuf blocs au maximum dans la source.
  detailsActivite: z.array(z.string().trim().min(1).max(500)).max(9),
  detailsCompetence: z.array(z.string().trim().min(1).max(500)).max(9),
  // NIV_MATR_1..4 : quatre paliers au maximum.
  niveauxMaitrise: z
    .array(z.object({ niveau: z.number().int().min(1).max(4), description: z.string().trim().min(1).max(1000) }))
    .max(4),
});

const schemaHarmonisation = z.object({
  coupleModeleId: z.number().int().positive(),
  /** Si fourni, réécrit le couple modèle avant de le propager — voir le service. */
  edition: schemaEdition.optional(),
});

/** PUT /api/activites/:codeActivite/harmoniser */
export async function harmoniser(
  req: Request<{ codeActivite: string }>,
  res: Response,
): Promise<void> {
  const { coupleModeleId, edition } = schemaHarmonisation.parse(req.body);
  const resultat = await harmoniserCouple(req.params.codeActivite, coupleModeleId, edition);
  res.json(resultat);
}
