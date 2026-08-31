-- ============================================================
-- 008 — Les domaines de connaissance pendent du couple
--
-- `Outil_collecte_fiche_metier` porte 30 domaines par métier (colonnes 243 à 422),
-- organisés en 6 groupes de 5 — un groupe par couple activité-compétence. Vérifié sur
-- les 332 fiches : aucun groupe rempli au-delà du nombre de couples du métier.
--
-- Un même formacode revient dans plusieurs groupes d'un même métier (D1 cite
-- « Bonnes pratiques hygiène agroalimentaire » sur deux couples). La clé est donc
-- (couple, formacode) et non (activité, formacode).
--
-- Même bascule que la migration 006 : le contenu rédactionnel appartient au couple.
-- La requête de comparaison de `passerelle.service.ts` s'en trouve simplifiée — elle
-- n'a plus besoin de passer par le code activité.
-- ============================================================

DROP TABLE activite_connaissance;

CREATE TABLE activite_connaissance (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  metier_activite_id  INT NOT NULL,
  code_formacode      VARCHAR(10) NOT NULL,
  intitule            VARCHAR(255) NULL COMMENT 'CONN_INT : libellé contextualisé, en capitales dans la source',
  niveau              TINYINT NULL,
  duree_heures        DECIMAL(10,2) NULL,
  justification_duree TEXT NULL,
  code_nsf            VARCHAR(10) NULL,
  est_fondamental     BOOLEAN NOT NULL DEFAULT FALSE,
  ordre               TINYINT NOT NULL COMMENT 'Position dans le groupe de 5',
  UNIQUE KEY uk_couple_conn (metier_activite_id, code_formacode),
  KEY idx_conn_formacode (code_formacode, niveau),
  CONSTRAINT fk_actconn_couple FOREIGN KEY (metier_activite_id) REFERENCES metier_activite (id) ON DELETE CASCADE,
  CONSTRAINT fk_actconn_formacode FOREIGN KEY (code_formacode) REFERENCES formacode (code_formacode) ON DELETE CASCADE,
  CONSTRAINT fk_actconn_nsf FOREIGN KEY (code_nsf) REFERENCES nsf (code_nsf) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
