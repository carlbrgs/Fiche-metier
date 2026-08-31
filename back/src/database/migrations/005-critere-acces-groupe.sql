-- ============================================================
-- 005 — Regroupement des critères d'accès au métier
--
-- Le gabarit `fiche métier` présente les 7 critères en 2 blocs :
-- « Certification professionnelle » (ACCES_1 à ACCES_4) et « Expérience
-- professionnelle » (ACCES_5 à ACCES_7), soit 3 questions dans chaque bloc —
-- ACCES_3 et ACCES_4 étant les deux bornes d'une même question sur le niveau.
--
-- Même logique que la migration 004 pour les compétences transversales.
-- ============================================================

ALTER TABLE critere_acces
  ADD COLUMN groupe VARCHAR(120) NULL COMMENT 'Bloc d''affichage de la fiche métier' AFTER libelle;

CREATE INDEX idx_acces_groupe ON critere_acces (groupe, ordre);
