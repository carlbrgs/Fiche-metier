interface Props {
  idPrefix: string;
  dcMin: number;
  onDcMinChange: (v: number) => void;
  heuresMax: number;
  onHeuresMaxChange: (v: number) => void;
  degreMin: number;
  onDegreMinChange: (v: number) => void;
  memeFamille: boolean;
  onMemeFamilleChange: (v: boolean) => void;
  labelFamille: string;
}

/**
 * Les trois paramètres de la feuille « Métiers passerelles » (K3:K5 du classeur) plus le
 * filtre « même famille », partagés entre PasserellesPage et la section « Métiers proches »
 * de MetierDetailPage — même réglages, mêmes libellés aux deux endroits.
 */
export function FiltresPasserelles({
  idPrefix,
  dcMin,
  onDcMinChange,
  heuresMax,
  onHeuresMaxChange,
  degreMin,
  onDegreMinChange,
  memeFamille,
  onMemeFamilleChange,
  labelFamille,
}: Props) {
  return (
    <>
      <div className="passerelles-champ">
        <label htmlFor={`${idPrefix}-dc`}>Minimum DC communs</label>
        <input
          id={`${idPrefix}-dc`}
          type="number"
          min={0}
          value={dcMin}
          onChange={(e) => onDcMinChange(Number(e.target.value) || 0)}
        />
      </div>

      <div className="passerelles-champ">
        <label htmlFor={`${idPrefix}-heures`}>Max heures formation</label>
        <input
          id={`${idPrefix}-heures`}
          type="number"
          min={0}
          step={100}
          value={heuresMax}
          onChange={(e) => onHeuresMaxChange(Number(e.target.value) || 0)}
        />
      </div>

      <div className="passerelles-champ">
        <label htmlFor={`${idPrefix}-degre`}>Minimum degré d’élargissement</label>
        <input
          id={`${idPrefix}-degre`}
          type="number"
          step={0.1}
          value={degreMin}
          onChange={(e) => onDegreMinChange(Number(e.target.value))}
        />
      </div>

      <div className="passerelles-champ passerelles-champ--case">
        <label htmlFor={`${idPrefix}-famille`}>
          <input
            id={`${idPrefix}-famille`}
            type="checkbox"
            checked={memeFamille}
            onChange={(e) => onMemeFamilleChange(e.target.checked)}
          />
          {labelFamille}
        </label>
      </div>
    </>
  );
}
