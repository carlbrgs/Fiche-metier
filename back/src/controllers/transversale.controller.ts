import { Request, Response } from 'express';
import { z } from 'zod';
import { sequelize } from '../database/connection';
import { Metier, MetierTransversale, CompetenceTransversale } from '../models';
import { HttpError } from '../types/api';
import { marquerProximitePerimee, CODES_TRANSVERSE_BONUS } from '../services/passerelle.service';

/**
 * `niveau` court de 1 à 4 : ce sont les quatre paliers du référentiel
 * `competence_transversale` (palier_1..palier_4), et la fiche affiche le texte du palier
 * retenu. « Non concerné » n'est pas un cinquième palier mais l'absence de niveau — d'où
 * le couple (`niveau = null`, `nonConcerne = true`) que le modèle documente.
 */
const schemaLigne = z
  .object({
    codeTransversale: z.string().trim().min(1).max(10),
    niveau: z.number().int().min(1).max(4).nullable(),
    nonConcerne: z.boolean(),
  })
  .refine((l) => !(l.nonConcerne && l.niveau !== null), {
    message: 'Une ressource « non concernée » ne peut pas porter de niveau',
  });

const schemaModification = z.object({
  transversales: z.array(schemaLigne).min(1).max(50),
});

/**
 * PUT /api/metiers/:code/transversales
 *
 * Écrit les niveaux d'un coup plutôt qu'une route par ligne : la section s'édite et
 * s'enregistre en bloc, et une transaction unique évite qu'un échec en cours de route ne
 * laisse la fiche moitié modifiée.
 *
 * `upsert` et non `update` : les lignes absentes sont créées. La fiche D309 ne porte que
 * 16 des 17 ressources du référentiel — sans ça, sa ressource manquante resterait
 * définitivement inéditable.
 */
export async function modifierTransversales(
  req: Request<{ code: string }>,
  res: Response,
): Promise<void> {
  const codeMetier = req.params.code;
  const metier = await Metier.findByPk(codeMetier, { attributes: ['codeMetier'] });
  if (!metier) throw HttpError.notFound(`Métier ${codeMetier}`);

  const { transversales } = schemaModification.parse(req.body);

  // Un code inconnu passerait la validation Zod mais violerait la clé étrangère : on le
  // refuse ici pour renvoyer un message utile plutôt qu'une erreur SQL brute.
  const referentiel = await CompetenceTransversale.findAll({ attributes: ['codeTransversale'] });
  const codesConnus = new Set(referentiel.map((c) => c.codeTransversale));
  const inconnus = transversales
    .map((t) => t.codeTransversale)
    .filter((c) => !codesConnus.has(c));
  if (inconnus.length > 0) {
    throw HttpError.badRequest(`Ressource transverse inconnue : ${inconnus.join(', ')}`);
  }

  const doublons = transversales.length !== new Set(transversales.map((t) => t.codeTransversale)).size;
  if (doublons) throw HttpError.badRequest('Une même ressource transverse est envoyée deux fois');

  // Les niveaux de TRANSV_2 / 8 / 10 entrent dans le degré d'élargissement : seuls leurs
  // changements périment `metier_proximite`. Modifier les 14 autres n'a aucun effet sur le
  // calcul, et ne doit donc pas déclencher le bandeau de recalcul.
  const avant = await MetierTransversale.findAll({ where: { codeMetier } });
  const niveauAvant = new Map(avant.map((t) => [t.codeTransversale, t.nonConcerne ? 0 : (t.niveau ?? 0)]));
  const proximiteTouchee = transversales.some((t) => {
    if (!(CODES_TRANSVERSE_BONUS as readonly string[]).includes(t.codeTransversale)) return false;
    return (niveauAvant.get(t.codeTransversale) ?? 0) !== (t.nonConcerne ? 0 : (t.niveau ?? 0));
  });

  await sequelize.transaction(async (transaction) => {
    for (const ligne of transversales) {
      await MetierTransversale.upsert(
        {
          codeMetier,
          codeTransversale: ligne.codeTransversale,
          niveau: ligne.nonConcerne ? null : ligne.niveau,
          nonConcerne: ligne.nonConcerne,
        },
        { transaction },
      );
    }
    if (proximiteTouchee) await marquerProximitePerimee(codeMetier, transaction);
  });

  const apres = await MetierTransversale.findAll({
    where: { codeMetier },
    include: [{ model: CompetenceTransversale, as: 'competence' }],
  });

  res.json({ data: apres, proximitePerimee: proximiteTouchee });
}
