import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env, isProduction } from './config/env';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import './models'; // enregistre les modèles et leurs associations

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? 'combined' : 'dev'));

  app.use('/api', apiRoutes);

  // Toujours en dernier : le 404 doit voir passer les routes non résolues,
  // et le handler d'erreur doit être le dernier middleware enregistré.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
