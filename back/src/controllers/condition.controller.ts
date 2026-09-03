import { Request, Response } from 'express';
import { z } from 'zod';
import { sequelize } from '../database/connection';
import { Metier, MetierCondition, MetierAcces, CritereCondition, CritereAcces } from '../models';
import { HttpError } from '../types/api';
import {
  marquerProximitePerimee,
  CODE_ACCES_NIVEAU_BASSE,
  CODE_ACCES_NIVEAU_HAUTE,
  NIVEAUX_RNCP,
} from '../services/passerelle.service';

const schemaModificationConditions = z.object({
  conditions: z
    .array(
      z.object({
        codeCondition: z.string().trim().min(1).max(10),
        valeur: z.enum(['significatif', 'non_significatif']),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * PUT /api/metiers/:code/conditions — les 15 conditions d'exercice, en bloc.
 * N'entre pas dans le calcul des passerelles (contrairement à ACCES_3/ACCES_4 juste en
 * dessous) : jamais de `marquerProximitePerimee` ici.
 */
export async function modifierConditions(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const codeMetier = req.params.code;
  const metier = await Metier.findByPk(codeMetier, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${codeMetier}`);

  const { conditions } = schemaModificationConditions.parse(req.body);

  const referentiel = await CritereCondition.findAll({ attributes: ['codeCondition'] });
  const codesConnus = new Set(referentiel.map((c) => c.codeCondition));
  const inconnus = conditions.map((c) => c.codeCondition).filter((c) => !codesConnus.has(c));
  if (inconnus.length > 0) {
    throw HttpError.badRequest(`Condition inconnue : ${inconnus.join(', ')}`);
  }
  if (conditions.length !== new Set(conditions.map((c) => c.codeCondition)).size) {
    throw HttpError.badRequest('Une même condition est envoyée deux fois');
  }

  await sequelize.transaction(async (transaction) => {
    for (const c of conditions) {
      await MetierCondition.upsert(
        { codeMetier, codeCondition: c.codeCondition, valeur: c.valeur },
        { transaction },
      );
    }
  });

  const apres = await MetierCondition.findAll({
    where: { codeMetier },
    include: [{ model: CritereCondition, as: 'critere' }],
  });
  res.json({ data: apres });
}

const schemaModificationAcces = z.object({
  acces: z
    .array(
      z.object({
        codeAcces: z.string().trim().min(1).max(10),
        // `null`/vide retire la réponse plutôt que d'écrire une chaîne vide — les 7 colonnes
        // sont d'authentiques questions à réponse facultative (docs/SCHEMA.md §8).
        valeur: z.string().trim().max(500).nullable(),
      }),
    )
    .min(1)
    .max(50),
});

const CODES_RNCP = new Set<string>([CODE_ACCES_NIVEAU_BASSE, CODE_ACCES_NIVEAU_HAUTE]);

/**
 * PUT /api/metiers/:code/acces — les 7 conditions d'accès, en bloc.
 *
 * ACCES_3/ACCES_4 (« niveau ou intervalle de niveaux de qualification professionnelle
 * attendu ») sont contraints aux niveaux RNCP Niv.3 à Niv.8 : un texte libre passerait la
 * validation mais casserait silencieusement `recalculerProximites()`, qui les parse au mot
 * près pour en déduire le niveau de formation (services/passerelle.service.ts). Les 5
 * autres codes restent en texte libre, hétérogènes par nature.
 */
export async function modifierAcces(req: Request<{ code: string }>, res: Response): Promise<void> {
  const codeMetier = req.params.code;
  const metier = await Metier.findByPk(codeMetier, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${codeMetier}`);

  const { acces } = schemaModificationAcces.parse(req.body);

  const referentiel = await CritereAcces.findAll({ attributes: ['codeAcces'] });
  const codesConnus = new Set(referentiel.map((c) => c.codeAcces));
  const inconnus = acces.map((a) => a.codeAcces).filter((c) => !codesConnus.has(c));
  if (inconnus.length > 0) {
    throw HttpError.badRequest(`Condition d'accès inconnue : ${inconnus.join(', ')}`);
  }
  if (acces.length !== new Set(acces.map((a) => a.codeAcces)).size) {
    throw HttpError.badRequest('Une même condition d’accès est envoyée deux fois');
  }

  for (const a of acces) {
    const valeur = a.valeur?.trim();
    if (CODES_RNCP.has(a.codeAcces) && valeur && !(NIVEAUX_RNCP as readonly string[]).includes(valeur)) {
      throw HttpError.badRequest(
        `${a.codeAcces} doit être un niveau RNCP (${NIVEAUX_RNCP[0]} à ${NIVEAUX_RNCP[NIVEAUX_RNCP.length - 1]}) ou vide`,
      );
    }
  }

  // Seules les deux bornes de niveau RNCP entrent dans le degré d'élargissement : le
  // domaine visé, l'expérience requise etc. n'ont aucun effet sur `metier_proximite`.
  const avant = await MetierAcces.findAll({
    where: { codeMetier, codeAcces: [CODE_ACCES_NIVEAU_BASSE, CODE_ACCES_NIVEAU_HAUTE] },
  });
  const avantParCode = new Map(avant.map((a) => [a.codeAcces, a.valeur]));
  const proximiteTouchee = acces.some((a) => {
    if (!CODES_RNCP.has(a.codeAcces)) return false;
    return (avantParCode.get(a.codeAcces) ?? null) !== (a.valeur?.trim() || null);
  });

  await sequelize.transaction(async (transaction) => {
    for (const a of acces) {
      const valeur = a.valeur?.trim();
      if (!valeur) {
        await MetierAcces.destroy({ where: { codeMetier, codeAcces: a.codeAcces }, transaction });
      } else {
        await MetierAcces.upsert({ codeMetier, codeAcces: a.codeAcces, valeur }, { transaction });
      }
    }
    if (proximiteTouchee) await marquerProximitePerimee(codeMetier, transaction);
  });

  const apres = await MetierAcces.findAll({
    where: { codeMetier },
    include: [{ model: CritereAcces, as: 'critere' }],
  });
  res.json({ data: apres, proximitePerimee: proximiteTouchee });
}
