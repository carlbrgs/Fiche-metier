/**
 * Recalcule intégralement `metier_proximite` (degré d'élargissement, durée d'acquisition,
 * domaines de connaissance communs) depuis les données déjà importées.
 *
 *   npm run db:recalc-proximites
 *
 * À rejouer après tout import qui touche metier, metier_acces, metier_transversale ou
 * activite_connaissance — voir services/passerelle.service.ts pour la formule.
 */
import '../models';
import { sequelize } from './connection';
import { recalculerProximites } from '../services/passerelle.service';

async function main(): Promise<void> {
  await sequelize.authenticate();
  console.log('▶  Recalcul de metier_proximite…');
  const { lignes } = await recalculerProximites();
  console.log(`✅ ${lignes} lignes recalculées.`);
  await sequelize.close();
}

main().catch(async (err) => {
  console.error('❌ Recalcul échoué :', err.message);
  await sequelize.close().catch(() => undefined);
  process.exit(1);
});
