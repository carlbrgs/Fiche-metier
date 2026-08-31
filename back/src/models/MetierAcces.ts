import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * ACCES_METIER_1..7. `valeur` reste en texte libre : les 7 colonnes sources sont hétérogènes
 * (« Non, une certification est souhaitée », « Domaine viticole », « Niv.4 », commentaire libre).
 * Les typer serait une supposition sur des données non stabilisées — voir docs/SCHEMA.md §8.
 */
export class MetierAcces extends Model<
  InferAttributes<MetierAcces>,
  InferCreationAttributes<MetierAcces>
> {
  declare codeMetier: string;
  declare codeAcces: string;
  declare valeur: string;
}

MetierAcces.init(
  {
    codeMetier: { type: DataTypes.STRING(10), primaryKey: true },
    codeAcces: { type: DataTypes.STRING(10), primaryKey: true },
    valeur: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: 'metier_acces', timestamps: false },
);
