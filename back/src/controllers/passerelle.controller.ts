import { Request, Response } from 'express';
import { Metier } from '../models';
import { HttpError } from '../types/api';
import {
  trouverMetiersProches,
  comparerMetiers,
  ParametresProximite,
} from '../services/passerelle.service';

/**
 * GET /api/passerelles/:code/proches?heuresMax=&dcMin=&limite=
 * Reproduit la feuille « Liste métiers proches » : les trois paramètres et leurs
 * valeurs par défaut viennent directement du classeur.
 */
export async function listerMetiersProches(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const metier = await Metier.findByPk(req.params.code);
  if (!metier) throw HttpError.notFound(`Métier ${req.params.code}`);

  const parametres: ParametresProximite = {
    heuresMax: Number(req.query.heuresMax) || 10_000,
    dcMin: Number(req.query.dcMin) || 1,
    limite: Math.min(Number(req.query.limite) || 15, 100),
  };

  const resultats = await trouverMetiersProches(metier.codeMetier, parametres);
  res.json({ metier, parametres, data: resultats });
}

/** GET /api/passerelles/:source/vers/:cible — écart détaillé entre deux métiers. */
export async function comparerDeuxMetiers(
  req: Request<{ source: string; cible: string }>,
  res: Response,
): Promise<void> {
  const { source, cible } = req.params;

  const [metierSource, metierCible] = await Promise.all([
    Metier.findByPk(source),
    Metier.findByPk(cible),
  ]);

  if (!metierSource) throw HttpError.notFound(`Métier ${source}`);
  if (!metierCible) throw HttpError.notFound(`Métier ${cible}`);

  res.json(await comparerMetiers(source, cible));
}
