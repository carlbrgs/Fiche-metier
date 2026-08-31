import { Request, Response, NextFunction } from 'express';
import { ValidationError as SequelizeValidationError, DatabaseError } from 'sequelize';
import { ZodError } from 'zod';
import { HttpError, ApiErrorBody } from '../types/api';
import { isProduction } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: { message: `Route inconnue : ${req.method} ${req.originalUrl}`, code: 'ROUTE_INCONNUE' },
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature à 4 args requise par Express
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, code: err.code, details: err.details },
    } satisfies ApiErrorBody);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: 'Paramètres invalides', code: 'VALIDATION', details: err.issues },
    } satisfies ApiErrorBody);
    return;
  }

  if (err instanceof SequelizeValidationError) {
    res.status(400).json({
      error: {
        message: 'Données invalides',
        code: 'VALIDATION_BDD',
        details: err.errors.map((e) => ({ champ: e.path, message: e.message })),
      },
    } satisfies ApiErrorBody);
    return;
  }

  console.error('Erreur non gérée :', err);

  // Le détail SQL ne doit jamais fuiter côté client en production.
  const message =
    !isProduction && err instanceof DatabaseError
      ? err.message
      : 'Erreur interne du serveur';

  res.status(500).json({ error: { message, code: 'ERREUR_INTERNE' } } satisfies ApiErrorBody);
}
