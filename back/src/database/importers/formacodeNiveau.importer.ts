import path from 'node:path';
import { env } from '../../config/env';
import { sequelize, Nsf, Formacode, FormacodeNiveau, ImportBatch } from '../../models';
import { lireFeuilleBrute, texte, nombre } from './xlsxReader';

/** Colonnes de la feuille `Formacode_niveau` (index 0). */
const COL = {
  formacode: 0,
  intitule: 1,
  duree: [2, 5] as const, // Niveau 1..4, en heures
  justificatif: [6, 9] as const, // Justificatif : niveau 1..4
  fondamental: 10,
  nsf: 11,
} as const;

/**
 * Importe la feuille `Formacode_niveau` du classeur des compétences.
 *
 * Elle fait autorité sur les libellés : « Bonnes pratiques hygiène agroalimentaire »
 * là où le fichier des formacodes structurants écrit « agroalmentaire » et où l'outil
 * de collecte est tout en capitales. C'est cette version qu'affiche la fiche Excel.
 *
 * Elle apporte aussi des formacodes absents du premier classeur : 32 des 168 codes
 * cités par les fiches n'y figurent pas.
 */
export async function importerFormacodeNiveau(): Promise<void> {
  const fichier = path.resolve(__dirname, '../../..', env.xlsx.competences);
  const lignes = lireFeuilleBrute(fichier, 'Formacode_niveau');

  const batch = await ImportBatch.create({
    fichier: path.basename(fichier),
    feuille: 'Formacode_niveau',
    version: 'V3.3',
    lignesLues: lignes.length - 1,
    rapport: null,
    termineLe: null,
  });

  const rejets: Array<{ ligne: number; motif: string }> = [];
  let formacodes = 0;
  let niveaux = 0;

  const transaction = await sequelize.transaction();
  try {
    for (const [index, ligne] of lignes.slice(1).entries()) {
      const numeroLigne = index + 2;
      const codeFormacode = texte(ligne[COL.formacode]);
      const intitule = texte(ligne[COL.intitule]);

      if (!codeFormacode) continue; // lignes de remplissage en fin de feuille
      if (!intitule) {
        rejets.push({ ligne: numeroLigne, motif: `Intitulé absent pour ${codeFormacode}` });
        continue;
      }

      const codeNsf = texte(ligne[COL.nsf]);
      if (codeNsf) {
        await Nsf.findOrCreate({
          where: { codeNsf },
          defaults: { codeNsf, libelle: null },
          transaction,
        });
      }

      // upsert et non findOrCreate : cette feuille corrige les libellés du premier
      // classeur, elle doit donc pouvoir les écraser.
      await Formacode.upsert(
        {
          codeFormacode,
          intitule,
          codeNsf,
          estFondamental: texte(ligne[COL.fondamental]) === '1',
        },
        { transaction },
      );
      formacodes += 1;

      for (let niveau = 1; niveau <= 4; niveau++) {
        const dureeHeures = nombre(ligne[COL.duree[0] + niveau - 1]);
        const justif = texte(ligne[COL.justificatif[0] + niveau - 1]);
        if (dureeHeures === null && !justif) continue;

        await FormacodeNiveau.upsert(
          {
            codeFormacode,
            niveau,
            estNiveauUnique: false,
            dureeHeures,
            dureeSemaines: null,
            dureeMois: null,
            methodeCalcul: justif,
            source: null,
            origine: 'base_competences',
          },
          { transaction },
        );
        niveaux += 1;
      }
    }

    await batch.update(
      {
        lignesOk: formacodes,
        lignesErreur: rejets.length,
        rapport: rejets.length > 0 ? { rejets } : null,
        statut: 'termine',
        termineLe: new Date(),
      },
      { transaction },
    );
    await transaction.commit();

    console.log(`   ${formacodes} formacodes, ${niveaux} durées par niveau`);
    if (rejets.length) console.log(`   ⚠️  ${rejets.length} lignes rejetées (import_batch #${batch.id})`);
  } catch (err) {
    await transaction.rollback();
    await batch.update({ statut: 'echec', termineLe: new Date() });
    throw err;
  }
}
