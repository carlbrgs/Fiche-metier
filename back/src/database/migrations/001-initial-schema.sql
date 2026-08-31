-- ============================================================
-- 001 — Schéma initial Fiches Métiers
-- Voir docs/SCHEMA.md pour la justification de chaque table.
-- ============================================================

-- ---------- Référentiels ----------

CREATE TABLE nsf (
  code_nsf VARCHAR(10) NOT NULL PRIMARY KEY,
  libelle  VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formacode (
  code_formacode  VARCHAR(10) NOT NULL PRIMARY KEY,
  intitule        VARCHAR(255) NOT NULL,
  code_nsf        VARCHAR(10) NULL,
  est_fondamental BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_formacode_nsf FOREIGN KEY (code_nsf) REFERENCES nsf (code_nsf) ON DELETE SET NULL,
  FULLTEXT KEY ft_formacode (intitule)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE formacode_niveau (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code_formacode    VARCHAR(10) NOT NULL,
  niveau            TINYINT NOT NULL,
  est_niveau_unique BOOLEAN NOT NULL DEFAULT FALSE,
  duree_heures      DECIMAL(10,2) NULL,
  duree_semaines    DECIMAL(10,2) NULL,
  duree_mois        DECIMAL(10,2) NULL,
  methode_calcul    TEXT NULL,
  source            TEXT NULL,
  origine           ENUM('base_formacodes','base_competences') NOT NULL,
  UNIQUE KEY uk_formacode_niveau (code_formacode, niveau, origine),
  CONSTRAINT fk_fcniv_formacode FOREIGN KEY (code_formacode) REFERENCES formacode (code_formacode) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE famille_metier (
  code_famille VARCHAR(5) NOT NULL PRIMARY KEY,
  intitule     VARCHAR(255) NOT NULL,
  definition   TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE famille_activite (
  code_famille_activite VARCHAR(10) NOT NULL PRIMARY KEY,
  domaine_1             VARCHAR(255) NULL,
  domaine_2             VARCHAR(255) NULL,
  domaine_3             TEXT NULL,
  exemple_competence    TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE critere_condition (
  code_condition VARCHAR(10) NOT NULL PRIMARY KEY,
  libelle        VARCHAR(255) NOT NULL,
  ordre          TINYINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE competence_transversale (
  code_transversale VARCHAR(10) NOT NULL PRIMARY KEY,
  libelle           VARCHAR(255) NOT NULL,
  palier_1          TEXT NULL,
  palier_2          TEXT NULL,
  palier_3          TEXT NULL,
  palier_4          TEXT NULL,
  ordre             TINYINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE critere_acces (
  code_acces VARCHAR(10) NOT NULL PRIMARY KEY,
  libelle    VARCHAR(255) NOT NULL,
  ordre      TINYINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dossier_source (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(255) NOT NULL UNIQUE,
  opco    VARCHAR(50) NULL,
  annee   SMALLINT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mot_cle (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  libelle VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Noyau métier ----------

CREATE TABLE metier (
  code_metier           VARCHAR(10) NOT NULL PRIMARY KEY,
  intitule              VARCHAR(255) NOT NULL,
  definition            TEXT NULL,
  code_famille          VARCHAR(5) NULL,
  dossier_source_id     INT NULL,
  respons_transverse    ENUM('oui','non') NULL,
  interface_amont_aval  VARCHAR(255) NULL,
  redacteur             VARCHAR(100) NULL,
  moyenne_niv_formation DECIMAL(4,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_metier_famille FOREIGN KEY (code_famille) REFERENCES famille_metier (code_famille) ON DELETE SET NULL,
  CONSTRAINT fk_metier_dossier FOREIGN KEY (dossier_source_id) REFERENCES dossier_source (id) ON DELETE SET NULL,
  KEY idx_metier_famille (code_famille),
  FULLTEXT KEY ft_metier (intitule, definition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_appellation (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code_metier VARCHAR(10) NOT NULL,
  appellation VARCHAR(255) NOT NULL,
  ordre       TINYINT NOT NULL,
  UNIQUE KEY uk_appellation (code_metier, ordre),
  KEY idx_appellation_libelle (appellation),
  CONSTRAINT fk_appellation_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_rome (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code_metier VARCHAR(10) NOT NULL,
  code_rome   VARCHAR(10) NOT NULL,
  ordre       TINYINT NOT NULL,
  UNIQUE KEY uk_metier_rome (code_metier, code_rome),
  KEY idx_rome (code_rome),
  CONSTRAINT fk_rome_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_condition (
  code_metier    VARCHAR(10) NOT NULL,
  code_condition VARCHAR(10) NOT NULL,
  valeur         ENUM('significatif','non_significatif') NOT NULL,
  PRIMARY KEY (code_metier, code_condition),
  KEY idx_cond_valeur (code_condition, valeur),
  CONSTRAINT fk_mcond_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_mcond_critere FOREIGN KEY (code_condition) REFERENCES critere_condition (code_condition) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_transversale (
  code_metier       VARCHAR(10) NOT NULL,
  code_transversale VARCHAR(10) NOT NULL,
  niveau            TINYINT NULL,
  non_concerne      BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (code_metier, code_transversale),
  KEY idx_transv_niveau (code_transversale, niveau),
  CONSTRAINT fk_mtransv_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_mtransv_comp FOREIGN KEY (code_transversale) REFERENCES competence_transversale (code_transversale) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_acces (
  code_metier VARCHAR(10) NOT NULL,
  code_acces  VARCHAR(10) NOT NULL,
  valeur      TEXT NOT NULL,
  PRIMARY KEY (code_metier, code_acces),
  CONSTRAINT fk_macces_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_macces_critere FOREIGN KEY (code_acces) REFERENCES critere_acces (code_acces) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Activités et compétences ----------

CREATE TABLE activite (
  code_activite         VARCHAR(20) NOT NULL PRIMARY KEY,
  code_famille_activite VARCHAR(10) NULL,
  intitule_activite     TEXT NOT NULL,
  intitule_competence   TEXT NULL,
  dossier_source_id     INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_activite_famille FOREIGN KEY (code_famille_activite) REFERENCES famille_activite (code_famille_activite) ON DELETE SET NULL,
  CONSTRAINT fk_activite_dossier FOREIGN KEY (dossier_source_id) REFERENCES dossier_source (id) ON DELETE SET NULL,
  KEY idx_activite_famille (code_famille_activite),
  FULLTEXT KEY ft_activite (intitule_activite, intitule_competence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activite_detail (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code_activite VARCHAR(20) NOT NULL,
  libelle       TEXT NOT NULL,
  ordre         TINYINT NOT NULL,
  UNIQUE KEY uk_act_detail (code_activite, ordre),
  CONSTRAINT fk_actdet_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE competence_detail (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code_activite VARCHAR(20) NOT NULL,
  libelle       TEXT NOT NULL,
  ordre         TINYINT NOT NULL,
  UNIQUE KEY uk_comp_detail (code_activite, ordre),
  CONSTRAINT fk_compdet_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activite_mot_cle (
  code_activite VARCHAR(20) NOT NULL,
  mot_cle_id    INT NOT NULL,
  ordre         TINYINT NOT NULL,
  PRIMARY KEY (code_activite, mot_cle_id),
  KEY idx_motcle_activite (mot_cle_id),
  CONSTRAINT fk_amc_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE,
  CONSTRAINT fk_amc_motcle FOREIGN KEY (mot_cle_id) REFERENCES mot_cle (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE niveau_maitrise (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code_activite VARCHAR(20) NOT NULL,
  niveau        TINYINT NOT NULL,
  description   TEXT NOT NULL,
  UNIQUE KEY uk_niveau_maitrise (code_activite, niveau),
  CONSTRAINT fk_nivmatr_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activite_connaissance (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  code_activite       VARCHAR(20) NOT NULL,
  code_formacode      VARCHAR(10) NOT NULL,
  intitule            VARCHAR(255) NULL,
  niveau              TINYINT NOT NULL,
  duree_heures        DECIMAL(10,2) NULL,
  justification_duree TEXT NULL,
  code_nsf            VARCHAR(10) NULL,
  est_fondamental     BOOLEAN NOT NULL DEFAULT FALSE,
  ordre               TINYINT NOT NULL,
  UNIQUE KEY uk_act_conn (code_activite, code_formacode),
  KEY idx_conn_formacode (code_formacode, niveau),
  CONSTRAINT fk_actconn_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE,
  CONSTRAINT fk_actconn_formacode FOREIGN KEY (code_formacode) REFERENCES formacode (code_formacode) ON DELETE CASCADE,
  CONSTRAINT fk_actconn_nsf FOREIGN KEY (code_nsf) REFERENCES nsf (code_nsf) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_activite (
  code_metier   VARCHAR(10) NOT NULL,
  code_activite VARCHAR(20) NOT NULL,
  ordre         TINYINT NOT NULL,
  PRIMARY KEY (code_metier, code_activite),
  KEY idx_activite_metier (code_activite),
  CONSTRAINT fk_ma_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_ma_activite FOREIGN KEY (code_activite) REFERENCES activite (code_activite) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Tables calculées (passerelles) ----------

CREATE TABLE metier_connaissance_ecart (
  code_metier    VARCHAR(10) NOT NULL,
  code_formacode VARCHAR(10) NOT NULL,
  niveau_requis  TINYINT NULL,
  duree_heures   DECIMAL(10,2) NULL,
  PRIMARY KEY (code_metier, code_formacode),
  KEY idx_ecart_formacode (code_formacode),
  CONSTRAINT fk_ecart_metier FOREIGN KEY (code_metier) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_ecart_formacode FOREIGN KEY (code_formacode) REFERENCES formacode (code_formacode) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE metier_proximite (
  code_metier_source       VARCHAR(10) NOT NULL,
  code_metier_cible        VARCHAR(10) NOT NULL,
  degre_elargissement      DECIMAL(6,4) NULL,
  duree_acquisition_heures DECIMAL(10,2) NULL,
  nb_dc_communs            SMALLINT NULL,
  calcule_le               TIMESTAMP NULL,
  PRIMARY KEY (code_metier_source, code_metier_cible),
  KEY idx_prox_tri (code_metier_source, duree_acquisition_heures),
  CONSTRAINT fk_prox_source FOREIGN KEY (code_metier_source) REFERENCES metier (code_metier) ON DELETE CASCADE,
  CONSTRAINT fk_prox_cible FOREIGN KEY (code_metier_cible) REFERENCES metier (code_metier) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Traçabilité des imports ----------

CREATE TABLE import_batch (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  fichier       VARCHAR(255) NOT NULL,
  feuille       VARCHAR(100) NULL,
  version       VARCHAR(50) NULL,
  lignes_lues   INT NOT NULL DEFAULT 0,
  lignes_ok     INT NOT NULL DEFAULT 0,
  lignes_erreur INT NOT NULL DEFAULT 0,
  rapport       JSON NULL,
  statut        ENUM('en_cours','termine','echec') NOT NULL DEFAULT 'en_cours',
  demarre_le    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  termine_le    TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
