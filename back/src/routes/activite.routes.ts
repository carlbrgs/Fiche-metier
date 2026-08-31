import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { listerActivites, obtenirActivite } from '../controllers/activite.controller';

export const activiteRoutes = Router();

activiteRoutes.get('/', asyncHandler(listerActivites));
activiteRoutes.get('/:code', asyncHandler(obtenirActivite));
