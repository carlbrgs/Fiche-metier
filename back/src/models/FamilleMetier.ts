import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** nomencl_FAMMETIERS : 'A Conception, études, R&D et Innovation', 'B Marketing'… */
export class FamilleMetier extends Model<
  InferAttributes<FamilleMetier>,
  InferCreationAttributes<FamilleMetier>
> {
  declare codeFamille: string;
  declare intitule: string;
  declare definition: string | null;
}

FamilleMetier.init(
  {
    codeFamille: { type: DataTypes.STRING(5), primaryKey: true },
    intitule: { type: DataTypes.STRING(255), allowNull: false },
    definition: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'famille_metier', timestamps: false },
);
