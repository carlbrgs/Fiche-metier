-- ============================================================
-- 006 — Le couple activité-compétence appartient au métier, pas au catalogue
--
-- Constat sur `Outil_collecte_fiche_metier` : 288 codes activité sont partagés par
-- plusieurs métiers, et 121 d'entre eux portent un libellé RÉELLEMENT différent selon
-- le métier — pas une variation de casse, une rédaction contextualisée :
--
--   K.01.04.02  D5   « Management opérationnel d'une équipe de cavistes »
--               D190 « Management opérationnel d'une équipe et de saisonniers »
--
-- Rattacher le libellé au seul code activité, comme le faisait le schéma initial,
-- en perdrait 121. Le couple tel qu'il figure sur la fiche est donc porté par
-- `metier_activite`, qui reçoit une clé technique et les deux intitulés.
--
-- `activite` reste le catalogue : c'est lui qui portera les domaines de connaissance
-- (`activite_connaissance`, depuis data_ACT_COMP_CONN) qui alimentent les passerelles.
-- Ses intitulés deviennent facultatifs — la version qui fait foi est celle du couple.
--
-- Les tables de détail suivent le couple. Elles sont recréées plutôt qu'altérées :
-- elles sont vides, et une bascule de clé étrangère sur table vide n'a pas d'intérêt.
-- ============================================================

ALTER TABLE activite
  MODIFY COLUMN intitule_activite TEXT NULL COMMENT 'Libellé catalogue ; la fiche affiche celui du couple';

-- ---------- Le couple porte désormais le contenu ----------

ALTER TABLE metier_activite DROP FOREIGN KEY fk_ma_metier;
ALTER TABLE metier_activite DROP FOREIGN KEY fk_ma_activite;

ALTER TABLE metier_activite
  DROP PRIMARY KEY,
  ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST,
  ADD COLUMN intitule_activite   TEXT NULL AFTER ordre,
  ADD COLUMN intitule_competence TEXT NULL AFTER intitule_activite,
  ADD UNIQUE KEY uk_metier_activite (code_metier, code_activite),
  ADD CONSTRAINT fk_ma_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ma_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE;

-- ---------- Les détails suivent le couple ----------

DROP TABLE activite_detail;
CREATE TABLE activite_detail (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  metier_activite_id INT NOT NULL,
  libelle            TEXT NOT NULL,
  ordre              TINYINT NOT NULL,
  UNIQUE KEY uk_act_detail (metier_activite_id, ordre),
  CONSTRAINT fk_actdet_couple FOREIGN KEY (metier_activite_id) REFERENCES metier_activite (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE competence_detail;
CREATE TABLE competence_detail (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  metier_activite_id INT NOT NULL,
  libelle            TEXT NOT NULL,
  ordre              TINYINT NOT NULL,
  UNIQUE KEY uk_comp_detail (metier_activite_id, ordre),
  CONSTRAINT fk_compdet_couple FOREIGN KEY (metier_activite_id) REFERENCES metier_activite (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE niveau_maitrise;
CREATE TABLE niveau_maitrise (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  metier_activite_id INT NOT NULL,
  niveau             TINYINT NOT NULL,
  description        TEXT NOT NULL,
  UNIQUE KEY uk_niveau_maitrise (metier_activite_id, niveau),
  CONSTRAINT fk_nivmatr_couple FOREIGN KEY (metier_activite_id) REFERENCES metier_activite (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE activite_mot_cle;
CREATE TABLE activite_mot_cle (
  metier_activite_id INT NOT NULL,
  mot_cle_id         INT NOT NULL,
  ordre              TINYINT NOT NULL,
  PRIMARY KEY (metier_activite_id, mot_cle_id),
  KEY idx_motcle_couple (mot_cle_id),
  CONSTRAINT fk_amc_couple FOREIGN KEY (metier_activite_id) REFERENCES metier_activite (id) ON DELETE CASCADE,
  CONSTRAINT fk_amc_motcle FOREIGN KEY (mot_cle_id) REFERENCES mot_cle (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
