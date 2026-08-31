import path from 'node:path';
import dotenv from 'dotenv';

// `quiet` supprime la bannière que dotenv 17 imprime à chaque démarrage.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name} (voir back/.env.example)`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4000')),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  db: {
    host: optional('DB_HOST', '127.0.0.1'),
    port: Number(optional('DB_PORT', '3306')),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    logging: optional('DB_LOGGING', 'false') === 'true',
  },

  xlsx: {
    formacodes: optional('XLSX_FORMACODES', '../Base formacodes_DC structurants.xlsx'),
    competences: optional('XLSX_COMPETENCES', '../251230_base competences_V3.3.xlsm'),
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
