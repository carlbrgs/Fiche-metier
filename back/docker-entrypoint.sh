#!/bin/sh
set -e

# Les migrations sont jouées au démarrage : le runner est idempotent (il ignore les
# fichiers déjà présents dans `schema_migrations`), donc un redémarrage ne rejoue rien.
# Passer RUN_MIGRATIONS=false si le déploiement les applique lui-même — indispensable
# le jour où plusieurs instances du back tournent en parallèle.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "▶  Application des migrations…"
  node dist/database/migrate.js up
fi

exec "$@"
