# syntax=docker/dockerfile:1

# ---------- Étape de build ----------
FROM node:22-alpine AS build

WORKDIR /app

# Les dépendances sont copiées seules d'abord : cette couche n'est reconstruite
# que si package.json change, pas à chaque modification du code.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Image finale ----------
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# `tsc` ne copie pas les fichiers .sql : on les place là où migrate.js les cherche.
COPY src/database/migrations ./dist/database/migrations

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# L'image node fournit un utilisateur `node` non privilégié : ne pas tourner en root.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
