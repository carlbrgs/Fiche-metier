import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

export type ValeurCondition = 'significatif' | 'non_significatif';

/** COND_1..COND_15 : caractère significatif de chaque condition d'exercice pour le métier. */
export class MetierCondition extends Model<
  InferAttributes<MetierCondition>,
  InferCreationAttributes<MetierCondition>
> {
  declare codeMetier: string;
  declare codeCondition: string;
  declare valeur: ValeurCondition;
}

MetierCondition.init(
  {
    codeMetier: { type: DataTypes.STRING(10), primaryKey: true },
    codeCondition: { type: DataTypes.STRING(10), primaryKey: true },
    valeur: { type: DataTypes.ENUM('significatif', 'non_significatif'), allowNull: false },
  },
  {
    sequelize,
    tableName: 'metier_condition',
    timestamps: false,
    // Sert « quels métiers travaillent en extérieur ? » sans scan de table.
    indexes: [{ fields: ['code_condition', 'valeur'] }],
  },
);
