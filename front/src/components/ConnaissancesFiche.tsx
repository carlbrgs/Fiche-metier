import { Link } from 'react-router-dom';
import type { ConnaissanceMetier } from '@/types/api';

/**
 * Domaines de connaissance structurants du métier.
 *
 * La liste est dédoublonnée côté API : un même formacode peut être cité par plusieurs
 * couples activité-compétence, la fiche n'en montre qu'une ligne, au niveau le plus élevé.
 */
export function ConnaissancesFiche({ domaines }: { domaines: ConnaissanceMetier[] }) {
  if (domaines.length === 0) {
    return <p className="vide">Aucun domaine de connaissance renseigné.</p>;
  }

  return (
    <table className="tableau tableau--connaissances">
      <thead>
        <tr>
          <th scope="col">Domaine de connaissances</th>
          <th scope="col" className="colonne-etroite">
            Niveau approfond.
          </th>
          <th scope="col" className="colonne-etroite">
            Formacode
          </th>
          <th scope="col" className="colonne-etroite">
            NSF
          </th>
        </tr>
      </thead>
      <tbody>
        {domaines.map((d) => (
          <tr key={d.codeFormacode}>
            <th scope="row" className="connaissances__libelle">
              {d.intitule}
            </th>
            <td className="colonne-etroite">{d.niveau ?? '—'}</td>
            <td className="colonne-etroite">
              <Link to={`/formacodes/${encodeURIComponent(d.codeFormacode)}`}>
                {d.codeFormacode}
              </Link>
            </td>
            <td className="colonne-etroite">{d.codeNsf ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
