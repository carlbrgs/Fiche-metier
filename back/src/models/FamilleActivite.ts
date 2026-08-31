import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/** nomencl_FAMACTIVITES : 'A.01 Etude et recherche', 'B.02 Optimisation'… */
export class FamilleActivite extends Model<
  InferAttributes<FamilleActivite>,
  InferCreationAttributes<FamilleActivite>
> {
  declare codeFamilleActivite: string;
  declare domaine1: string | null;
  declare domaine2: string | null;
  declare domaine3: string | null;
  declare exempleCompetence: string | null;
}

FamilleActivite.init(
  {
    codeFamilleActivite: { type: DataTypes.STRING(10), primaryKey: true },
    // `field` explicite : la conversion `underscored` de Sequelize n'insère pas de
    // séparateur devant un chiffre (`domaine1` resterait `domaine1`), alors que le
    // schéma SQL déclare `domaine_1`.
    domaine1: { type: DataTypes.STRING(255), allowNull: true, field: 'domaine_1' },
    domaine2: { type: DataTypes.STRING(255), allowNull: true, field: 'domaine_2' },
    domaine3: { type: DataTypes.TEXT, allowNull: true, field: 'domaine_3' },
    exempleCompetence: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'famille_activite', timestamps: false },
);
