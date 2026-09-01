import { Request, Response } from 'express';
import { env, isProduction } from '../config/env';
import { HttpError } from '../types/api';
import { COOKIE_SESSION, creerJeton, motDePasseValide, verifierJeton } from '../services/session.service';

const OPTIONS_COOKIE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  // `secure` exige HTTPS : en dev (http://localhost) le cookie ne partirait jamais sinon.
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** POST /api/auth/login — { username, password } -> pose le cookie de session. */
export async function connecter(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    throw HttpError.badRequest('Identifiant et mot de passe requis');
  }

  // Comparaison de l'identifiant en temps constant elle aussi : lui seul suffirait sinon
  // à distinguer « mauvais identifiant » de « mauvais mot de passe » par le timing.
  const identifiantValide =
    username.length === env.auth.username.length && username === env.auth.username;

  if (!identifiantValide || !motDePasseValide(password)) {
    throw new HttpError(401, 'Identifiant ou mot de passe incorrect', 'IDENTIFIANTS_INVALIDES');
  }

  res.cookie(COOKIE_SESSION, creerJeton(username), OPTIONS_COOKIE);
  res.json({ authentifie: true });
}

/** POST /api/auth/logout */
export async function deconnecter(_req: Request, res: Response): Promise<void> {
  res.clearCookie(COOKIE_SESSION);
  res.json({ authentifie: false });
}

/**
 * GET /api/auth/me — jamais 401 : le front l'appelle au démarrage pour savoir s'il doit
 * afficher la page de connexion ou l'application, une seule réponse booléenne suffit.
 */
export async function obtenirSession(req: Request, res: Response): Promise<void> {
  res.json({ authentifie: verifierJeton(req.cookies?.[COOKIE_SESSION]) });
}
