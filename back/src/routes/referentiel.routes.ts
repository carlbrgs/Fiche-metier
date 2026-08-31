import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { listerReferentiels } from '../controllers/referentiel.controller';

export const referentielRoutes = Router();

referentielRoutes.get('/', asyncHandler(listerReferentiels));
