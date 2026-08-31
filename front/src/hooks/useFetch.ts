import { useEffect, useState } from 'react';

interface EtatFetch<T> {
  donnees: T | null;
  chargement: boolean;
  erreur: string | null;
}

/**
 * Appel d'API déclaratif avec annulation.
 * L'AbortController évite qu'une réponse lente d'une recherche précédente n'écrase
 * le résultat de la recherche courante.
 *
 * `deps` pilote le re-déclenchement : y mettre les valeurs des filtres, pas la fonction.
 */
export function useFetch<T>(
  requete: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): EtatFetch<T> {
  const [etat, setEtat] = useState<EtatFetch<T>>({
    donnees: null,
    chargement: true,
    erreur: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setEtat((precedent) => ({ ...precedent, chargement: true, erreur: null }));

    requete(controller.signal)
      .then((donnees) => setEtat({ donnees, chargement: false, erreur: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setEtat({
          donnees: null,
          chargement: false,
          erreur: err instanceof Error ? err.message : 'Erreur inconnue',
        });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return etat;
}
