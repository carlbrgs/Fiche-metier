import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { connecter, deconnecter, obtenirSession } from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', asyncHandler(connecter));
authRoutes.post('/logout', asyncHandler(deconnecter));
authRoutes.get('/me', asyncHandler(obtenirSession));
