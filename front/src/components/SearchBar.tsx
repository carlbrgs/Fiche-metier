import { useEffect, useState } from 'react';

interface Props {
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  /** Délai avant remontée de la saisie, en ms. */
  delai?: number;
}

/**
 * Champ de recherche débouncé : sans ça, chaque frappe déclenche une requête
 * sur des tables de plusieurs milliers de lignes.
 */
export function SearchBar({ valeur, onChange, placeholder = 'Rechercher…', delai = 300 }: Props) {
  const [saisie, setSaisie] = useState(valeur);

  // Resynchronise si le parent réinitialise le filtre (ex. bouton « effacer »).
  useEffect(() => setSaisie(valeur), [valeur]);

  useEffect(() => {
    if (saisie === valeur) return;
    const timer = setTimeout(() => onChange(saisie), delai);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisie, delai]);

  return (
    <div className="recherche">
      <input
        type="search"
        className="recherche__champ"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
