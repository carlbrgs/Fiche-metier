import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Enveloppe un handler async pour que ses rejets partent vers le middleware d'erreur.
 * Express n'attrape pas les promesses rejetées : sans ça, une requête échouée reste pendante.
 *
 * Le paramètre générique `P` porte le type des paramètres de route. Depuis Express 5,
 * `req.params` est typé `string | string[]` par défaut (les segments répétables de
 * path-to-regexp v8) ; déclarer `asyncHandler<{ code: string }>` redonne un `string`.
 */
export function asyncHandler<P = Record<string, string>>(
  fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler<P> {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
