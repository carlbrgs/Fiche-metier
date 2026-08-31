import { Router } from 'express';
import { metierRoutes } from './metier.routes';
import { activiteRoutes } from './activite.routes';
import { formacodeRoutes } from './formacode.routes';
import { referentielRoutes } from './referentiel.routes';
import { passerelleRoutes } from './passerelle.routes';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRoutes.use('/metiers', metierRoutes);
apiRoutes.use('/activites', activiteRoutes);
apiRoutes.use('/formacodes', formacodeRoutes);
apiRoutes.use('/referentiels', referentielRoutes);
apiRoutes.use('/passerelles', passerelleRoutes);
