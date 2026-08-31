interface Option {
  valeur: string;
  libelle: string;
}

interface Props {
  label: string;
  valeur: string;
  options: Option[];
  onChange: (valeur: string) => void;
  optionVide?: string;
}

export function FiltreSelect({ label, valeur, options, onChange, optionVide = 'Tous' }: Props) {
  return (
    <label className="filtre">
      <span className="filtre__label">{label}</span>
      <select
        className="filtre__select"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{optionVide}</option>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
    </label>
  );
}
