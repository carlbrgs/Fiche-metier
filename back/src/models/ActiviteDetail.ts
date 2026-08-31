import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** ACT_DET n_1..9 — tâches détaillées, rattachées au couple et non au code activité. */
export class ActiviteDetail extends Model<
  InferAttributes<ActiviteDetail>,
  InferCreationAttributes<ActiviteDetail>
> {
  declare id: CreationOptional<number>;
  declare metierActiviteId: number;
  declare libelle: string;
  declare ordre: number;
}

ActiviteDetail.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    metierActiviteId: { type: DataTypes.INTEGER, allowNull: false },
    libelle: { type: DataTypes.TEXT, allowNull: false },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'activite_detail',
    timestamps: false,
    indexes: [{ unique: true, fields: ['metier_activite_id', 'ordre'] }],
  },
);
