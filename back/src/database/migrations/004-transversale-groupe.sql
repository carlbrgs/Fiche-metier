-- ============================================================
-- 004 — Regroupement des compétences transversales
--
-- Le gabarit `fiche métier` présente les 17 transversales en 4 blocs :
-- « Ressources cognitives », « Ressources personnelles », « Ressources sociales et
-- relationnelles », « Ressources pratiques et physiques ».
--
-- Ces intitulés existent dans `nomencl_TRANSV` sous forme de lignes de séparation
-- (libellé renseigné, colonne `num_colonne` vide). L'import les ignorait : elles sont
-- désormais reportées sur les compétences qui les suivent.
-- ============================================================

ALTER TABLE competence_transversale
  ADD COLUMN groupe VARCHAR(120) NULL COMMENT 'Famille de ressources, pour l''affichage de la fiche' AFTER libelle;

CREATE INDEX idx_transversale_groupe ON competence_transversale (groupe, ordre);
