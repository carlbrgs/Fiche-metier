import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * Référentiel ROME (France Travail). Alimenté par les codes cités dans les fiches :
 * 136 codes, dont 27 seulement portent un libellé dans la source.
 */
export class Rome extends Model<InferAttributes<Rome>, InferCreationAttributes<Rome>> {
  declare codeRome: string;
  declare libelle: string | null;
}

Rome.init(
  {
    codeRome: { type: DataTypes.STRING(10), primaryKey: true },
    libelle: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'rome', timestamps: false },
);
