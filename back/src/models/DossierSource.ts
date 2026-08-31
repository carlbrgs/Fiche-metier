import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/** Cartographie d'origine : 'OCAPIAT_cartographie metiers production alimentaire', 'FNAM_…aerien'… */
export class DossierSource extends Model<
  InferAttributes<DossierSource>,
  InferCreationAttributes<DossierSource>
> {
  declare id: CreationOptional<number>;
  declare libelle: string;
  declare opco: string | null;
  declare annee: number | null;
}

DossierSource.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    libelle: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    opco: { type: DataTypes.STRING(50), allowNull: true },
    annee: { type: DataTypes.SMALLINT, allowNull: true },
  },
  { sequelize, tableName: 'dossier_source', timestamps: false },
);
