import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** Nomenclature des Spécialités de Formation. */
export class Nsf extends Model<InferAttributes<Nsf>, InferCreationAttributes<Nsf>> {
  declare codeNsf: string;
  declare libelle: string | null;
}

Nsf.init(
  {
    codeNsf: { type: DataTypes.STRING(10), primaryKey: true },
    libelle: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'nsf', timestamps: false },
);
