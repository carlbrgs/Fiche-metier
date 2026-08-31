import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  listerMetiersProches,
  comparerDeuxMetiers,
} from '../controllers/passerelle.controller';

export const passerelleRoutes = Router();

passerelleRoutes.get('/:code/proches', asyncHandler(listerMetiersProches));
passerelleRoutes.get('/:source/vers/:cible', asyncHandler(comparerDeuxMetiers));
