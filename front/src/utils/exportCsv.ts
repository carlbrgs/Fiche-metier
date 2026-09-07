import { listerFormacodes } from '@/api/activites';
import type { FiltresFormacodes } from '@/api/activites';
import { obtenirExportGeneral } from '@/api/export';
import type { Formacode } from '@/types/api';

// Point-virgule et non virgule : c'est le séparateur que le Excel français reconnaît
// d'office à l'ouverture d'un .csv (la virgule y est déjà le séparateur décimal).
const SEPARATEUR = ';';

function echapper(valeur: string): string {
  if (/[";\n]/.test(valeur)) return `"${valeur.replace(/"/g, '""')}"`;
  return valeur;
}

function ligneCsv(champs: string[]): string {
  return champs.map(echapper).join(SEPARATEUR);
}

/** En-tête + lignes -> texte CSV complet, BOM inclus (sans lui Excel lit les accents en Latin-1). */
function construireCsv(entete: string[], lignes: string[][]): string {
  const contenu = [ligneCsv(entete), ...lignes.map(ligneCsv)].join('\r\n');
  return '﻿' + contenu;
}

function telechargerBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/** Toutes les pages, dans la limite du filtre donné — la pagination reste un détail d'affichage. */
async function chargerTousLesFormacodes(filtres: FiltresFormacodes): Promise<Formacode[]> {
  const limit = 200;
  const premiere = await listerFormacodes({ ...filtres, page: 1, limit });
  const donnees = [...premiere.data];

  for (let page = 2; page <= premiere.pagination.totalPages; page++) {
    const suite = await listerFormacodes({ ...filtres, page, limit });
    donnees.push(...suite.data);
  }

  return donnees;
}

/**
 * Export simple de la page Domaines de connaissance : formacode, intitulé, NSF, fondamental.
 * Respecte la recherche/le filtre NSF actifs sur la page — pas de filtre revient à tout exporter.
 */
export async function exporterFormacodesCsv(filtres: FiltresFormacodes): Promise<void> {
  const formacodes = await chargerTousLesFormacodes(filtres);

  const csv = construireCsv(
    ['Formacode', 'Intitulé', 'NSF', 'Fondamental'],
    formacodes.map((f) => [f.codeFormacode, f.intitule, f.codeNsf ?? '', f.estFondamental ? 'Oui' : 'Non']),
  );

  telechargerBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'domaines-de-connaissance.csv');
}

/**
 * Export général de la base : un .zip de six .csv (métiers, couples activité-compétence,
 * domaines de connaissance, ressources transverses, conditions d'exercice, conditions
 * d'accès) — les tables sources de l'app, pas les tables calculées (passerelles).
 *
 * `jszip` est chargé à la demande : il ne pèse que sur ce clic, jamais sur le bundle
 * principal (déjà présent en dépendance de `docx`, utilisé pour l'export Word).
 */
export async function exporterBaseGenerale(): Promise<void> {
  const donnees = await obtenirExportGeneral();
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  zip.file(
    'metiers.csv',
    construireCsv(
      [
        'Code métier',
        'Intitulé',
        'Famille',
        'Définition',
        'Responsabilités transversales',
        'Interface amont/aval',
        'Dossier source',
        'Dossier (autre)',
        'Rédacteur',
        'Nb couples',
      ],
      donnees.metiers.map((m) => [
        m.codeMetier,
        m.intitule,
        m.famille?.intitule ?? '',
        m.definition ?? '',
        m.responsTransverse ?? '',
        m.interfaceAmontAval ?? '',
        m.dossierSource?.libelle ?? '',
        m.dossierAutre ?? '',
        m.redacteur ?? '',
        m.nbCouple !== null ? String(m.nbCouple) : '',
      ]),
    ),
  );

  zip.file(
    'couples_activite_competence.csv',
    construireCsv(
      ['Code métier', 'Ordre', 'Code activité', 'Intitulé activité', 'Intitulé compétence'],
      donnees.couples.map((c) => [
        c.codeMetier,
        String(c.ordre),
        c.codeActivite,
        c.intituleActivite ?? '',
        c.intituleCompetence ?? '',
      ]),
    ),
  );

  zip.file(
    'domaines_de_connaissance.csv',
    construireCsv(
      [
        'Code métier',
        'Code activité (couple)',
        'Ordre couple',
        'Formacode',
        'Intitulé',
        'Niveau',
        'Durée (h)',
        'NSF',
        'Fondamental',
      ],
      donnees.connaissances.map((c) => [
        c.couple?.codeMetier ?? '',
        c.couple?.codeActivite ?? '',
        c.couple ? String(c.couple.ordre) : '',
        c.codeFormacode,
        c.intitule ?? '',
        c.niveau !== null ? String(c.niveau) : '',
        c.dureeHeures ?? '',
        c.codeNsf ?? '',
        c.estFondamental ? 'Oui' : 'Non',
      ]),
    ),
  );

  zip.file(
    'ressources_transverses.csv',
    construireCsv(
      ['Code métier', 'Ressource', 'Groupe', 'Niveau', 'Non concerné'],
      donnees.transversales.map((t) => [
        t.codeMetier,
        t.competence?.libelle ?? t.codeTransversale,
        t.competence?.groupe ?? '',
        t.niveau !== null ? String(t.niveau) : '',
        t.nonConcerne ? 'Oui' : 'Non',
      ]),
    ),
  );

  zip.file(
    'conditions_exercice.csv',
    construireCsv(
      ['Code métier', 'Condition', 'Valeur'],
      donnees.conditions.map((c) => [
        c.codeMetier,
        c.critere?.libelle ?? c.codeCondition,
        c.valeur === 'significatif' ? 'Significatif' : 'Non significatif',
      ]),
    ),
  );

  zip.file(
    'conditions_acces.csv',
    construireCsv(
      ['Code métier', 'Condition d’accès', 'Valeur'],
      donnees.acces.map((a) => [a.codeMetier, a.critere?.libelle ?? a.codeAcces, a.valeur]),
    ),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  telechargerBlob(blob, 'export-base-fiches-metiers.zip');
}
