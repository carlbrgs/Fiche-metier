import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * data_ACT_COMP_CONN — 1 360 « couples activité-compétence ».
 * Les codes activité sont tous uniques dans les données actuelles : une activité porte donc
 * exactement une compétence, et les deux intitulés cohabitent sur la même ligne.
 * Si une activité devait porter plusieurs compétences, extraire `intituleCompetence` +
 * `CompetenceDetail` vers une table `competence` (voir docs/SCHEMA.md §4).
 */
export class Activite extends Model<InferAttributes<Activite>, InferCreationAttributes<Activite>> {
  declare codeActivite: string;
  declare codeFamilleActivite: string | null;
  declare intituleActivite: string;
  declare intituleCompetence: string | null;
  declare dossierSourceId: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Activite.init(
  {
    codeActivite: { type: DataTypes.STRING(20), primaryKey: true },
    codeFamilleActivite: { type: DataTypes.STRING(10), allowNull: true },
    intituleActivite: { type: DataTypes.TEXT, allowNull: false },
    intituleCompetence: { type: DataTypes.TEXT, allowNull: true },
    dossierSourceId: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'activite', timestamps: true },
);
