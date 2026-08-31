/**
 * Point d'entrée des modèles : importe toutes les classes et déclare les associations.
 * Les associations sont centralisées ici (et non dans chaque fichier modèle) pour éviter
 * les imports circulaires.
 */
import { sequelize } from '../database/connection';

import { Nsf } from './Nsf';
import { Formacode } from './Formacode';
import { FormacodeNiveau } from './FormacodeNiveau';
import { FamilleMetier } from './FamilleMetier';
import { FamilleActivite } from './FamilleActivite';
import { CritereCondition } from './CritereCondition';
import { CompetenceTransversale } from './CompetenceTransversale';
import { CritereAcces } from './CritereAcces';
import { DossierSource } from './DossierSource';
import { MotCle } from './MotCle';
import { Rome } from './Rome';

import { Metier } from './Metier';
import { MetierAppellation } from './MetierAppellation';
import { MetierRome } from './MetierRome';
import { MetierCondition } from './MetierCondition';
import { MetierTransversale } from './MetierTransversale';
import { MetierAcces } from './MetierAcces';
import { MetierActivite } from './MetierActivite';

import { Activite } from './Activite';
import { ActiviteDetail } from './ActiviteDetail';
import { CompetenceDetail } from './CompetenceDetail';
import { ActiviteMotCle } from './ActiviteMotCle';
import { NiveauMaitrise } from './NiveauMaitrise';
import { ActiviteConnaissance } from './ActiviteConnaissance';

import { MetierProximite } from './MetierProximite';
import { MetierConnaissanceEcart } from './MetierConnaissanceEcart';
import { ImportBatch } from './ImportBatch';

// ---------- Référentiels ----------

Nsf.hasMany(Formacode, { foreignKey: 'codeNsf', as: 'formacodes' });
Formacode.belongsTo(Nsf, { foreignKey: 'codeNsf', as: 'nsf' });

Formacode.hasMany(FormacodeNiveau, {
  foreignKey: 'codeFormacode',
  as: 'niveaux',
  onDelete: 'CASCADE',
});
FormacodeNiveau.belongsTo(Formacode, { foreignKey: 'codeFormacode', as: 'formacode' });

// ---------- Métier ----------

FamilleMetier.hasMany(Metier, { foreignKey: 'codeFamille', as: 'metiers' });
Metier.belongsTo(FamilleMetier, { foreignKey: 'codeFamille', as: 'famille' });

DossierSource.hasMany(Metier, { foreignKey: 'dossierSourceId', as: 'metiers' });
Metier.belongsTo(DossierSource, { foreignKey: 'dossierSourceId', as: 'dossierSource' });

Metier.hasMany(MetierAppellation, {
  foreignKey: 'codeMetier',
  as: 'appellations',
  onDelete: 'CASCADE',
});
MetierAppellation.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });

Metier.hasMany(MetierRome, { foreignKey: 'codeMetier', as: 'codesRome', onDelete: 'CASCADE' });
MetierRome.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierRome.belongsTo(Rome, { foreignKey: 'codeRome', as: 'rome' });
Rome.hasMany(MetierRome, { foreignKey: 'codeRome', as: 'metiers' });

Metier.hasMany(MetierCondition, { foreignKey: 'codeMetier', as: 'conditions', onDelete: 'CASCADE' });
MetierCondition.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierCondition.belongsTo(CritereCondition, { foreignKey: 'codeCondition', as: 'critere' });
CritereCondition.hasMany(MetierCondition, { foreignKey: 'codeCondition', as: 'metiers' });

Metier.hasMany(MetierTransversale, {
  foreignKey: 'codeMetier',
  as: 'transversales',
  onDelete: 'CASCADE',
});
MetierTransversale.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierTransversale.belongsTo(CompetenceTransversale, {
  foreignKey: 'codeTransversale',
  as: 'competence',
});
CompetenceTransversale.hasMany(MetierTransversale, {
  foreignKey: 'codeTransversale',
  as: 'metiers',
});

Metier.hasMany(MetierAcces, { foreignKey: 'codeMetier', as: 'acces', onDelete: 'CASCADE' });
MetierAcces.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierAcces.belongsTo(CritereAcces, { foreignKey: 'codeAcces', as: 'critere' });
CritereAcces.hasMany(MetierAcces, { foreignKey: 'codeAcces', as: 'metiers' });

// ---------- Activité ----------

FamilleActivite.hasMany(Activite, { foreignKey: 'codeFamilleActivite', as: 'activites' });
Activite.belongsTo(FamilleActivite, { foreignKey: 'codeFamilleActivite', as: 'famille' });

DossierSource.hasMany(Activite, { foreignKey: 'dossierSourceId', as: 'activites' });
Activite.belongsTo(DossierSource, { foreignKey: 'dossierSourceId', as: 'dossierSource' });

