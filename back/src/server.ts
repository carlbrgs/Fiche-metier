import { createApp } from './app';
import { env } from './config/env';
import { sequelize, testConnection } from './database/connection';

async function demarrer(): Promise<void> {
  try {
    await testConnection();
    console.log(`✅ Connecté à MariaDB (${env.db.host}:${env.db.port}/${env.db.name})`);
  } catch (err) {
    console.error('❌ Connexion à la base impossible :', (err as Error).message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`🚀 API sur http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  // Arrêt propre : indispensable derrière un reverse proxy sur le VPS, sinon les
  // requêtes en cours sont coupées à chaque redéploiement.
  const arreter = (signal: string) => {
    console.log(`\n${signal} reçu, arrêt en cours…`);
    server.close(() => {
      sequelize.close().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => arreter('SIGTERM'));
  process.on('SIGINT', () => arreter('SIGINT'));
}

demarrer();
