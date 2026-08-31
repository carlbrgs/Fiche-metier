import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** COMP_DET n_1..9 — compétences détaillées, rattachées au couple. */
export class CompetenceDetail extends Model<
  InferAttributes<CompetenceDetail>,
  InferCreationAttributes<CompetenceDetail>
> {
  declare id: CreationOptional<number>;
  declare metierActiviteId: number;
  declare libelle: string;
  declare ordre: number;
}

CompetenceDetail.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    metierActiviteId: { type: DataTypes.INTEGER, allowNull: false },
    libelle: { type: DataTypes.TEXT, allowNull: false },
    ordre: { type: DataTypes.TINYINT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'competence_detail',
    timestamps: false,
    indexes: [{ unique: true, fields: ['metier_activite_id', 'ordre'] }],
  },
);
