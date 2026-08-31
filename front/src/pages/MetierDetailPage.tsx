import { Link, useParams } from 'react-router-dom';
import {
  obtenirMetier,
  obtenirActivitesMetier,
  obtenirConnaissancesMetier,
  listerMetiersProches,
} from '@/api/metiers';
import { obtenirReferentiels } from '@/api/activites';
import { useFetch } from '@/hooks/useFetch';
import { Loader } from '@/components/Loader';
import { ErrorMessage } from '@/components/ErrorMessage';
import { TransversalesFiche } from '@/components/TransversalesFiche';
import { ConditionsFiche } from '@/components/ConditionsFiche';
import { AccesFiche } from '@/components/AccesFiche';
import { CouplesFiche } from '@/components/CouplesFiche';
import { ConnaissancesFiche } from '@/components/ConnaissancesFiche';
import { libelleFamille } from '@/utils/format';

export function MetierDetailPage() {
  const { code = '' } = useParams();

  const metier = useFetch((signal) => obtenirMetier(code, signal), [code]);
  // Fournit la liste complète des critères d'accès : les questions sans réponse
  // doivent rester visibles sur la fiche.
  const referentiels = useFetch((signal) => obtenirReferentiels(signal), []);
  const activites = useFetch((signal) => obtenirActivitesMetier(code, signal), [code]);
  const connaissances = useFetch(
    (signal) => obtenirConnaissancesMetier(code, signal),
    [code],
  );
  const proches = useFetch(
    (signal) => listerMetiersProches(code, { heuresMax: 10000, dcMin: 1, limite: 15 }, signal),
    [code],
  );

  if (metier.chargement) return <Loader />;
  if (metier.erreur) return <ErrorMessage message={metier.erreur} />;
  if (!metier.donnees) return null;

  const m = metier.donnees;

  return (
    <article className="page fiche">
      <header className="fiche__entete">
        <span className="carte__code">{m.codeMetier}</span>
        <h1>{m.intitule}</h1>
        {m.famille && <p className="fiche__famille">{libelleFamille(m.famille)}</p>}
      </header>

      {m.definition && (
        <section className="fiche__section">
          <h2>Définition</h2>
          <p>{m.definition}</p>
        </section>
      )}

      {(m.appellations ?? []).length > 0 && (
        <section className="fiche__section">
          <h2>Autres appellations</h2>
          <ul className="badges">
            {m.appellations!.map((a) => (
              <li key={a.id} className="badge">
                {a.appellation}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(m.codesRome ?? []).length > 0 && (
        <section className="fiche__section">
          <h2>Codes ROME</h2>
          <ul className="badges">
            {m.codesRome!.map((r) => (
              <li key={r.id} className="badge">
                {r.codeRome}
              </li>
            ))}
          </ul>
        </section>
      )}

      {((m.conditions ?? []).length > 0 || (m.acces ?? []).length > 0) && (
        <section className="fiche__section">
          <h2>Conditions d’exercice du métier</h2>
          <ConditionsFiche conditions={m.conditions ?? []} />

          {(m.acces ?? []).length > 0 && (
            <div className="acces">
              <h3 className="transversales__titre">Conditions d’accès au métier</h3>
              <AccesFiche
                acces={m.acces!}
                criteres={referentiels.donnees?.acces ?? []}
              />
            </div>
          )}
        </section>
      )}

      <section className="fiche__section">
        <h2>Activités et compétences du métier</h2>
        {activites.chargement && <Loader />}
        {activites.erreur && <ErrorMessage message={activites.erreur} />}
        {activites.donnees && activites.donnees.data.length === 0 && (
          <p className="vide">Aucun couple activité-compétence renseigné.</p>
        )}
        <CouplesFiche couples={activites.donnees?.data ?? []} />
      </section>

      {(m.transversales ?? []).length > 0 && (
        <section className="fiche__section">
          <h2>Ressources transverses mobilisées dans le travail</h2>
          <TransversalesFiche transversales={m.transversales!} />
        </section>
      )}

      <section className="fiche__section">
        <h2>Domaines de connaissances structurant pour l’exercice du métier</h2>
        {connaissances.chargement && <Loader />}
        {connaissances.erreur && <ErrorMessage message={connaissances.erreur} />}
        {connaissances.donnees && (
          <ConnaissancesFiche domaines={connaissances.donnees.data} />
        )}
      </section>

      <section className="fiche__section">
        <h2>Métiers proches</h2>
        {proches.chargement && <Loader />}
        {proches.erreur && <ErrorMessage message={proches.erreur} />}
        {proches.donnees && proches.donnees.data.length === 0 && (
          <p className="vide">
            Aucune passerelle calculée. Les tables de proximité doivent être générées — voir
            <code> services/passerelle.service.ts</code>.
          </p>
        )}
        <ul className="liste">
          {(proches.donnees?.data ?? []).map((p) => (
            <li key={p.codeMetier}>
              <Link to={`/metiers/${encodeURIComponent(p.codeMetier)}`}>{p.intitule}</Link>
              {p.dureeAcquisitionHeures !== null && (
                <span className="detail"> — {p.dureeAcquisitionHeures} h d’acquisition</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Link to="/metiers" className="lien-retour">
        ← Retour aux métiers
      </Link>
    </article>
  );
}
