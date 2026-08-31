-- ============================================================
-- 002 — La fiche métier provient de `Outil_collecte_fiche_metier`, pas de `data_METIERS`
--
-- `Outil_collecte_fiche_metier` est le formulaire de collecte brut : 439 colonnes,
-- un métier complet par ligne. Il porte des informations que `data_METIERS`
-- (qui n'en est qu'une projection) ne contient pas :
--   - le libellé complet de la famille métier ;
--   - le dossier source libre (DOSSIER_Autre) et le nombre de couples déclaré ;
--   - la remarque libre du rédacteur ;
--   - toute la traçabilité de la collecte (clé, dates, durée et contexte de saisie).
--
-- Voir docs/SCHEMA.md §1 pour la comparaison chiffrée des deux feuilles.
-- ============================================================

ALTER TABLE metier
  ADD COLUMN n_obs               INT          NULL COMMENT 'N°Obs : ordre de collecte' AFTER code_metier,
  ADD COLUMN dossier_autre       VARCHAR(255) NULL COMMENT 'DOSSIER_Autre : dossier saisi en clair' AFTER dossier_source_id,
  ADD COLUMN nb_couple           TINYINT      NULL COMMENT 'NB_COUPLE : nombre de couples activité-compétence déclarés',
  ADD COLUMN remarque            TEXT         NULL COMMENT 'Remarque libre du rédacteur en fin de questionnaire',
  ADD COLUMN cle_collecte        VARCHAR(20)  NULL COMMENT 'CLE : identifiant du questionnaire',
  ADD COLUMN date_saisie         DATETIME     NULL,
  ADD COLUMN date_enregistrement DATETIME     NULL,
  ADD COLUMN date_modification   DATETIME     NULL,
  ADD COLUMN temps_saisie        DECIMAL(12,4) NULL COMMENT 'TEMPS_SAISIE, en secondes',
  ADD COLUMN origine_saisie      VARCHAR(50)  NULL,
  ADD COLUMN langue_saisie       VARCHAR(10)  NULL,
  ADD COLUMN appareil_saisie     VARCHAR(50)  NULL;

-- 34 des 333 fiches n'ont aucune métadonnée de collecte (elles ne sont pas passées par
-- l'outil) : toutes ces colonnes restent donc NULL pour elles. Cet index sert à les isoler.
CREATE INDEX idx_metier_cle_collecte ON metier (cle_collecte);

-- `moyenne_niv_formation` n'existe QUE dans data_METIERS : c'est une donnée calculée,
-- absente du formulaire de collecte. La colonne est conservée mais restera NULL tant
-- qu'on n'importe pas data_METIERS. Voir docs/SCHEMA.md §8.
