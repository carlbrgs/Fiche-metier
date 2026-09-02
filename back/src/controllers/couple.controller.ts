import { Request, Response } from 'express';
import { z } from 'zod';
import { Metier } from '../models';
import { HttpError } from '../types/api';
import {
  listerActivitesAjoutables,
  listerVariantes,
  ajouterCouple,
  supprimerCouple,
} from '../services/couple.service';
import { recalculerProximites, etatProximites } from '../services/passerelle.service';

async function exigerMetier(code: string): Promise<void> {
  const metier = await Metier.findByPk(code, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${code}`);
}

/**
 * GET /api/metiers/:code/couples-ajoutables?search=
 * Le catalogue des activités que cette fiche ne porte pas encore.
 */
export async function listerAjoutables(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  await exigerMetier(req.params.code);
  const recherche = req.query.search ? String(req.query.search) : undefined;
  res.json({ data: await listerActivitesAjoutables(req.params.code, recherche) });
}

/**
 * GET /api/metiers/:code/couples-ajoutables/:codeActivite
 * Les rédactions existantes de ce code activité, avec leurs formacodes : l'ajout en recopie
 * une, et elles diffèrent d'une fiche à l'autre pour la moitié des codes partagés.
 */
export async function listerVariantesActivite(
  req: Request<{ code: string; codeActivite: string }>,
  res: Response,
): Promise<void> {
  await exigerMetier(req.params.code);
  const variantes = await listerVariantes(req.params.codeActivite, req.params.code);
  if (variantes.length === 0) {
    throw HttpError.notFound(`Aucune rédaction disponible pour ${req.params.codeActivite}`);
  }
  res.json({ data: variantes });
}

const schemaAjout = z.object({
  /** Le couple à recopier, choisi parmi les variantes proposées. */
  coupleSourceId: z.number().int().positive(),
});

/** POST /api/metiers/:code/couples — ajoute un couple en recopiant une rédaction existante. */
export async function ajouter(req: Request<{ code: string }>, res: Response): Promise<void> {
  await exigerMetier(req.params.code);
  const { coupleSourceId } = schemaAjout.parse(req.body);
  const couple = await ajouterCouple(req.params.code, coupleSourceId);
  res.status(201).json(couple);
}

/** DELETE /api/metiers/:code/couples/:id */
export async function supprimer(
  req: Request<{ code: string; id: string }>,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw HttpError.badRequest('Identifiant de couple invalide');

  await exigerMetier(req.params.code);
  await supprimerCouple(req.params.code, id);
  res.status(204).end();
}

/** GET /api/metiers/:code/proximites/etat — les passerelles de la fiche sont-elles périmées ? */
export async function obtenirEtatProximites(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  await exigerMetier(req.params.code);
  res.json(await etatProximites(req.params.code));
}

/**
 * POST /api/passerelles/recalculer — rejoue `recalculerProximites()` (~110 000 lignes).
 * Déclenché par l'utilisateur depuis le bandeau de la fiche : le calcul est trop lourd pour
 * être joué à chaque ajout ou suppression de couple.
 */
export async function recalculer(_req: Request, res: Response): Promise<void> {
  const { lignes } = await recalculerProximites();
  res.json({ lignes, calculeLe: new Date().toISOString() });
}
