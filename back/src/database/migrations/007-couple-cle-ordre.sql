-- ============================================================
-- 007 — Un couple est identifié par sa position sur la fiche, pas par son code
--
-- Le métier P285 (ligne 286 du classeur) porte deux fois le code D.08.06.01, pour deux
-- couples pourtant distincts :
--     « Organisation de son activité de recouvrement »
--     « Suivi des dossiers de recouvrement »
--
-- C'est une erreur de codage dans la source, mais les deux couples sont de vraies
-- données. La contrainte UNIQUE (code_metier, code_activite) en rejetait un.
--
-- La fiche présente N couples numérotés : le couple est identifié par (métier, ordre).
-- Le code activité reste indexé — il sert le rapprochement avec le catalogue — mais
-- n'est plus contraint à l'unicité au sein d'un métier.
-- ============================================================

-- Purge préalable. Le contenu actuel est issu d'un import fautif : les couples de la
-- ligne 315 (doublon D314) avaient été rattachés au métier de la ligne 314, produisant
-- des `ordre` en collision qui empêchent la création de la contrainte.
-- Sans risque : cette table est intégralement reconstruite par `npm run import:excel`,
-- et la cascade emporte détails, niveaux et mots-clés.
DELETE FROM metier_activite;

ALTER TABLE metier_activite
  DROP INDEX uk_metier_activite,
  ADD UNIQUE KEY uk_metier_ordre (code_metier, ordre),
  ADD KEY idx_metier_code_activite (code_metier, code_activite);
