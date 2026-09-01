import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  listerMetiers,
  listerMetiersOptions,
  obtenirMetier,
  modifierMetier,
  obtenirActivitesMetier,
  obtenirConnaissancesMetier,
} from '../controllers/metier.controller';

export const metierRoutes = Router();

metierRoutes.get('/', asyncHandler(listerMetiers));
// Avant `/:code` : sinon Express résout `options` comme un code métier.
metierRoutes.get('/options', asyncHandler(listerMetiersOptions));
metierRoutes.get('/:code', asyncHandler(obtenirMetier));
metierRoutes.patch('/:code', asyncHandler(modifierMetier));
metierRoutes.get('/:code/activites', asyncHandler(obtenirActivitesMetier));
metierRoutes.get('/:code/connaissances', asyncHandler(obtenirConnaissancesMetier));
