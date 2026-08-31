import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** MOT_CLE_ACT n_1..3 — jonction couple ↔ mot-clé. */
export class ActiviteMotCle extends Model<
  InferAttributes<ActiviteMotCle>,
  InferCreationAttributes<ActiviteMotCle>
> {
  declare metierActiviteId: number;
  declare motCleId: number;
  declare ordre: number;
}

ActiviteMotCle.init(
  {
    metierActiviteId: { type: DataTypes.INTEGER, primaryKey: true },
    motCleId: { type: DataTypes.INTEGER, primaryKey: true },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'activite_mot_cle',
    timestamps: false,
    indexes: [{ fields: ['mot_cle_id'] }],
  },
);
