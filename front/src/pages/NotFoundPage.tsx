import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page">
      <h1>Page introuvable</h1>
      <p>L’adresse demandée ne correspond à aucune page.</p>
      <Link to="/" className="lien-retour">
        ← Retour à l’accueil
      </Link>
    </div>
  );
}
