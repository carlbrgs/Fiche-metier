import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

export type StatutImport = 'en_cours' | 'termine' | 'echec';

/**
 * Journal des imports Excel. Indispensable ici : les classeurs sont versionnés
 * (`251230_..._V3.3`) et rechargés régulièrement. Sans ce journal, un import partiel
 * laisse la base dans un état incompréhensible.
 */
export class ImportBatch extends Model<
  InferAttributes<ImportBatch>,
  InferCreationAttributes<ImportBatch>
> {
  declare id: CreationOptional<number>;
  declare fichier: string;
  declare feuille: string | null;
  declare version: string | null;
  declare lignesLues: CreationOptional<number>;
  declare lignesOk: CreationOptional<number>;
  declare lignesErreur: CreationOptional<number>;
  /** Détail des lignes rejetées : [{ ligne, colonne, motif }]. */
  declare rapport: unknown | null;
  declare statut: CreationOptional<StatutImport>;
  declare demarreLe: CreationOptional<Date>;
  declare termineLe: Date | null;
}

ImportBatch.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fichier: { type: DataTypes.STRING(255), allowNull: false },
    feuille: { type: DataTypes.STRING(100), allowNull: true },
    version: { type: DataTypes.STRING(50), allowNull: true },
    lignesLues: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lignesOk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lignesErreur: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rapport: { type: DataTypes.JSON, allowNull: true },
    statut: {
      type: DataTypes.ENUM('en_cours', 'termine', 'echec'),
      allowNull: false,
      defaultValue: 'en_cours',
    },
    demarreLe: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    termineLe: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'import_batch', timestamps: false },
);
