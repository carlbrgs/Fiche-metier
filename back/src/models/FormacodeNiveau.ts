import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

export type OrigineFormacode = 'base_formacodes' | 'base_competences';

/**
 * Durée d'acquisition d'un formacode à un niveau d'approfondissement donné.
 * `origine` distingue les deux classeurs sources, qui peuvent diverger sur la durée.
 */
export class FormacodeNiveau extends Model<
  InferAttributes<FormacodeNiveau>,
  InferCreationAttributes<FormacodeNiveau>
> {
  declare id: CreationOptional<number>;
  declare codeFormacode: string;
  declare niveau: number;
  declare estNiveauUnique: CreationOptional<boolean>;
  declare dureeHeures: number | null;
  declare dureeSemaines: number | null;
  declare dureeMois: number | null;
  declare methodeCalcul: string | null;
  declare source: string | null;
  declare origine: OrigineFormacode;
}

FormacodeNiveau.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codeFormacode: { type: DataTypes.STRING(10), allowNull: false },
    niveau: { type: DataTypes.TINYINT, allowNull: false },
    estNiveauUnique: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dureeHeures: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    dureeSemaines: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    dureeMois: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    methodeCalcul: { type: DataTypes.TEXT, allowNull: true },
    source: { type: DataTypes.TEXT, allowNull: true },
    origine: {
      type: DataTypes.ENUM('base_formacodes', 'base_competences'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'formacode_niveau',
    timestamps: false,
    indexes: [{ unique: true, fields: ['code_formacode', 'niveau', 'origine'] }],
  },
);