// Détails, mots-clés et niveaux de maîtrise pendent du COUPLE, pas du code activité :
// leur rédaction dépend du métier qui emploie l'activité (migration 006).
MetierActivite.hasMany(ActiviteDetail, {
  foreignKey: 'metierActiviteId',
  as: 'detailsActivite',
  onDelete: 'CASCADE',
});
ActiviteDetail.belongsTo(MetierActivite, { foreignKey: 'metierActiviteId', as: 'couple' });

MetierActivite.hasMany(CompetenceDetail, {
  foreignKey: 'metierActiviteId',
  as: 'detailsCompetence',
  onDelete: 'CASCADE',
});
CompetenceDetail.belongsTo(MetierActivite, { foreignKey: 'metierActiviteId', as: 'couple' });

MetierActivite.hasMany(NiveauMaitrise, {
  foreignKey: 'metierActiviteId',
  as: 'niveauxMaitrise',
  onDelete: 'CASCADE',
});
NiveauMaitrise.belongsTo(MetierActivite, { foreignKey: 'metierActiviteId', as: 'couple' });

// Les domaines de connaissance pendent du couple (migration 008) : un même formacode
// revient sur plusieurs couples d'un même métier, avec un niveau propre à chacun.
MetierActivite.hasMany(ActiviteConnaissance, {
  foreignKey: 'metierActiviteId',
  as: 'connaissances',
  onDelete: 'CASCADE',
});
ActiviteConnaissance.belongsTo(MetierActivite, { foreignKey: 'metierActiviteId', as: 'couple' });
ActiviteConnaissance.belongsTo(Formacode, { foreignKey: 'codeFormacode', as: 'formacode' });
Formacode.hasMany(ActiviteConnaissance, { foreignKey: 'codeFormacode', as: 'couples' });
ActiviteConnaissance.belongsTo(Nsf, { foreignKey: 'codeNsf', as: 'nsf' });

// Mots-clés : n-n via table de jonction porteuse d'un ordre, rattachée au couple.
MetierActivite.belongsToMany(MotCle, {
  through: ActiviteMotCle,
  foreignKey: 'metierActiviteId',
  otherKey: 'motCleId',
  as: 'motsCles',
});
MotCle.belongsToMany(MetierActivite, {
  through: ActiviteMotCle,
  foreignKey: 'motCleId',
  otherKey: 'metierActiviteId',
  as: 'couples',
});

// Métier ↔ Activité : n-n, mais on garde aussi l'accès direct à la table de liaison
// pour lire/écrire `ordre` sans passer par les attributs `through`.
Metier.belongsToMany(Activite, {
  through: MetierActivite,
  foreignKey: 'codeMetier',
  otherKey: 'codeActivite',
  as: 'activites',
});
Activite.belongsToMany(Metier, {
  through: MetierActivite,
  foreignKey: 'codeActivite',
  otherKey: 'codeMetier',
  as: 'metiers',
});
Metier.hasMany(MetierActivite, { foreignKey: 'codeMetier', as: 'liensActivites' });
MetierActivite.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierActivite.belongsTo(Activite, { foreignKey: 'codeActivite', as: 'activite' });

// ---------- Tables calculées ----------

Metier.hasMany(MetierProximite, {
  foreignKey: 'codeMetierSource',
  as: 'proximites',
  onDelete: 'CASCADE',
});
MetierProximite.belongsTo(Metier, { foreignKey: 'codeMetierSource', as: 'metierSource' });
MetierProximite.belongsTo(Metier, { foreignKey: 'codeMetierCible', as: 'metierCible' });

Metier.hasMany(MetierConnaissanceEcart, {
  foreignKey: 'codeMetier',
  as: 'ecartsConnaissance',
  onDelete: 'CASCADE',
});
MetierConnaissanceEcart.belongsTo(Metier, { foreignKey: 'codeMetier', as: 'metier' });
MetierConnaissanceEcart.belongsTo(Formacode, { foreignKey: 'codeFormacode', as: 'formacode' });

export {
  sequelize,
  Nsf,
  Formacode,
  FormacodeNiveau,
  FamilleMetier,
  FamilleActivite,
  CritereCondition,
  CompetenceTransversale,
  CritereAcces,
  DossierSource,
  MotCle,
  Rome,
  Metier,
  MetierAppellation,
  MetierRome,
  MetierCondition,
  MetierTransversale,
  MetierAcces,
  MetierActivite,
  Activite,
  ActiviteDetail,
  CompetenceDetail,
  ActiviteMotCle,
  NiveauMaitrise,
  ActiviteConnaissance,
  MetierProximite,
  MetierConnaissanceEcart,
  ImportBatch,
};
