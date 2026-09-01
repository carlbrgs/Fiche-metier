import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import type {
  Couple,
  CritereAcces,
  Detail,
  Metier,
  MetierProche,
  ConnaissanceMetier,
} from '@/types/api';
import { libelleFamille } from './format';
import logoAmnyos from '@/assets/logo-amnyos.png';

/**
 * Palette et échelle d'espacement recopiées de index.css (`--couleur-*`, `--rayon`) : le
 * .docx doit se lire comme une impression de la fiche, pas comme un document à part.
 * 1rem = 16px = 240 twips (unité native docx) : les paddings ci-dessous sont convertis
 * directement depuis leurs équivalents CSS.
 */
const TEXTE = '1C2330';
const TEXTE_DOUX = '5B6577';
const ACCENT = '2C5F8A';
const ACCENT_DOUX = 'EAF1F7';
const BORDURE = 'E2E5EA';

const REM = 240;

const ORDINAUX = ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième', 'Sixième'];
function ordinal(n: number): string {
  return ORDINAUX[n - 1] ?? `${n}ᵉ`;
}

const BORDURE_LEGERE = { style: BorderStyle.SINGLE, size: 4, color: BORDURE };
const SANS_BORDURE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const BORDURES_CARTE = {
  top: BORDURE_LEGERE,
  bottom: BORDURE_LEGERE,
  left: BORDURE_LEGERE,
  right: BORDURE_LEGERE,
};
const BORDURES_TABLEAU = {
  ...BORDURES_CARTE,
  insideHorizontal: BORDURE_LEGERE,
  insideVertical: SANS_BORDURE,
};
const SANS_BORDURES = {
  top: SANS_BORDURE,
  bottom: SANS_BORDURE,
  left: SANS_BORDURE,
  right: SANS_BORDURE,
  insideHorizontal: SANS_BORDURE,
  insideVertical: SANS_BORDURE,
};

/** Espace vide entre deux blocs — les cartes n'ont pas de `margin-bottom` docx natif. */
function espace(apres = REM): Paragraph {
  return new Paragraph({ text: '', spacing: { after: apres } });
}

function titre2(texte: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: texte, bold: true, size: 26, color: TEXTE })],
    spacing: { after: REM * 0.5 },
  });
}

/** Style `.acces__titre` : libellé discret souligné d'un filet, sans fond. */
function sousTitre(texte: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: texte, bold: true, size: 20, color: TEXTE_DOUX })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDURE, space: 4 } },
    spacing: { before: REM * 0.75, after: REM * 0.4 },
  });
}

/** Style `.transversales__titre` : bandeau plein accent-doux, comme un pill étiré. */
function bandeauDoux(texte: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SANS_BORDURES,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: ACCENT_DOUX },
            margins: { top: 96, bottom: 96, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: texte, bold: true, size: 20, color: TEXTE_DOUX })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/** Style `.couple__entete` : bandeau plein accent, texte blanc, titre à gauche / code à droite. */
function bandeauAccent(gauche: string, droite: string): Table {
  const cellule = (texte: string, alignement: (typeof AlignmentType)[keyof typeof AlignmentType]) =>
    new TableCell({
      shading: { fill: ACCENT },
      margins: { top: 96, bottom: 96, left: 180, right: 180 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: alignement,
          children: [new TextRun({ text: texte, bold: true, size: 20, color: 'FFFFFF' })],
        }),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SANS_BORDURES,
    rows: [new TableRow({ children: [cellule(gauche, AlignmentType.LEFT), cellule(droite, AlignmentType.RIGHT)] })],
  });
}

/** Carte `.fiche__section` : fond blanc, filet gris, padding généreux. */
function carte(...enfants: Array<Paragraph | Table>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDURES_CARTE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: REM, bottom: REM, left: REM * 1.25, right: REM * 1.25 },
            children: enfants,
          }),
        ],
      }),
    ],
  });
}

function celluleTexte(
  texte: string,
  opts: { entete?: boolean; centre?: boolean; doux?: boolean } = {},
): TableCell {
  return new TableCell({
    shading: opts.entete ? { fill: ACCENT_DOUX } : undefined,
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    children: [
      new Paragraph({
        alignment: opts.centre ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text: texte,
            bold: opts.entete,
            size: 20,
            color: opts.entete ? ACCENT : opts.doux ? TEXTE_DOUX : TEXTE,
          }),
        ],
      }),
    ],
  });
}

function celluleMultiligne(lignes: string[]): TableCell {
  return new TableCell({
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    children:
      lignes.length > 0
        ? lignes.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 20, color: TEXTE })] }))
        : [new Paragraph({ children: [new TextRun({ text: '—', size: 20, color: TEXTE_DOUX })] })],
  });
}

