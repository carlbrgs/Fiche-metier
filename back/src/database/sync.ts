/**
 * Synchronisation du schéma à partir des modèles Sequelize.
 * DÉVELOPPEMENT UNIQUEMENT — en production, utiliser `npm run db:migrate`.
 */
import { sequelize } from './connection';
import { isProduction } from '../config/env';
import '../models';

async function main() {
  if (isProduction) {
    console.error('db:sync est interdit en production. Utiliser db:migrate.');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  if (force) {
    console.warn('⚠️  --force : toutes les tables vont être supprimées et recréées.');
  }

  await sequelize.authenticate();
  await sequelize.sync({ force, alter: !force });
  console.log('✅ Schéma synchronisé.');
  await sequelize.close();
}

main().catch((err) => {
  console.error('❌ Échec de la synchronisation :', err);
  process.exit(1);
});
