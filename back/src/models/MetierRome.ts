import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** ROME_1..3 — rattachement au référentiel ROME de France Travail ('A1413', 'H3303'). */
export class MetierRome extends Model<
  InferAttributes<MetierRome>,
  InferCreationAttributes<MetierRome>
> {
  declare id: CreationOptional<number>;
  declare codeMetier: string;
  declare codeRome: string;
  declare ordre: number;
}

MetierRome.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codeMetier: { type: DataTypes.STRING(10), allowNull: false },
    codeRome: { type: DataTypes.STRING(10), allowNull: false },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'metier_rome',
    timestamps: false,
    indexes: [{ unique: true, fields: ['code_metier', 'code_rome'] }, { fields: ['code_rome'] }],
  },
);
