import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MetierProche } from '@/types/api';

const LARGEUR = 640;
const HAUTEUR = 360;
const MARGE = { haut: 20, droite: 24, bas: 44, gauche: 60 };
const PAS_CLAVIER = 4;
const ETIQUETTE_CAR_PAR_LIGNE = 20;
const ETIQUETTE_HAUTEUR_LIGNE = 10;

interface Point {
  codeMetier: string;
  intitule: string;
  heures: number;
  degre: number;
  nbDcCommuns: number | null;
}

interface Decalage {
  dx: number;
  dy: number;
}

interface DragEnCours {
  codeMetier: string;
  pointerId: number;
  clientXDepart: number;
  clientYDepart: number;
  dxDepart: number;
  dyDepart: number;
}

function arrondirAuDessus(valeur: number, pas: number): number {
  return Math.max(pas, Math.ceil(valeur / pas) * pas);
}

function genererTicks(max: number, nombre = 5): number[] {
  return Array.from({ length: nombre + 1 }, (_, i) => (max / nombre) * i);
}

/** Découpe un intitulé en lignes ≤ `maxCar`, aux espaces — jamais de troncature du nom. */
function decouperEnLignes(texte: string, maxCar: number): string[] {
  const mots = texte.split(' ');
  const lignes: string[] = [];
  let ligne = '';
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (essai.length > maxCar && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

/**
 * Nuage de points durée d'acquisition × degré d'élargissement — même paire d'axes que le
 * graphique de la feuille « Métiers passerelles » du classeur source. Une seule série : pas
 * de légende, le titre de la section suffit à l'identifier.
 */
export function PasserellesScatter({
  candidats,
  afficherNoms = false,
}: {
  candidats: MetierProche[];
  afficherNoms?: boolean;
}) {
  const navigate = useNavigate();
  const idBase = useId();
  const [survole, setSurvole] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragEnCours | null>(null);
  const [decalages, setDecalages] = useState<Record<string, Decalage>>({});

  function demarrerGlissement(e: React.PointerEvent<SVGTextElement>, codeMetier: string) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const actuel = decalages[codeMetier] ?? { dx: 0, dy: 0 };
    dragRef.current = {
      codeMetier,
      pointerId: e.pointerId,
      clientXDepart: e.clientX,
      clientYDepart: e.clientY,
      dxDepart: actuel.dx,
      dyDepart: actuel.dy,
    };
  }

  function poursuivreGlissement(e: React.PointerEvent<SVGTextElement>) {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!drag || !svg || drag.pointerId !== e.pointerId) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const echelle = LARGEUR / rect.width;
    const dx = drag.dxDepart + (e.clientX - drag.clientXDepart) * echelle;
    const dy = drag.dyDepart + (e.clientY - drag.clientYDepart) * echelle;
    setDecalages((d) => ({ ...d, [drag.codeMetier]: { dx, dy } }));
  }

  function terminerGlissement(e: React.PointerEvent<SVGTextElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  function deplacerAuClavier(e: React.KeyboardEvent<SVGTextElement>, codeMetier: string) {
    const deplacements: Record<string, [number, number]> = {
      ArrowUp: [0, -PAS_CLAVIER],
      ArrowDown: [0, PAS_CLAVIER],
      ArrowLeft: [-PAS_CLAVIER, 0],
      ArrowRight: [PAS_CLAVIER, 0],
    };
    const deplacement = deplacements[e.key];
    if (!deplacement) return;
    e.preventDefault();
    const actuel = decalages[codeMetier] ?? { dx: 0, dy: 0 };
    setDecalages((d) => ({
      ...d,
      [codeMetier]: { dx: actuel.dx + deplacement[0], dy: actuel.dy + deplacement[1] },
    }));
  }

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

  const nbDecalages = Object.keys(decalages).length;

  return (
    <div className="passerelles-graphique">
      {afficherNoms && (
        <p className="passerelles-graphique__aide">
          Glissez un nom pour le repositionner (double-clic pour le réinitialiser).
          {nbDecalages > 0 && (
            <button type="button" className="lien-bouton" onClick={() => setDecalages({})}>
              Réinitialiser les étiquettes
            </button>
          )}
        </p>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        role="img"
        aria-label="Durée d’acquisition en heures en fonction du degré d’élargissement, un point par métier candidat"
      >
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

        {/* Noms des métiers — optionnels, alternés au-dessus/en dessous du point pour limiter
            les recouvrements entre voisins, sauf près des bords où la position est forcée.
            Chacun est déplaçable à la souris/tactile (ou aux flèches, une fois focus) pour
            que l'utilisateur puisse lui-même désenchevêtrer les étiquettes trop proches. */}
        {afficherNoms &&
          points.map((p, i) => {
            const cx = px(p.heures);
            const cy = py(p.degre);
            const lignes = decouperEnLignes(p.intitule, ETIQUETTE_CAR_PAR_LIGNE);
            const hauteurBloc = lignes.length * ETIQUETTE_HAUTEUR_LIGNE;
            let enDessous = i % 2 === 1;
            if (cy - 9 - hauteurBloc < MARGE.haut) enDessous = true;
            else if (cy + 20 + hauteurBloc > HAUTEUR - MARGE.bas) enDessous = false;
            // Ligne la plus proche du point : la première si en dessous, la dernière si au-dessus.
            const ancreY = enDessous ? cy + 20 : cy - 9;
            const decalage = decalages[p.codeMetier];
            const dx = decalage?.dx ?? 0;
            const dy = decalage?.dy ?? 0;
            const x = cx + dx;
            const deplacee = decalage !== undefined && (Math.abs(dx) > 2 || Math.abs(dy) > 2);
            return (
              <g key={`etiquette-${p.codeMetier}`}>
                {deplacee && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={x}
                    y2={ancreY + dy - (enDessous ? 8 : -4)}
                    className="passerelles-graphique__lien-etiquette"
                  />
                )}
                <text
                  x={x}
                  y={ancreY + dy}
                  className="passerelles-graphique__etiquette"
                  textAnchor="middle"
                  tabIndex={0}
                  role="button"
                  aria-label={`Étiquette « ${p.intitule} » — déplaçable, flèches du clavier pour ajuster`}
                  onPointerDown={(e) => demarrerGlissement(e, p.codeMetier)}
                  onPointerMove={poursuivreGlissement}
                  onPointerUp={terminerGlissement}
                  onPointerCancel={terminerGlissement}
                  onKeyDown={(e) => deplacerAuClavier(e, p.codeMetier)}
                  onDoubleClick={() =>
                    setDecalages((d) => {
                      if (!(p.codeMetier in d)) return d;
                      const suite = { ...d };
                      delete suite[p.codeMetier];
                      return suite;
                    })
                  }
                >
                  {lignes.map((ligne, j) => {
                    // En dessous : la ligne j s'éloigne du point vers le bas (j=0 au plus près).
                    // Au-dessus : c'est la dernière ligne qui est au plus près du point.
                    const decalageLigne = enDessous
                      ? j * ETIQUETTE_HAUTEUR_LIGNE
                      : -(lignes.length - 1 - j) * ETIQUETTE_HAUTEUR_LIGNE;
                    return (
                      <tspan key={j} x={x} dy={j === 0 ? decalageLigne : ETIQUETTE_HAUTEUR_LIGNE}>
                        {ligne}
                      </tspan>
                    );
                  })}
                </text>
              </g>
            );
          })}

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
