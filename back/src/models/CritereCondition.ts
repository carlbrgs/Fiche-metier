import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** nomencl_COND : COND_1..COND_15 — 'Travail en extérieur', 'Manipulation de produits dangereux'… */
export class CritereCondition extends Model<
  InferAttributes<CritereCondition>,
  InferCreationAttributes<CritereCondition>
> {
  declare codeCondition: string;
  declare libelle: string;
  declare ordre: number;
}

CritereCondition.init(
  {
    codeCondition: { type: DataTypes.STRING(10), primaryKey: true },
    libelle: { type: DataTypes.STRING(255), allowNull: false },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  { sequelize, tableName: 'critere_condition', timestamps: false },
);
