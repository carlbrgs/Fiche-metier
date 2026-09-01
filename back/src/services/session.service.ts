import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

export const COOKIE_SESSION = 'session';
const DUREE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

interface ChargeUtile {
  utilisateur: string;
  expire: number;
}

function signer(donnees: string): string {
  return createHmac('sha256', env.auth.sessionSecret).update(donnees).digest('base64url');
}

/**
 * Jeton de session auto-porteur, signé HMAC-SHA256 : pas de table `session` à gérer, la
 * validité se vérifie sans aller en base. Format `<payload base64url>.<signature base64url>`.
 */
export function creerJeton(utilisateur: string): string {
  const charge: ChargeUtile = { utilisateur, expire: Date.now() + DUREE_SESSION_MS };
  const payload = Buffer.from(JSON.stringify(charge)).toString('base64url');
  return `${payload}.${signer(payload)}`;
}

export function verifierJeton(jeton: string | undefined): boolean {
  if (!jeton) return false;
  const [payload, signature] = jeton.split('.');
  if (!payload || !signature) return false;

  const attendue = Buffer.from(signer(payload));
  const recue = Buffer.from(signature);
  // Longueurs égales avant timingSafeEqual : une longueur différente lèverait, et la
  // comparer directement réintroduirait la fuite de timing qu'on cherche à éviter.
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return false;

  try {
    const charge = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ChargeUtile;
    return charge.expire > Date.now();
  } catch {
    return false;
  }
}

/** Comparaison en temps constant — évite qu'un timing attack ne devine le mot de passe caractère par caractère. */
export function motDePasseValide(saisi: string): boolean {
  const attendu = Buffer.from(env.auth.password);
  const recu = Buffer.from(saisi);
  if (attendu.length !== recu.length) return false;
  return timingSafeEqual(attendu, recu);
}
