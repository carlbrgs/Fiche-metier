-- ============================================================
-- 010 — Marqueur de péremption des passerelles
--
-- `metier_proximite` est une table matérialisée : elle n'est jamais recalculée toute seule
-- (voir README, « Pile complète en Docker »). Toute modification d'une fiche qui entre dans
-- la formule la rend silencieusement fausse — c'est-à-dire :
--   * l'ajout ou la suppression d'un couple activité-compétence (les formacodes portés par
--     le couple sont l'entrée principale du calcul) ;
--   * `respons_transverse` et `interface_amont_aval`, qui alimentent les bonus du degré
--     d'élargissement (services/passerelle.service.ts).
--
-- `updated_at` ne suffit pas à le détecter : il bouge aussi pour une simple correction de
-- définition, sans conséquence sur les passerelles. D'où cette colonne dédiée, comparée au
-- `calcule_le` de `metier_proximite` pour savoir si la fiche affiche des passerelles périmées.
--
-- Initialisée à NULL : les données en place viennent de l'import, antérieur à tout recalcul.
-- ============================================================

ALTER TABLE metier
  ADD COLUMN proximite_perimee_le TIMESTAMP NULL
    COMMENT 'Dernière modification affectant le calcul des passerelles ; NULL = jamais modifiée depuis l''import'
    AFTER nb_couple;
