import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

export type ResponsTransverse = 'oui' | 'non';

/**
 * Source : feuille `Outil_collecte_fiche_metier` (439 colonnes, un métier complet par ligne),
 * et NON `data_METIERS`, qui n'en est qu'une projection appauvrie — voir docs/SCHEMA.md §1.
 * Les colonnes répétées du formulaire sont éclatées en tables de liaison.
 */
export class Metier extends Model<InferAttributes<Metier>, InferCreationAttributes<Metier>> {
  declare codeMetier: string;
  declare nObs: number | null;
  declare intitule: string;
  declare definition: string | null;
  declare codeFamille: string | null;
  declare dossierSourceId: number | null;
  declare dossierAutre: string | null;
  declare responsTransverse: ResponsTransverse | null;
  declare interfaceAmontAval: string | null;
  declare redacteur: string | null;
  declare nbCouple: number | null;
  declare remarque: string | null;

  // Traçabilité de la collecte. NULL pour les 34 fiches qui ne sont pas passées par l'outil.
  declare cleCollecte: string | null;
  declare dateSaisie: Date | null;
  declare dateEnregistrement: Date | null;
  declare dateModification: Date | null;
  /** En secondes. */
  declare tempsSaisie: number | null;
  declare origineSaisie: string | null;
  declare langueSaisie: string | null;
  declare appareilSaisie: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Metier.init(
  {
    codeMetier: { type: DataTypes.STRING(10), primaryKey: true },
    nObs: { type: DataTypes.INTEGER, allowNull: true },
    intitule: { type: DataTypes.STRING(255), allowNull: false },
    definition: { type: DataTypes.TEXT, allowNull: true },
    // Déductible du préfixe de codeMetier ('D19' -> 'D'), mais stocké : une jointure
    // sur LEFT(code, 1) ne serait pas indexable et la règle peut évoluer.
    codeFamille: { type: DataTypes.STRING(5), allowNull: true },
    dossierSourceId: { type: DataTypes.INTEGER, allowNull: true },
    dossierAutre: { type: DataTypes.STRING(255), allowNull: true },
    responsTransverse: { type: DataTypes.ENUM('oui', 'non'), allowNull: true },
    interfaceAmontAval: { type: DataTypes.STRING(255), allowNull: true },
    redacteur: { type: DataTypes.STRING(100), allowNull: true },
    nbCouple: { type: DataTypes.TINYINT, allowNull: true },
    remarque: { type: DataTypes.TEXT, allowNull: true },
    cleCollecte: { type: DataTypes.STRING(20), allowNull: true },
    dateSaisie: { type: DataTypes.DATE, allowNull: true },
    dateEnregistrement: { type: DataTypes.DATE, allowNull: true },
    dateModification: { type: DataTypes.DATE, allowNull: true },
    tempsSaisie: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    origineSaisie: { type: DataTypes.STRING(50), allowNull: true },
    langueSaisie: { type: DataTypes.STRING(10), allowNull: true },
    appareilSaisie: { type: DataTypes.STRING(50), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'metier', timestamps: true },
);
