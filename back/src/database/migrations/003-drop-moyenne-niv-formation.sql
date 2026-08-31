-- ============================================================
-- 003 — Suppression de `metier.moyenne_niv_formation`
--
-- `data_METIERS` est définitivement écartée comme source : seule
-- `Outil_collecte_fiche_metier` fait foi. Or MOYENNE_NIV_FORMATION est une donnée
-- CALCULÉE qui n'existe que dans `data_METIERS` — le formulaire de collecte ne la
-- contient pas.
--
-- La colonne n'a donc plus aucune source possible. On la retire plutôt que de la
-- laisser éternellement NULL : une colonne qui ne peut jamais être renseignée laisse
-- croire à une donnée manquante alors qu'il s'agit d'une donnée inexistante.
--
-- Si le besoin réapparaît, elle sera recalculée — la formule vit dans le VBA du
-- classeur et devra être retrouvée avec le métier. Voir docs/SCHEMA.md §8.
-- ============================================================

ALTER TABLE metier DROP COLUMN moyenne_niv_formation;