function ligneEntete(libelles: string[]): TableRow {
  return new TableRow({ children: libelles.map((l) => celluleTexte(l, { entete: true })) });
}

function tableau(rows: TableRow[]): Table {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: BORDURES_TABLEAU, rows });
}

function listeDetails(details: Detail[] | undefined): string[] {
  return [...(details ?? [])].sort((a, b) => a.ordre - b.ordre).map((d) => `•  ${d.libelle}`);
}

function phraseNiveau(basse: string | undefined, haute: string | undefined): string | null {
  if (!basse && !haute) return null;
  if (!basse || !haute || basse === haute) return `Un diplôme de ${basse ?? haute} est attendu.`;
  return `Un diplôme de ${basse} à un ${haute} est attendu.`;
}

const SANS_GROUPE_ACCES = 'Autres conditions';
const BORNE_BASSE = 'ACCES_3';
const BORNE_HAUTE = 'ACCES_4';

/**
 * Commun aux deux exports : en-tête de page (logo), styles par défaut, et le
 * téléchargement lui-même. Le contenu passé ici est déjà entièrement construit — aucun
 * contrôle de filtre ne transite jamais par ce chemin, seules des données le peuvent.
 */
async function construireEtTelecharger(
  contenu: Array<Paragraph | Table>,
  nomFichier: string,
): Promise<void> {
  const logoBuffer = await fetch(logoAmnyos).then((r) => r.arrayBuffer());
  const entete = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({ type: 'png', data: logoBuffer, transformation: { width: 108, height: 45 } }),
        ],
      }),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Segoe UI', size: 20, color: TEXTE },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1300, bottom: 1000, left: 1000, right: 1000 } } },
        headers: { default: entete },
        children: contenu,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

interface ExportParams {
  metier: Metier;
  couples: Couple[];
  connaissances: ConnaissanceMetier[];
  proches: MetierProche[];
  criteresAcces: CritereAcces[];
}

