import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * nomencl_TRANSV : TRANSV_1..TRANSV_17 — ressources cognitives graduées sur 4 paliers
 * ('Analyse et synthèse de l'information', 'Résolution de problèmes', 'Autonomie'…).
 */
export class CompetenceTransversale extends Model<
  InferAttributes<CompetenceTransversale>,
  InferCreationAttributes<CompetenceTransversale>
> {
  declare codeTransversale: string;
  declare libelle: string;
  /** Famille de ressources (« Ressources cognitives »…), pour l'affichage de la fiche. */
  declare groupe: string | null;
  declare palier1: string | null;
  declare palier2: string | null;
  declare palier3: string | null;
  declare palier4: string | null;
  declare ordre: number;
}

CompetenceTransversale.init(
  {
    codeTransversale: { type: DataTypes.STRING(10), primaryKey: true },
    libelle: { type: DataTypes.STRING(255), allowNull: false },
    groupe: { type: DataTypes.STRING(120), allowNull: true },
    // `field` explicite : `underscored` ne sépare pas les chiffres, cf. FamilleActivite.
    palier1: { type: DataTypes.TEXT, allowNull: true, field: 'palier_1' },
    palier2: { type: DataTypes.TEXT, allowNull: true, field: 'palier_2' },
    palier3: { type: DataTypes.TEXT, allowNull: true, field: 'palier_3' },
    palier4: { type: DataTypes.TEXT, allowNull: true, field: 'palier_4' },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  { sequelize, tableName: 'competence_transversale', timestamps: false },
);
