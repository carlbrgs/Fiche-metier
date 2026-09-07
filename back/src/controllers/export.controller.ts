import { Request, Response } from 'express';
import {
  Metier,
  FamilleMetier,
  DossierSource,
  MetierActivite,
  ActiviteConnaissance,
  MetierTransversale,
  CompetenceTransversale,
  MetierCondition,
  CritereCondition,
  MetierAcces,
  CritereAcces,
} from '../models';

/**
 * GET /api/export/general — les tables sources de l'app, à plat, pour un export externe
 * (page Domaines de connaissance, bouton « Exporter toute la base »).
 *
 * Six requêtes indépendantes plutôt qu'un seul `findAll` à includes multiples : plusieurs
 * `hasMany` inclus ensemble produiraient un produit cartésien (un métier avec 5 couples et
 * 12 ressources transverses donnerait 60 lignes dupliquées). Le volume total (~20 000 lignes
 * réparties sur six tables) reste largement dans les clous d'un export déclenché à la main.
 *
 * `metier_proximite` (110 000 lignes calculées, pas des données sources) en est délibérément
 * exclue — voir services/passerelle.service.ts si un export dédié devient utile.
 */
export async function exporterGeneral(_req: Request, res: Response): Promise<void> {
  const [metiers, couples, connaissances, transversales, conditions, acces] = await Promise.all([
    Metier.findAll({
      include: [
        { model: FamilleMetier, as: 'famille', attributes: ['intitule'] },
        { model: DossierSource, as: 'dossierSource', attributes: ['libelle'] },
      ],
      order: [['codeMetier', 'ASC']],
    }),
    MetierActivite.findAll({
      attributes: ['codeMetier', 'codeActivite', 'ordre', 'intituleActivite', 'intituleCompetence'],
      order: [
        ['codeMetier', 'ASC'],
        ['ordre', 'ASC'],
      ],
    }),
    ActiviteConnaissance.findAll({
      include: [
        {
          model: MetierActivite,
          as: 'couple',
          attributes: ['codeMetier', 'codeActivite', 'ordre'],
        },
      ],
      order: [['id', 'ASC']],
    }),
    MetierTransversale.findAll({
      include: [
        { model: CompetenceTransversale, as: 'competence', attributes: ['libelle', 'groupe'] },
      ],
      order: [['codeMetier', 'ASC']],
    }),
    MetierCondition.findAll({
      include: [{ model: CritereCondition, as: 'critere', attributes: ['libelle'] }],
      order: [['codeMetier', 'ASC']],
    }),
    MetierAcces.findAll({
      include: [{ model: CritereAcces, as: 'critere', attributes: ['libelle'] }],
      order: [['codeMetier', 'ASC']],
    }),
  ]);

  res.json({ metiers, couples, connaissances, transversales, conditions, acces });
}
