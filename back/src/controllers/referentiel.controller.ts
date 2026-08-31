import { Request, Response } from 'express';
import {
  FamilleMetier,
  FamilleActivite,
  CritereCondition,
  CompetenceTransversale,
  CritereAcces,
  DossierSource,
  Nsf,
  Rome,
} from '../models';

/**
 * GET /api/referentiels — toutes les nomenclatures en un appel.
 * Ces tables sont petites (< 100 lignes au total) et alimentent tous les filtres du front :
 * un seul aller-retour au démarrage évite 7 requêtes.
 */
export async function listerReferentiels(_req: Request, res: Response): Promise<void> {
  const [familles, famillesActivite, conditions, transversales, acces, dossiers, nsf, rome] =
    await Promise.all([
      FamilleMetier.findAll({ order: [['codeFamille', 'ASC']] }),
      FamilleActivite.findAll({ order: [['codeFamilleActivite', 'ASC']] }),
      CritereCondition.findAll({ order: [['ordre', 'ASC']] }),
      CompetenceTransversale.findAll({ order: [['ordre', 'ASC']] }),
      CritereAcces.findAll({ order: [['ordre', 'ASC']] }),
      DossierSource.findAll({ order: [['libelle', 'ASC']] }),
      Nsf.findAll({ order: [['codeNsf', 'ASC']] }),
      Rome.findAll({ order: [['codeRome', 'ASC']] }),
    ]);

  res.json({
    famillesMetier: familles,
    famillesActivite,
    conditions,
    transversales,
    acces,
    dossiersSource: dossiers,
    nsf,
    rome,
  });
}
