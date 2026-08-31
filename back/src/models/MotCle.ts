import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** Mots-clés d'activité (MOT_CLE_ACT_1..3), dédupliqués pour permettre la recherche à facettes. */
export class MotCle extends Model<InferAttributes<MotCle>, InferCreationAttributes<MotCle>> {
  declare id: CreationOptional<number>;
  declare libelle: string;
}

MotCle.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    libelle: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'mot_cle', timestamps: false },
);
