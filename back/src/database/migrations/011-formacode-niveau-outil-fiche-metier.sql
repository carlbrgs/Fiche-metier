-- ============================================================
-- 011 — Troisième origine pour formacode_niveau : « Outil fiche métier »
--
-- Jusqu'ici `formacode_niveau` ne portait que les deux classeurs importés en bloc
-- (base_formacodes, base_competences). L'outil doit maintenant permettre de saisir ou
-- corriger une durée/méthode directement depuis la page Domaines de connaissance —
-- notamment pour les formacodes qu'aucun des deux classeurs ne couvre (voir docs/
-- FORMACODE BASE.zip : 31047 CMMI en est un exemple, absent des deux imports).
--
-- `outil_fiche_metier` est la valeur la plus prioritaire dans la résolution de durée
-- (services/passerelle.service.ts, chargerDureesParFormacodeNiveau) : une saisie
-- manuelle dans l'outil prime sur les deux imports externes.
-- ============================================================

ALTER TABLE formacode_niveau
  MODIFY COLUMN origine ENUM('base_formacodes', 'base_competences', 'outil_fiche_metier') NOT NULL;
