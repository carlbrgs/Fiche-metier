import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * TRANSV_1..TRANSV_17 : niveau attendu sur chaque compétence transversale.
 * La valeur « Non Concerné » du tableur devient `niveau = null` + `nonConcerne = true`,
 * ce qui distingue « non concerné » de « donnée manquante ».
 */
export class MetierTransversale extends Model<
  InferAttributes<MetierTransversale>,
  InferCreationAttributes<MetierTransversale>
> {
  declare codeMetier: string;
  declare codeTransversale: string;
  declare niveau: number | null;
  declare nonConcerne: CreationOptional<boolean>;
}

MetierTransversale.init(
  {
    codeMetier: { type: DataTypes.STRING(10), primaryKey: true },
    codeTransversale: { type: DataTypes.STRING(10), primaryKey: true },
    niveau: { type: DataTypes.TINYINT, allowNull: true },
    nonConcerne: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'metier_transversale',
    timestamps: false,
    indexes: [{ fields: ['code_transversale', 'niveau'] }],
  },
);
