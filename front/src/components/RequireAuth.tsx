import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/components/Loader';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { authentifie, chargement } = useAuth();
  const location = useLocation();

  if (chargement) return <Loader />;

  if (!authentifie) {
    // La destination visée est reportée à /login, qui y renvoie une fois la connexion faite.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
