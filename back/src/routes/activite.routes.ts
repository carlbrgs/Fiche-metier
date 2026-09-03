import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { listerActivites, obtenirActivite } from '../controllers/activite.controller';
import { lister, obtenir, harmoniser } from '../controllers/incoherence.controller';

export const activiteRoutes = Router();

activiteRoutes.get('/', asyncHandler(listerActivites));
// Avant `/:code` : sinon Express résout `incoherences` comme un code activité.
activiteRoutes.get('/incoherences', asyncHandler(lister));
activiteRoutes.get('/:code', asyncHandler(obtenirActivite));

// Correction des rédactions divergentes d'un même code activité entre métiers.
activiteRoutes.get('/:codeActivite/variantes', asyncHandler(obtenir));
activiteRoutes.put('/:codeActivite/harmoniser', asyncHandler(harmoniser));
