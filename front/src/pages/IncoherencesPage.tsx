import { Link } from 'react-router-dom';
import { listerIncoherences } from '@/api/activites';
import { useFetch } from '@/hooks/useFetch';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';

/**
 * Codes activité dont les rédactions divergent d'un métier à l'autre — intitulés, détails,
 * niveaux de maîtrise ou domaines de connaissance, hors mots-clés (délibérément ignorés,
 * voir back/src/services/incoherence.service.ts).
 */
export function IncoherencesPage() {
  const incoherences = useFetch((signal) => listerIncoherences(signal), []);

  return (
    <div className="page">
      <h1>Incohérences entre rédactions</h1>
      <p className="fiche__famille">
        Un même code activité devrait porter le même contenu sur tous les métiers qui
        l’emploient. Voici les codes où ce n’est pas le cas — cliquer sur un code pour
        comparer les rédactions et en appliquer une à tous les métiers concernés.
      </p>

      {incoherences.erreur && <ErrorMessage message={incoherences.erreur} />}
      {incoherences.chargement && <Loader />}

      {incoherences.donnees &&
        (incoherences.donnees.data.length === 0 ? (
          <p className="vide">Aucune incohérence détectée.</p>
        ) : (
          <table className="tableau">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Activité</th>
                <th scope="col" className="colonne-etroite">
                  Rédactions distinctes
                </th>
                <th scope="col" className="colonne-etroite">
                  Métiers concernés
                </th>
              </tr>
            </thead>
            <tbody>
              {incoherences.donnees.data.map((c) => (
                <tr key={c.codeActivite}>
                  <th scope="row">
                    <Link to={`/activites/incoherences/${encodeURIComponent(c.codeActivite)}`}>
                      {c.codeActivite}
                    </Link>
                  </th>
                  <td>{c.intituleActivite}</td>
                  <td className="colonne-etroite">{c.nbVariantes}</td>
                  <td className="colonne-etroite">{c.nbMetiers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
}
