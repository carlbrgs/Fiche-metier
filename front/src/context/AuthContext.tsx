import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { obtenirSession, deconnecter as appelDeconnexion } from '@/api/auth';

interface ContexteAuth {
  authentifie: boolean;
  /** Vrai le temps du premier appel à /auth/me — évite un aller-retour vers /login au démarrage. */
  chargement: boolean;
  rafraichir: () => Promise<void>;
  deconnecterSession: () => Promise<void>;
}

const AuthContext = createContext<ContexteAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authentifie, setAuthentifie] = useState(false);
  const [chargement, setChargement] = useState(true);

  const rafraichir = useCallback(async () => {
    try {
      const { authentifie } = await obtenirSession();
      setAuthentifie(authentifie);
    } catch {
      setAuthentifie(false);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    rafraichir();
  }, [rafraichir]);

  const deconnecterSession = useCallback(async () => {
    await appelDeconnexion().catch(() => undefined);
    setAuthentifie(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authentifie, chargement, rafraichir, deconnecterSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): ContexteAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>');
  return ctx;
}
