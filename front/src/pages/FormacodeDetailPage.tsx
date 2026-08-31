import { Link, useParams } from 'react-router-dom';
import { obtenirFormacode } from '@/api/activites';
import { useFetch } from '@/hooks/useFetch';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';

const LIBELLE_ORIGINE: Record<string, string> = {
  base_formacodes: 'Base formacodes DC structurants',
  base_competences: 'Base compétences V3.3',
};

export function FormacodeDetailPage() {
  const { code = '' } = useParams();
  const { donnees, chargement, erreur } = useFetch(
    (signal) => obtenirFormacode(code, signal),
    [code],
  );

  if (chargement) return <Loader />;
  if (erreur) return <ErrorMessage message={erreur} />;
  if (!donnees) return null;

  const f = donnees;
  const niveaux = f.niveaux ?? [];

  return (
    <article className="page fiche">
      <header className="fiche__entete">
        <span className="carte__code">{f.codeFormacode}</span>
        <h1>{f.intitule}</h1>
        {f.nsf && (
          <p className="fiche__famille">
            NSF {f.nsf.codeNsf}
            {f.nsf.libelle ? ` — ${f.nsf.libelle}` : ''}
          </p>
        )}
      </header>

      <section className="fiche__section">
        <h2>Durées d’acquisition par niveau</h2>
        {niveaux.length === 0 ? (
          <p className="vide">Aucune durée renseignée.</p>
        ) : (
          <table className="tableau">
            <thead>
              <tr>
                <th>Niveau</th>
                <th>Heures</th>
                <th>Semaines</th>
                <th>Mois</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {niveaux.map((n) => (
                <tr key={n.id}>
                  <td>
                    {n.niveau}
                    {n.estNiveauUnique && <span className="detail"> (unique)</span>}
                  </td>
                  <td>{n.dureeHeures ?? '—'}</td>
                  <td>{n.dureeSemaines ?? '—'}</td>
                  <td>{n.dureeMois ?? '—'}</td>
                  <td className="detail">{LIBELLE_ORIGINE[n.origine] ?? n.origine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {niveaux.some((n) => n.methodeCalcul || n.source) && (
        <section className="fiche__section">
          <h2>Méthodes de calcul</h2>
          <dl className="definitions">
            {niveaux
              .filter((n) => n.methodeCalcul || n.source)
              .map((n) => (
                <div key={n.id}>
                  <dt>Niveau {n.niveau}</dt>
                  <dd>
                    {n.methodeCalcul && <p>{n.methodeCalcul}</p>}
                    {n.source && <p className="detail">Source : {n.source}</p>}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      )}

      <Link to="/formacodes" className="lien-retour">
        ← Retour aux domaines de connaissance
      </Link>
    </article>
  );
}
