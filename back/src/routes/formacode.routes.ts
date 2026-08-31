import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { listerFormacodes, obtenirFormacode } from '../controllers/formacode.controller';

export const formacodeRoutes = Router();

formacodeRoutes.get('/', asyncHandler(listerFormacodes));
formacodeRoutes.get('/:code', asyncHandler(obtenirFormacode));
