import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  listerMetiersProches,
  comparerDeuxMetiers,
} from '../controllers/passerelle.controller';
import { recalculer } from '../controllers/couple.controller';

export const passerelleRoutes = Router();

// Avant `/:code/...` : `recalculer` ne doit pas être pris pour un code métier.
passerelleRoutes.post('/recalculer', asyncHandler(recalculer));
passerelleRoutes.get('/:code/proches', asyncHandler(listerMetiersProches));
passerelleRoutes.get('/:source/vers/:cible', asyncHandler(comparerDeuxMetiers));
