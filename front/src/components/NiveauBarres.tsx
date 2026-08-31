interface Props {
  /** Niveau atteint, de 1 à `total`. */
  niveau: number;
  total?: number;
}

/**
 * Échelle d'approfondissement en barres croissantes, comme sur la fiche métier Excel.
 *
 * Le niveau est aussi porté par `aria-label` : l'information ne doit pas dépendre
 * uniquement de la couleur ni de la hauteur des barres.
 */
export function NiveauBarres({ niveau, total = 4 }: Props) {
  const barres = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <span
      className="niveau-barres"
      role="img"
      aria-label={`Niveau ${niveau} sur ${total}`}
      title={`Niveau ${niveau} sur ${total}`}
    >
      {barres.map((rang) => (
        <span
          key={rang}
          className={rang <= niveau ? 'niveau-barres__barre actif' : 'niveau-barres__barre'}
          style={{ height: `${(rang / total) * 100}%` }}
        />
      ))}
    </span>
  );
}
