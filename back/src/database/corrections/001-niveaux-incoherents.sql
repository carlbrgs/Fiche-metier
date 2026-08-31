-- ============================================================
-- Correction de donnees — niveaux d approfondissement incoherents
--
-- Regle metier : pour un meme metier, un formacode present sur plusieurs couples
-- activite-competence doit porter le MEME niveau. La feuille `Outil_collecte`
-- en presente 20 qui se contredisent.
--
-- Arbitrage : la feuille `fiche metier` fait foi. Son niveau est repris tel quel,
-- y compris quand il est minoritaire dans la collecte (C248 : 2 sur la fiche,
-- alors que la collecte porte 1 sur trois couples et 2 sur un seul).
--
-- ATTENTION : `npm run import:excel` relit `Outil_collecte` et ecrasera ces
-- corrections. A rejouer apres chaque import, ou a porter dans le classeur.
-- ============================================================

-- A259  32062  Recherche et développement  : collecte 3/2/2 -> 3
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 3
 WHERE ma.code_metier = 'A259' AND ac.code_formacode = '32062';

-- B168  32079  Gestion performance  : collecte 2/3 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'B168' AND ac.code_formacode = '32079';

-- B222  13154  Economie  : collecte 2/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'B222' AND ac.code_formacode = '13154';

-- C70  21547  Bonnes pratiques hygiene agroalimentaire  : collecte 1/2/2/2/2 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'C70' AND ac.code_formacode = '21547';

-- C205  31407  Qualite hygiene securite environnement  : collecte 2/2/2/2/2/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'C205' AND ac.code_formacode = '31407';

-- C206  31407  Qualite hygiene securite environnement  : collecte 2/2/2/(vide) -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'C206' AND ac.code_formacode = '31407';

-- C214  21572  Reglementation hygiene agroalimentaire  : collecte 1/2 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'C214' AND ac.code_formacode = '21572';

-- C242  12054  Sciences naturelles  : collecte 1/2 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'C242' AND ac.code_formacode = '12054';

-- C248  21572  Reglementation hygiene agroalimentaire  : collecte 2/1/1/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'C248' AND ac.code_formacode = '21572';

-- D10  31436  Contrôle qualité  : collecte 3/2 -> 3
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 3
 WHERE ma.code_metier = 'D10' AND ac.code_formacode = '31436';

-- D192  21572  Reglementation hygiene agroalimentaire  : collecte 1/1/2/1/1/1 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'D192' AND ac.code_formacode = '21572';

-- D217  21572  Reglementation hygiene agroalimentaire  : collecte 2/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'D217' AND ac.code_formacode = '21572';

-- F165  23594  Mécanique vol  : collecte 2/(vide) -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'F165' AND ac.code_formacode = '23594';

-- F323  21572  Reglementation hygiene agroalimentaire  : collecte 2/2/1/2/2 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'F323' AND ac.code_formacode = '21572';

-- P239  13254  Droit  : collecte 2/2/2/1/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'P239' AND ac.code_formacode = '13254';

-- P252  33054  Ressources humaines  : collecte 2/1/1/1/1 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'P252' AND ac.code_formacode = '33054';

-- P267  35071  Technique administrative  : collecte 2/1/2 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'P267' AND ac.code_formacode = '35071';

-- P269  32079  Gestion performance  : collecte 1/2 -> 1
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 1
 WHERE ma.code_metier = 'P269' AND ac.code_formacode = '32079';

-- P294  13366  Fiscalite entreprise  : collecte 2/2/1 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'P294' AND ac.code_formacode = '13366';

-- P297  13154  Economie  : collecte 2/2/3 -> 2
UPDATE activite_connaissance ac
  JOIN metier_activite ma ON ma.id = ac.metier_activite_id
   SET ac.niveau = 2
 WHERE ma.code_metier = 'P297' AND ac.code_formacode = '13154';
