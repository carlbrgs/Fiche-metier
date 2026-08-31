import { DataTypes, Model, InferAttributes, InferCreationAttributes } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * TABLE CALCULÉE — ne pas saisir à la main.
 * Matérialise Degre_Elargissement et Table_durée_différence_métier : 333² ≈ 110 000 lignes,
 * négligeable pour MariaDB et bien plus rapide qu'un calcul à la volée.
 * Recalculée par `services/passerelle.service.ts`.
 *
 * La relation n'est pas symétrique : passer de A à B ne coûte pas la même chose que de B à A.
 */
export class MetierProximite extends Model<
  InferAttributes<MetierProximite>,
  InferCreationAttributes<MetierProximite>
> {
  declare codeMetierSource: string;
  declare codeMetierCible: string;
  /** 0 = métiers identiques, 1 = totalement éloignés. */
  declare degreElargissement: number | null;
  /** Heures de formation pour combler l'écart de connaissances. */
  declare dureeAcquisitionHeures: number | null;
  declare nbDcCommuns: number | null;
  declare calculeLe: Date | null;
}

MetierProximite.init(
  {
    codeMetierSource: { type: DataTypes.STRING(10), primaryKey: true },
    codeMetierCible: { type: DataTypes.STRING(10), primaryKey: true },
    degreElargissement: { type: DataTypes.DECIMAL(6, 4), allowNull: true },
    dureeAcquisitionHeures: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    nbDcCommuns: { type: DataTypes.SMALLINT, allowNull: true },
    calculeLe: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'metier_proximite',
    timestamps: false,
    // Sert le tri de l'écran « métiers les plus proches » sans filesort.
    indexes: [{ fields: ['code_metier_source', 'duree_acquisition_heures'] }],
  },
);
