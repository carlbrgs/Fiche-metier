import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { exporterGeneral } from '../controllers/export.controller';

export const exportRoutes = Router();

exportRoutes.get('/general', asyncHandler(exporterGeneral));
