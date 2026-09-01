import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { connecter } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { ErrorMessage } from '@/components/ErrorMessage';

export function LoginPage() {
  const { authentifie, chargement, rafraichir } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Déjà connecté (retour arrière sur /login, onglet déjà ouvert…) : direct vers la page visée.
  if (!chargement && authentifie) {
    const destination = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={destination} replace />;
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await connecter({ username, password });
      await rafraichir();
      const destination = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Connexion impossible');
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="connexion">
      <form className="connexion__carte" onSubmit={soumettre}>
        <h1>Fiches Métiers</h1>
        <p className="fiche__famille">Connexion à la plateforme</p>

        <div className="passerelles-champ">
          <label htmlFor="connexion-utilisateur">Identifiant</label>
          <input
            id="connexion-utilisateur"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="passerelles-champ">
          <label htmlFor="connexion-mdp">Mot de passe</label>
          <input
            id="connexion-mdp"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {erreur && <ErrorMessage message={erreur} />}

        <button type="submit" className="bouton--export" disabled={envoiEnCours}>
          {envoiEnCours ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
