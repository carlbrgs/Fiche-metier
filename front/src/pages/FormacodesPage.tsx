import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listerFormacodes, obtenirReferentiels } from '@/api/activites';
import { useFetch } from '@/hooks/useFetch';
import { SearchBar } from '@/components/SearchBar';
import { FiltreSelect } from '@/components/FiltreSelect';
import { Pagination } from '@/components/Pagination';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';

export function FormacodesPage() {
  const [recherche, setRecherche] = useState('');
  const [nsf, setNsf] = useState('');
  const [page, setPage] = useState(1);

  const referentiels = useFetch((signal) => obtenirReferentiels(signal), []);
  const formacodes = useFetch(
    (signal) => listerFormacodes({ search: recherche, nsf, page, limit: 30 }, signal),
    [recherche, nsf, page],
  );

  const changerFiltre = (setter: (v: string) => void) => (valeur: string) => {
    setter(valeur);
    setPage(1);
  };

  return (
    <div className="page">
      <h1>Domaines de connaissance</h1>

      <div className="barre-filtres">
        <SearchBar
          valeur={recherche}
          onChange={changerFiltre(setRecherche)}
          placeholder="Rechercher un formacode…"
        />
        <FiltreSelect
          label="NSF"
          valeur={nsf}
          onChange={changerFiltre(setNsf)}
          options={(referentiels.donnees?.nsf ?? []).map((n) => ({
            valeur: n.codeNsf,
            libelle: n.libelle ? `${n.codeNsf} — ${n.libelle}` : n.codeNsf,
          }))}
        />
      </div>

      {formacodes.erreur && <ErrorMessage message={formacodes.erreur} />}
      {formacodes.chargement && <Loader />}

      {formacodes.donnees && (
        <>
          <table className="tableau">
            <thead>
              <tr>
                <th>Formacode</th>
                <th>Intitulé</th>
                <th>NSF</th>
                <th>Fondamental</th>
              </tr>
            </thead>
            <tbody>
              {formacodes.donnees.data.map((f) => (
                <tr key={f.codeFormacode}>
                  <td>
                    <Link to={`/formacodes/${encodeURIComponent(f.codeFormacode)}`}>
                      {f.codeFormacode}
                    </Link>
                  </td>
                  <td>{f.intitule}</td>
                  <td>{f.codeNsf ?? '—'}</td>
                  <td>{f.estFondamental ? 'Oui' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {formacodes.donnees.data.length === 0 && <p className="vide">Aucun résultat.</p>}

          <Pagination pagination={formacodes.donnees.pagination} onChangePage={setPage} />
        </>
      )}
    </div>
  );
}
