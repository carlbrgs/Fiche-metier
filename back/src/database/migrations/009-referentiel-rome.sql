-- ============================================================
-- 009 — Référentiel ROME
--
-- Les fiches citent 136 codes ROME distincts. La source ne documente le libellé que
-- pour 27 d'entre eux, et encore : accolé au code dans la même cellule, sous la forme
-- « H1302 - Management et ingénierie HSE industriels ». Les 109 autres sont des codes nus.
--
-- Une table dédiée permet de servir la liste au filtre de recherche, de porter les
-- libellés connus, et d'accueillir plus tard le référentiel ROME complet de France Travail.
--
-- Trois codes sont malformés dans le classeur : « D 1213 » et « D 1407 » (espace parasite),
-- « I130 » (quatre caractères au lieu de cinq). Les deux premiers sont normalisés à
-- l'import ; le troisième est conservé tel quel, faute de savoir ce qu'il désigne.
-- ============================================================

CREATE TABLE rome (
  code_rome VARCHAR(10) NOT NULL PRIMARY KEY,
  libelle   VARCHAR(255) NULL COMMENT 'Renseigné pour 27 codes seulement'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purge avant pose de la contrainte : les codes actuels comportent les formes
-- malformées, et la table est intégralement reconstruite par `npm run import:excel`.
DELETE FROM metier_rome;

ALTER TABLE metier_rome
  ADD CONSTRAINT fk_metier_rome_rome FOREIGN KEY (code_rome) REFERENCES rome (code_rome) ON DELETE CASCADE;
