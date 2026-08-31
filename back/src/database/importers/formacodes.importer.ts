import path from 'node:path';
import { env } from '../../config/env';
import { sequelize, Nsf, Formacode, FormacodeNiveau, ImportBatch } from '../../models';
import { lireFeuille, texte, nombre, niveauApprofondissement, Ligne } from './xlsxReader';

/**
 * Importe « Base formacodes_DC structurants.xlsx » (feuille Feuil1, 471 lignes).
 * Sert de patron pour les autres importeurs : lecture → validation ligne à ligne →
 * upsert dans une transaction → journalisation dans `import_batch`.
 */
export async function importerFormacodes(): Promise<void> {
  const fichier = path.resolve(__dirname, '../../..', env.xlsx.formacodes);
  const lignes = lireFeuille(fichier, 'Feuil1');

  const batch = await ImportBatch.create({
    fichier: path.basename(fichier),
    feuille: 'Feuil1',
    lignesLues: lignes.length,
    rapport: null,
    termineLe: null,
  });

  const rejets: Array<{ ligne: number; intitule: string | null; motif: string }> = [];
  /** Couples (formacode, niveau) définis plusieurs fois dans la source, avec valeurs divergentes. */
  const conflits: Array<{
    formacode: string;
    niveau: number;
    ligneRetenue: number;
    heuresRetenues: number | null;
    ligneIgnoree: number;
    heuresIgnorees: number | null;
  }> = [];
  const vues = new Map<string, { ligne: number; heures: number | null }>();
  let ok = 0;

  const transaction = await sequelize.transaction();
  try {
    // Le classeur laisse la colonne Formacode vide sur les lignes de continuation :
    // le niveau 2 d'un domaine suit son niveau 1 sans répéter le code. On reporte donc
    // le dernier code vu, mais uniquement si l'intitulé est identique — sinon on
    // rattacherait un domaine sans code au domaine précédent, qui n'a rien à voir.
    let precedent: { code: string; intitule: string } | null = null;

    for (const [index, ligne] of lignes.entries()) {
      const numeroLigne = index + 2; // +1 en-tête, +1 base 1
      const resultat = await importerLigne(ligne, precedent, numeroLigne, vues, conflits, transaction);

      if (resultat.codeRetenu) {
        precedent = { code: resultat.codeRetenu, intitule: resultat.intitule ?? '' };
      }

      if (resultat.ok) ok += 1;
      else rejets.push({ ligne: numeroLigne, intitule: resultat.intitule, motif: resultat.motif });
    }

    const rapport =
      rejets.length > 0 || conflits.length > 0 ? { rejets, conflits } : null;

    await batch.update(
      {
        lignesOk: ok,
        lignesErreur: rejets.length,
        rapport,
        statut: 'termine',
        termineLe: new Date(),
      },
      { transaction },
    );

    await transaction.commit();
    console.log(`   ${ok} lignes importées, ${rejets.length} rejetées`);
    if (conflits.length > 0) {
      console.log(`   ⚠️  ${conflits.length} couple(s) (formacode, niveau) définis en double`);
    }
    if (rapport) {
      console.log(`   → détail dans import_batch #${batch.id}`);
    }
  } catch (err) {
    await transaction.rollback();
    await batch.update({ statut: 'echec', termineLe: new Date() });
    throw err;
  }
}

interface Resultat {
  ok: boolean;
  motif: string;
  intitule: string | null;
  /** Code à mémoriser pour le report sur les lignes de continuation suivantes. */
  codeRetenu?: string;
}

async function importerLigne(
  ligne: Ligne,
  precedent: { code: string; intitule: string } | null,
  numeroLigne: number,
  vues: Map<string, { ligne: number; heures: number | null }>,
  conflits: Array<{
    formacode: string;
    niveau: number;
    ligneRetenue: number;
    heuresRetenues: number | null;
    ligneIgnoree: number;
    heuresIgnorees: number | null;
  }>,
  transaction: unknown,
): Promise<Resultat> {
  const opts = { transaction: transaction as never };

  const intitule = texte(ligne['INTITULE']);
  let codeFormacode = texte(ligne['Formacode']);

  if (!intitule) return { ok: false, motif: 'INTITULE absent', intitule: null };

  if (!codeFormacode) {
    const memeDomaine =
      precedent && precedent.intitule.trim().toLowerCase() === intitule.trim().toLowerCase();

    if (!memeDomaine) {
      // Cas réel dans la source : une vingtaine de domaines BTP (Ferraillage, Coffrage,
      // Béton…) sont décrits avec une durée mais n'ont jamais reçu de Formacode.
      // On ne peut pas les créer — la clé primaire EST le code — mais le motif doit
      // être explicite pour que le métier puisse compléter le classeur.
      return { ok: false, motif: 'Domaine non codé dans la source', intitule };
    }
    codeFormacode = precedent.code;
  }

  const codeNsf = texte(ligne['NSF']);
  if (codeNsf) {
    await Nsf.findOrCreate({ where: { codeNsf }, defaults: { codeNsf, libelle: null }, ...opts });
  }

  await Formacode.findOrCreate({
    where: { codeFormacode },
    defaults: { codeFormacode, intitule, codeNsf, estFondamental: false },
    ...opts,
  });

  const { niveau, estUnique } = niveauApprofondissement(ligne["Niveau d'approfondissement"]);
  if (niveau === null) {
    // Le formacode lui-même a bien été créé ci-dessus : seule la durée est ignorée.
    return {
      ok: false,
      motif: "Niveau d'approfondissement absent (formacode créé, durée ignorée)",
      intitule,
      codeRetenu: codeFormacode,
    };
  }

  const dureeHeures = nombre(ligne['Durée réelle en heures']);

  // Le classeur définit certains couples (formacode, niveau) deux fois, parfois avec des
  // durées divergentes — 22472 niveau 2 vaut 171 h ligne 399 et 117,5 h ligne 418.
  // Règle : une ligne sans durée ne doit jamais écraser une ligne qui en porte une.
  // Tout doublon est consigné pour que le métier tranche sur pièces.
  const cle = `${codeFormacode}|${niveau}`;
  const dejaVue = vues.get(cle);

  if (dejaVue) {
    const conserverAncienne = dureeHeures === null && dejaVue.heures !== null;
    conflits.push({
      formacode: codeFormacode,
      niveau,
      ligneRetenue: conserverAncienne ? dejaVue.ligne : numeroLigne,
      heuresRetenues: conserverAncienne ? dejaVue.heures : dureeHeures,
      ligneIgnoree: conserverAncienne ? numeroLigne : dejaVue.ligne,
      heuresIgnorees: conserverAncienne ? dureeHeures : dejaVue.heures,
    });

    if (conserverAncienne) {
      return { ok: true, motif: '', intitule, codeRetenu: codeFormacode };
    }
  }

  vues.set(cle, { ligne: numeroLigne, heures: dureeHeures });

  await FormacodeNiveau.upsert(
    {
      codeFormacode,
      niveau,
      estNiveauUnique: estUnique,
      dureeHeures,
      dureeSemaines: nombre(ligne['Durée réelle en semaines']),
      dureeMois: nombre(ligne['Durée mois (durée retenue milieu intervalle)']),
      methodeCalcul: texte(ligne['Méthode de calcul']),
      source: texte(ligne['Source']),
      origine: 'base_formacodes',
    },
    opts,
  );

  return { ok: true, motif: '', intitule, codeRetenu: codeFormacode };
}
