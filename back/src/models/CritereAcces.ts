import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** nomencl_ACCES : ACCES_1..ACCES_7 — conditions d'accès au métier. */
export class CritereAcces extends Model<
  InferAttributes<CritereAcces>,
  InferCreationAttributes<CritereAcces>
> {
  declare codeAcces: string;
  declare libelle: string;
  /** Bloc d'affichage : « Certification professionnelle » ou « Expérience professionnelle ». */
  declare groupe: string | null;
  declare ordre: number;
}

CritereAcces.init(
  {
    codeAcces: { type: DataTypes.STRING(10), primaryKey: true },
    libelle: { type: DataTypes.STRING(255), allowNull: false },
    groupe: { type: DataTypes.STRING(120), allowNull: true },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  { sequelize, tableName: 'critere_acces', timestamps: false },
);
