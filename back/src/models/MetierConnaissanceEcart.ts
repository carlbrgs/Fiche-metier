import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * TABLE CALCULÉE — ne pas saisir à la main.
 * Matérialise Table_durée_différence_DC et Table_Niveau_différence_DC : pour chaque métier,
 * le niveau et la durée requis sur chaque domaine de connaissance.
 * Recalculée par `services/passerelle.service.ts`.
 */
export class MetierConnaissanceEcart extends Model<
  InferAttributes<MetierConnaissanceEcart>,
  InferCreationAttributes<MetierConnaissanceEcart>
> {
  declare codeMetier: string;
  declare codeFormacode: string;
  declare niveauRequis: number | null;
  declare dureeHeures: number | null;
}

MetierConnaissanceEcart.init(
  {
    codeMetier: { type: DataTypes.STRING(10), primaryKey: true },
    codeFormacode: { type: DataTypes.STRING(10), primaryKey: true },
    niveauRequis: { type: DataTypes.TINYINT, allowNull: true },
    dureeHeures: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  },
  {
    sequelize,
    tableName: 'metier_connaissance_ecart',
    timestamps: false,
    indexes: [{ fields: ['code_formacode'] }],
  },
);
