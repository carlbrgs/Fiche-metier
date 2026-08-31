import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  listerMetiers,
  obtenirMetier,
  obtenirActivitesMetier,
  obtenirConnaissancesMetier,
} from '../controllers/metier.controller';

export const metierRoutes = Router();

metierRoutes.get('/', asyncHandler(listerMetiers));
metierRoutes.get('/:code', asyncHandler(obtenirMetier));
metierRoutes.get('/:code/activites', asyncHandler(obtenirActivitesMetier));
metierRoutes.get('/:code/connaissances', asyncHandler(obtenirConnaissancesMetier));
