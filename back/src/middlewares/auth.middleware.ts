import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types/api';
import { COOKIE_SESSION, verifierJeton } from '../services/session.service';

/** Protège tout ce qui est monté après lui dans `routes/index.ts`. */
export function exigerAuthentification(req: Request, _res: Response, next: NextFunction): void {
  if (!verifierJeton(req.cookies?.[COOKIE_SESSION])) {
    next(new HttpError(401, 'Authentification requise', 'NON_AUTHENTIFIE'));
    return;
  }
  next();
}
