import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** APPELL_METIER_1..10 — appellations alternatives du métier. */
export class MetierAppellation extends Model<
  InferAttributes<MetierAppellation>,
  InferCreationAttributes<MetierAppellation>
> {
  declare id: CreationOptional<number>;
  declare codeMetier: string;
  declare appellation: string;
  declare ordre: number;
}

MetierAppellation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codeMetier: { type: DataTypes.STRING(10), allowNull: false },
    appellation: { type: DataTypes.STRING(255), allowNull: false },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'metier_appellation',
    timestamps: false,
    indexes: [{ unique: true, fields: ['code_metier', 'ordre'] }, { fields: ['appellation'] }],
  },
);
