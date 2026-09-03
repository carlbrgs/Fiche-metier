/** Miroir de back/src/types/api.ts et des modèles Sequelize. */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface FamilleMetier {
  codeFamille: string;
  intitule: string;
  definition: string | null;
}

export interface DossierSource {
  id: number;
  libelle: string;
  opco: string | null;
  annee: number | null;
}

export interface Appellation {
  id: number;
  appellation: string;
  ordre: number;
}

export interface CritereCondition {
  codeCondition: string;
  libelle: string;
  ordre: number;
}

export interface CritereAcces {
  codeAcces: string;
  libelle: string;
  /** « Certification professionnelle » ou « Expérience professionnelle ». */
  groupe: string | null;
  ordre: number;
}

export interface MetierCondition {
  codeCondition: string;
  valeur: 'significatif' | 'non_significatif';
  critere?: CritereCondition;
}

export interface MetierAcces {
  codeAcces: string;
  valeur: string;
  critere?: CritereAcces;
}

export interface CompetenceTransversale {
  codeTransversale: string;
  libelle: string;
  /** Famille de ressources : « Ressources cognitives », « Ressources personnelles »… */
  groupe: string | null;
  palier1: string | null;
  palier2: string | null;
  palier3: string | null;
  palier4: string | null;
  ordre: number;
}

export interface MetierTransversale {
  codeTransversale: string;
  niveau: number | null;
  nonConcerne: boolean;
  competence?: CompetenceTransversale;
}

export interface Metier {
  codeMetier: string;
  intitule: string;
  definition: string | null;
  codeFamille: string | null;
  responsTransverse: 'oui' | 'non' | null;
  interfaceAmontAval: string | null;
  nbCouple: number | null;
  remarque: string | null;
  /** Renseigné pour la fiche source, absent pour les 34 métiers hors outil de collecte. */
  redacteur: string | null;
  dossierAutre: string | null;
  famille?: FamilleMetier | null;
  dossierSource?: DossierSource | null;
  appellations?: Appellation[];
  codesRome?: Array<{ id: number; codeRome: string; ordre: number }>;
  conditions?: MetierCondition[];
  transversales?: MetierTransversale[];
  acces?: MetierAcces[];
}

export interface Formacode {
  codeFormacode: string;
  intitule: string;
  codeNsf: string | null;
  estFondamental: boolean;
  nsf?: { codeNsf: string; libelle: string | null } | null;
  niveaux?: FormacodeNiveau[];
}

export interface FormacodeNiveau {
  id: number;
  niveau: number;
  estNiveauUnique: boolean;
  dureeHeures: string | null;
  dureeSemaines: string | null;
  dureeMois: string | null;
  methodeCalcul: string | null;
  source: string | null;
  origine: 'base_formacodes' | 'base_competences';
}

export interface ActiviteConnaissance {
  id: number;
  codeFormacode: string;
  intitule: string | null;
  niveau: number;
  dureeHeures: string | null;
  justificationDuree: string | null;
  estFondamental: boolean;
  ordre: number;
  formacode?: Formacode;
}

export interface Detail {
  id: number;
  libelle: string;
  ordre: number;
}

/**
 * Couple activité-compétence tel qu'il figure sur la fiche métier.
 * Les intitulés sont portés par le couple et non par le code activité : 121 codes sont
 * rédigés différemment selon le métier qui les emploie.
 */
export interface Couple {
  id: number;
  codeMetier: string;
  codeActivite: string;
  ordre: number;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite?: Detail[];
  detailsCompetence?: Detail[];
  niveauxMaitrise?: Array<{ id: number; niveau: number; description: string }>;
  motsCles?: Array<{ id: number; libelle: string }>;
  connaissances?: ActiviteConnaissance[];
  /** Présent quand le couple est vu depuis l'activité et non depuis le métier. */
  metier?: { codeMetier: string; intitule: string; codeFamille: string | null };
}

/**
 * Entrée de catalogue. Les intitulés y sont indicatifs : la rédaction qui fait foi est
 * celle de chaque couple, dans `couples`.
 */
export interface Activite {
  codeActivite: string;
  codeFamilleActivite: string | null;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  famille?: { codeFamilleActivite: string; domaine1: string | null } | null;
  connaissances?: ActiviteConnaissance[];
  couples?: Couple[];
}

/** Ligne du tableau « Domaines de connaissances structurant pour l'exercice du métier ». */
export interface ConnaissanceMetier {
  codeFormacode: string;
  intitule: string;
  niveau: number | null;
  dureeHeures: string | null;
  codeNsf: string | null;
}

// ---------- Édition des couples ----------

/** Une activité du catalogue absente de la fiche, donc ajoutable. */
export interface ActiviteAjoutable {
  codeActivite: string;
  intituleActivite: string;
  intituleCompetence: string | null;
  /** Nombre de fiches qui emploient déjà ce code : autant de rédactions recopiables. */
  nbVariantes: number;
}

/**
 * Une rédaction existante d'un code activité, telle qu'une autre fiche la porte. C'est
 * l'unité recopiée à l'ajout : les formacodes pendent du couple depuis la migration 008.
 */
export interface VarianteCouple {
  coupleId: number;
  codeMetier: string;
  intituleMetier: string;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  formacodes: Array<{ codeFormacode: string; intitule: string | null; niveau: number | null }>;
}

/** `perimee` : la fiche a changé depuis le dernier calcul de `metier_proximite`. */
export interface EtatProximites {
  calculeLe: string | null;
  modifieeLe: string | null;
  perimee: boolean;
}

/** Champs minimaux pour un sélecteur de métier (ex. « métier de départ » des passerelles). */
export interface MetierOption {
  codeMetier: string;
  intitule: string;
  codeFamille: string | null;
}

export interface MetierProche {
  codeMetier: string;
  intitule: string;
  codeFamille: string | null;
  dureeAcquisitionHeures: number | null;
  degreElargissement: number | null;
  nbDcCommuns: number | null;
}

export interface RomeReferentiel {
  codeRome: string;
  /** Renseigné pour 27 codes seulement : la source ne documente pas les autres. */
  libelle: string | null;
}

// ---------- Incohérences entre rédactions d'un même couple ----------

/** Un code activité dont les rédactions divergent selon le métier (hors mots-clés). */
export interface CodeIncoherent {
  codeActivite: string;
  intituleActivite: string;
  nbVariantes: number;
  nbMetiers: number;
}

/** Contenu modifiable avant application — domaines de connaissance exclus, voir le back. */
export interface EditionModele {
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite: string[];
  detailsCompetence: string[];
  niveauxMaitrise: Array<{ niveau: number; description: string }>;
}

/** Une rédaction distincte d'un code activité, et les métiers qui la portent. */
export interface VarianteDetaillee {
  coupleModeleId: number;
  metiers: Array<{ codeMetier: string; intitule: string }>;
  intituleActivite: string | null;
  intituleCompetence: string | null;
  detailsActivite: string[];
  detailsCompetence: string[];
  niveauxMaitrise: Array<{ niveau: number; description: string }>;
  connaissances: Array<{ codeFormacode: string; intitule: string | null; niveau: number | null }>;
}

export interface Referentiels {
  famillesMetier: FamilleMetier[];
  famillesActivite: Array<{ codeFamilleActivite: string; domaine1: string | null }>;
  conditions: CritereCondition[];
  transversales: CompetenceTransversale[];
  acces: CritereAcces[];
  dossiersSource: DossierSource[];
  nsf: Array<{ codeNsf: string; libelle: string | null }>;
  rome: RomeReferentiel[];
}