export async function exporterFicheMetierWord(params: ExportParams): Promise<void> {
  const { metier: m, couples, connaissances, proches, criteresAcces } = params;
  const contenu: Array<Paragraph | Table> = [];

  // ---------- En-tête de fiche (équivalent .fiche__entete) ----------
  contenu.push(
    new Paragraph({
      children: [
        new TextRun({
          text: ` ${m.codeMetier} `,
          size: 18,
          color: TEXTE_DOUX,
          shading: { fill: ACCENT_DOUX },
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: m.intitule, bold: true, size: 32, color: TEXTE })],
      spacing: { after: m.famille ? 40 : REM },
    }),
  );
  if (m.famille) {
    contenu.push(
      new Paragraph({
        children: [new TextRun({ text: libelleFamille(m.famille), italics: true, size: 20, color: TEXTE_DOUX })],
        spacing: { after: REM },
      }),
    );
  }

  // ---------- Définition ----------
  if (m.definition) {
    contenu.push(
      carte(titre2('Définition'), new Paragraph({ children: [new TextRun({ text: m.definition, size: 20, color: TEXTE })] })),
      espace(),
    );
  }

  // ---------- Autres appellations ----------
  if ((m.appellations ?? []).length > 0) {
    contenu.push(
      carte(
        titre2('Autres appellations'),
        new Paragraph({
          children: [
            new TextRun({ text: m.appellations!.map((a) => a.appellation).join('   •   '), size: 20, color: ACCENT }),
          ],
        }),
      ),
      espace(),
    );
  }

  // ---------- Codes ROME ----------
  if ((m.codesRome ?? []).length > 0) {
    contenu.push(
      carte(
        titre2('Codes ROME'),
        new Paragraph({
          children: [new TextRun({ text: m.codesRome!.map((r) => r.codeRome).join('   •   '), size: 20, color: ACCENT })],
        }),
      ),
      espace(),
    );
  }

  // ---------- Conditions d'exercice + accès ----------
  const conditions = m.conditions ?? [];
  const acces = m.acces ?? [];
  if (conditions.length > 0 || acces.length > 0) {
    const blocs: Array<Paragraph | Table> = [titre2('Conditions d’exercice du métier')];

    if (conditions.length > 0) {
      const triees = [...conditions].sort((a, b) => (a.critere?.ordre ?? 0) - (b.critere?.ordre ?? 0));
      blocs.push(
        tableau([
          ligneEntete(['Condition', 'Non significatif', 'Significatif']),
          ...triees.map(
            (c) =>
              new TableRow({
                children: [
                  celluleTexte(c.critere?.libelle ?? c.codeCondition),
                  celluleTexte(c.valeur === 'non_significatif' ? 'X' : '', { centre: true }),
                  celluleTexte(c.valeur === 'significatif' ? 'X' : '', { centre: true }),
                ],
              }),
          ),
        ]),
      );
    }

    if (acces.length > 0) {
      blocs.push(espace(REM * 0.75), sousTitre('Conditions d’accès au métier'));

      const reference =
        criteresAcces.length > 0 ? criteresAcces : acces.flatMap((a) => (a.critere ? [a.critere] : []));
      const parCode = new Map(acces.map((a) => [a.codeAcces, a] as const));
      const groupes = new Map<string, Array<{ question: string; reponse: string | null }>>();

      for (const critere of [...reference].sort((a, b) => a.ordre - b.ordre)) {
        if (critere.codeAcces === BORNE_HAUTE) continue;
        const reponse =
          critere.codeAcces === BORNE_BASSE
            ? phraseNiveau(parCode.get(BORNE_BASSE)?.valeur, parCode.get(BORNE_HAUTE)?.valeur)
            : (parCode.get(critere.codeAcces)?.valeur ?? null);
        const cle = critere.groupe ?? SANS_GROUPE_ACCES;
        if (!groupes.has(cle)) groupes.set(cle, []);
        groupes.get(cle)!.push({ question: critere.libelle, reponse: reponse || null });
      }

      let premier = true;
      for (const [groupe, entrees] of groupes) {
        blocs.push(
          new Paragraph({
            children: [new TextRun({ text: groupe, bold: true, size: 20, color: TEXTE })],
            spacing: { before: premier ? 0 : REM * 0.6, after: REM * 0.3 },
          }),
        );
        premier = false;
        for (const e of entrees) {
          blocs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${e.question} `, size: 20, color: TEXTE }),
                new TextRun({
                  text: e.reponse ?? 'Non renseigné',
                  bold: true,
                  size: 20,
                  color: e.reponse ? ACCENT : TEXTE_DOUX,
                }),
              ],
              spacing: { after: REM * 0.3 },
            }),
          );
        }
      }
    }

    contenu.push(carte(...blocs), espace());
  }

  // ---------- Activités et compétences (couples) ----------
  if (couples.length > 0) {
    const blocs: Array<Paragraph | Table> = [titre2('Activités et compétences du métier')];
    const triees = [...couples].sort((a, b) => a.ordre - b.ordre);
    triees.forEach((c, i) => {
      blocs.push(
        bandeauAccent(`${ordinal(c.ordre)} couple activité-compétence professionnelles`, c.codeActivite),
        tableau([
          ligneEntete([c.intituleActivite ?? 'Activité', c.intituleCompetence ?? 'Compétence']),
          new TableRow({
            children: [
              celluleMultiligne(listeDetails(c.detailsActivite)),
              celluleMultiligne(listeDetails(c.detailsCompetence)),
            ],
          }),
        ]),
      );
      if ((c.motsCles ?? []).length > 0) {
        blocs.push(
          new Paragraph({
            spacing: { before: REM * 0.3, after: 0 },
            children: [
              new TextRun({ text: 'Mots clés  ', bold: true, size: 18, color: TEXTE_DOUX }),
              new TextRun({ text: c.motsCles!.map((mc) => mc.libelle).join('   •   '), size: 18, color: ACCENT }),
            ],
          }),
        );
      }
      if (i < triees.length - 1) blocs.push(espace(REM * 0.9));
    });
    contenu.push(carte(...blocs), espace());
  }

  // ---------- Ressources transverses ----------
  const transversales = m.transversales ?? [];
  if (transversales.length > 0) {
    const blocs: Array<Paragraph | Table> = [titre2('Ressources transverses mobilisées dans le travail')];
    const tries = [...transversales].sort((a, b) => (a.competence?.ordre ?? 0) - (b.competence?.ordre ?? 0));
    const groupes = new Map<string, typeof tries>();
    for (const t of tries) {
      const cle = t.competence?.groupe ?? 'Autres ressources';
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle)!.push(t);
    }
    let premier = true;
    for (const [groupe, items] of groupes) {
      if (!premier) blocs.push(espace(REM * 0.75));
      premier = false;
      blocs.push(
        bandeauDoux(groupe),
        espace(REM * 0.3),
        tableau([
          ligneEntete(['Ressource', 'Niveau d’approfondissement retenu']),
          ...items.map((t) => {
            const palier =
              t.competence && t.niveau !== null
                ? [t.competence.palier1, t.competence.palier2, t.competence.palier3, t.competence.palier4][
                    t.niveau - 1
                  ]
                : null;
            const texte =
              t.nonConcerne || t.niveau === null
                ? 'Non concerné'
                : `Niveau ${t.niveau}/4 — ${palier ?? 'palier non renseigné'}`;
            return new TableRow({
              children: [celluleTexte(t.competence?.libelle ?? t.codeTransversale), celluleTexte(texte)],
            });
          }),
        ]),
      );
    }
    contenu.push(carte(...blocs), espace());
  }

  // ---------- Domaines de connaissances ----------
  {
    const blocs: Array<Paragraph | Table> = [
      titre2('Domaines de connaissances structurant pour l’exercice du métier'),
    ];
    if (connaissances.length === 0) {
      blocs.push(new Paragraph({ children: [new TextRun({ text: 'Aucun domaine de connaissance renseigné.', size: 20, color: TEXTE_DOUX })] }));
    } else {
      blocs.push(
        tableau([
          ligneEntete(['Domaine de connaissances', 'Niveau', 'Formacode', 'NSF']),
          ...connaissances.map(
            (d) =>
              new TableRow({
                children: [
                  celluleTexte(d.intitule),
                  celluleTexte(d.niveau !== null ? String(d.niveau) : '—', { centre: true }),
                  celluleTexte(d.codeFormacode, { centre: true }),
                  celluleTexte(d.codeNsf ?? '—', { centre: true }),
                ],
              }),
          ),
        ]),
      );
    }
    contenu.push(carte(...blocs), espace());
  }

  // ---------- Métiers proches ----------
  {
    const blocs: Array<Paragraph | Table> = [titre2('Métiers proches')];
    if (proches.length === 0) {
      blocs.push(
        new Paragraph({ children: [new TextRun({ text: 'Aucune passerelle calculée.', size: 20, color: TEXTE_DOUX })] }),
      );
    } else {
      for (const p of proches) {
        const detail = p.dureeAcquisitionHeures !== null ? ` — ${p.dureeAcquisitionHeures} h d’acquisition` : '';
        blocs.push(
          new Paragraph({
            spacing: { after: REM * 0.3 },
            children: [
              new TextRun({ text: '•  ', size: 20, color: ACCENT }),
              new TextRun({ text: p.intitule, size: 20, color: TEXTE }),
              new TextRun({ text: detail, size: 18, color: TEXTE_DOUX }),
            ],
          }),
        );
      }
    }
    contenu.push(carte(...blocs));
  }

  await construireEtTelecharger(contenu, `fiche-metier-${m.codeMetier}.docx`);
}

interface ExportPasserellesParams {
  metierSource: { codeMetier: string; intitule: string };
  parametres: { dcMin: number; heuresMax: number; degreMin: number; memeFamille: boolean };
  resultats: MetierProche[];
}

/**
 * Export de l'écran Passerelles. `resultats` est déjà filtré (dont, le cas échéant, le
 * filtre « même famille » qui n'existe que côté front) : comme pour la fiche métier, seule
 * la donnée traverse cette fonction, jamais les contrôles de filtre eux-mêmes.
 */
export async function exporterPasserellesWord(params: ExportPasserellesParams): Promise<void> {
  const { metierSource, parametres, resultats } = params;
  const contenu: Array<Paragraph | Table> = [];

  contenu.push(
    new Paragraph({
      children: [new TextRun({ text: 'Métiers passerelles', bold: true, size: 32, color: TEXTE })],
      spacing: { after: REM * 0.3 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Métier de départ : ${metierSource.intitule} (${metierSource.codeMetier})`,
          size: 20,
          color: TEXTE_DOUX,
        }),
      ],
      spacing: { after: REM * 0.4 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            `Minimum DC communs : ${parametres.dcMin}`,
            `Max heures formation : ${parametres.heuresMax}`,
            `Minimum degré d’élargissement : ${parametres.degreMin}`,
            parametres.memeFamille ? 'Même famille uniquement' : null,
          ]
            .filter(Boolean)
            .join('   ·   '),
          italics: true,
          size: 18,
          color: TEXTE_DOUX,
        }),
      ],
      spacing: { after: REM },
    }),
  );

  const blocs: Array<Paragraph | Table> = [titre2(`${resultats.length} métier(s) passerelle(s)`)];
  if (resultats.length === 0) {
    blocs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Aucun métier ne correspond à ces paramètres.', size: 20, color: TEXTE_DOUX })],
      }),
    );
  } else {
    blocs.push(
      tableau([
        ligneEntete(['Intitulé métier', 'Nb de DC communs', 'Différence heures formation', 'Degré d’élargissement']),
        ...resultats.map(
          (r) =>
            new TableRow({
              children: [
                celluleTexte(r.intitule),
                celluleTexte(r.nbDcCommuns !== null ? String(r.nbDcCommuns) : '—', { centre: true }),
                celluleTexte(
                  r.dureeAcquisitionHeures !== null ? String(Math.round(Number(r.dureeAcquisitionHeures))) : '—',
                  { centre: true },
                ),
                celluleTexte(r.degreElargissement !== null ? Number(r.degreElargissement).toFixed(2) : '—', {
                  centre: true,
                }),
              ],
            }),
        ),
      ]),
    );
  }
  contenu.push(carte(...blocs));

  await construireEtTelecharger(contenu, `passerelles-${metierSource.codeMetier}.docx`);
}
