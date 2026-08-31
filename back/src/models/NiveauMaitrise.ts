import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** NIV_MATR_1..4 — description graduée de la maîtrise attendue sur la compétence. */
export class NiveauMaitrise extends Model<
  InferAttributes<NiveauMaitrise>,
  InferCreationAttributes<NiveauMaitrise>
> {
  declare id: CreationOptional<number>;
  declare metierActiviteId: number;
  declare niveau: number;
  declare description: string;
}

NiveauMaitrise.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    metierActiviteId: { type: DataTypes.INTEGER, allowNull: false },
    niveau: { type: DataTypes.TINYINT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'niveau_maitrise',
    timestamps: false,
    indexes: [{ unique: true, fields: ['metier_activite_id', 'niveau'] }],
  },
);
