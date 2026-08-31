import { NavLink, Outlet } from 'react-router-dom';

const LIENS = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/metiers', label: 'Métiers' },
  { to: '/activites', label: 'Activités & compétences' },
  { to: '/formacodes', label: 'Domaines de connaissance' },
];

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">Fiches Métiers</div>
        <nav className="app-nav">
          {LIENS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => (isActive ? 'app-nav__lien actif' : 'app-nav__lien')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        Données issues des cartographies de branches — base compétences V3.3
      </footer>
    </div>
  );
}
