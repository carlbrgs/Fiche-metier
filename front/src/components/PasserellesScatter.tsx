import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MetierProche } from '@/types/api';

const LARGEUR = 640;
const HAUTEUR = 360;
const MARGE = { haut: 20, droite: 24, bas: 44, gauche: 60 };

interface Point {
  codeMetier: string;
  intitule: string;
  heures: number;
  degre: number;
  nbDcCommuns: number | null;
}

function arrondirAuDessus(valeur: number, pas: number): number {
  return Math.max(pas, Math.ceil(valeur / pas) * pas);
}

function genererTicks(max: number, nombre = 5): number[] {
  return Array.from({ length: nombre + 1 }, (_, i) => (max / nombre) * i);
}

/**
 * Nuage de points durée d'acquisition × degré d'élargissement — même paire d'axes que le
 * graphique de la feuille « Métiers passerelles » du classeur source. Une seule série : pas
 * de légende, le titre de la section suffit à l'identifier.
 */
export function PasserellesScatter({ candidats }: { candidats: MetierProche[] }) {
  const navigate = useNavigate();
  const idBase = useId();
  const [survole, setSurvole] = useState<number | null>(null);

  const points: Point[] = candidats
    .filter((c) => c.dureeAcquisitionHeures !== null && c.degreElargissement !== null)
    .map((c) => ({
      codeMetier: c.codeMetier,
      intitule: c.intitule,
      heures: Number(c.dureeAcquisitionHeures),
      degre: Number(c.degreElargissement),
      nbDcCommuns: c.nbDcCommuns,
    }));

  if (points.length === 0) {
    return <p className="vide">Aucun candidat à représenter avec ces paramètres.</p>;
  }

  const xMax = arrondirAuDessus(Math.max(...points.map((p) => p.heures)) * 1.05, 200);
  const yMax = arrondirAuDessus(Math.max(...points.map((p) => p.degre)) * 1.1, 0.5);

  const largeurUtile = LARGEUR - MARGE.gauche - MARGE.droite;
  const hauteurUtile = HAUTEUR - MARGE.haut - MARGE.bas;
  const px = (heures: number) => MARGE.gauche + (heures / xMax) * largeurUtile;
  const py = (degre: number) => MARGE.haut + hauteurUtile - (degre / yMax) * hauteurUtile;

  const ticksX = genererTicks(xMax);
  const ticksY = genererTicks(yMax);

  const point = survole !== null ? points[survole] : null;

  return (
    <div className="passerelles-graphique">
      <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} role="img" aria-label="Durée d’acquisition en heures en fonction du degré d’élargissement, un point par métier candidat">
        {/* Grille — hairline, en retrait, jamais devant les points. */}
        {ticksY.map((t) => (
          <line
            key={`gy-${t}`}
            x1={MARGE.gauche}
            x2={LARGEUR - MARGE.droite}
            y1={py(t)}
            y2={py(t)}
            className="passerelles-graphique__grille"
          />
        ))}
        {ticksX.map((t) => (
          <line
            key={`gx-${t}`}
            y1={MARGE.haut}
            y2={HAUTEUR - MARGE.bas}
            x1={px(t)}
            x2={px(t)}
            className="passerelles-graphique__grille"
          />
        ))}

        {/* Graduations */}
        {ticksY.map((t) => (
          <text key={`ty-${t}`} x={MARGE.gauche - 8} y={py(t)} className="passerelles-graphique__tick" textAnchor="end" dominantBaseline="middle">
            {t.toFixed(1)}
          </text>
        ))}
        {ticksX.map((t) => (
          <text key={`tx-${t}`} x={px(t)} y={HAUTEUR - MARGE.bas + 18} className="passerelles-graphique__tick" textAnchor="middle">
            {Math.round(t)}
          </text>
        ))}

        {/* Titres d'axes */}
        <text
          x={MARGE.gauche + largeurUtile / 2}
          y={HAUTEUR - 4}
          className="passerelles-graphique__titre-axe"
          textAnchor="middle"
        >
          Durée d’acquisition (heures)
        </text>
        <text
          x={-(MARGE.haut + hauteurUtile / 2)}
          y={14}
          className="passerelles-graphique__titre-axe"
          textAnchor="middle"
          transform="rotate(-90)"
        >
          Degré d’élargissement
        </text>

        {/* Points — cible tactile invisible ≥ 24px autour de chaque marqueur visible ≥ 8px. */}
        {points.map((p, i) => (
          <g key={p.codeMetier}>
            <circle cx={px(p.heures)} cy={py(p.degre)} r={5} className="passerelles-graphique__point" />
            <circle
              cx={px(p.heures)}
              cy={py(p.degre)}
              r={12}
              className="passerelles-graphique__cible"
              tabIndex={0}
              role="link"
              aria-label={`${p.intitule} — ${Math.round(p.heures)} heures, degré ${p.degre.toFixed(2)}`}
              aria-describedby={survole === i ? `${idBase}-infobulle` : undefined}
              onPointerEnter={() => setSurvole(i)}
              onPointerLeave={() => setSurvole((s) => (s === i ? null : s))}
              onFocus={() => setSurvole(i)}
              onBlur={() => setSurvole((s) => (s === i ? null : s))}
              onClick={() => navigate(`/metiers/${encodeURIComponent(p.codeMetier)}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/metiers/${encodeURIComponent(p.codeMetier)}`);
                }
              }}
            />
          </g>
        ))}

        {/* Infobulle : ancrée au point survolé/focus, resserrée contre les bords du graphique. */}
        {point && (() => {
          const cx = px(point.heures);
          const cy = py(point.degre);
          const largeurBulle = 210;
          const hauteurBulle = 54;
          const bx = Math.min(Math.max(cx - largeurBulle / 2, MARGE.gauche), LARGEUR - MARGE.droite - largeurBulle);
          const by = cy - hauteurBulle - 12 < MARGE.haut ? cy + 12 : cy - hauteurBulle - 12;
          return (
            <g id={`${idBase}-infobulle`}>
              <rect x={bx} y={by} width={largeurBulle} height={hauteurBulle} rx={6} className="passerelles-graphique__bulle" />
              <text x={bx + 10} y={by + 20} className="passerelles-graphique__bulle-titre">
                {point.intitule.length > 32 ? `${point.intitule.slice(0, 31)}…` : point.intitule}
              </text>
              <text x={bx + 10} y={by + 38} className="passerelles-graphique__bulle-valeur">
                {Math.round(point.heures)} h · degré {point.degre.toFixed(2)}
                {point.nbDcCommuns !== null ? ` · ${point.nbDcCommuns} DC communs` : ''}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
