/**
 * Runner de migrations SQL minimaliste.
 * Applique dans l'ordre alphabétique les fichiers .sql de database/migrations/
 * qui ne figurent pas encore dans la table `schema_migrations`.
 *
 *   npm run db:migrate    -> applique les migrations en attente
 *   npm run db:status     -> liste appliquées / en attente
 */
import fs from 'node:fs';
import path from 'node:path';
import { QueryTypes } from 'sequelize';
import { sequelize } from './connection';

// `tsc` ne copie pas les .sql dans dist/ : depuis un build compilé, on retombe
// sur l'arborescence source pour que `db:migrate` fonctionne aussi en production.
const MIGRATIONS_DIR = [
  path.resolve(__dirname, 'migrations'),
  path.resolve(__dirname, '../../src/database/migrations'),
].find((p) => fs.existsSync(p)) ?? path.resolve(__dirname, 'migrations');

async function ensureTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nom         VARCHAR(255) NOT NULL PRIMARY KEY,
      applique_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

function listFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function applied(): Promise<Set<string>> {
  const rows = await sequelize.query<{ nom: string }>('SELECT nom FROM schema_migrations', {
    type: QueryTypes.SELECT,
  });
  return new Set(rows.map((r) => r.nom));
}

/**
 * Découpe un fichier SQL en instructions, en ignorant les commentaires `--`.
 *
 * Le découpage tient compte des chaînes : un `;` à l'intérieur d'un littéral
 * (`COMMENT 'a ; b'`) ne sépare pas deux instructions. Les quotes doublées à
 * l'intérieur d'une chaîne (`'l''index'`) ne la referment pas.
 */
function splitStatements(sql: string): string[] {
  const sansCommentaires = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const instructions: string[] = [];
  let courante = '';
  let delimiteur: "'" | '"' | '`' | null = null;

  for (let i = 0; i < sansCommentaires.length; i++) {
    const c = sansCommentaires[i];

    if (delimiteur) {
      courante += c;
      if (c === delimiteur) {
        if (sansCommentaires[i + 1] === delimiteur) {
          courante += sansCommentaires[++i]; // quote échappée par doublement
        } else {
          delimiteur = null;
        }
      }
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      delimiteur = c;
      courante += c;
      continue;
    }

    if (c === ';') {
      instructions.push(courante);
      courante = '';
      continue;
    }

    courante += c;
  }

  instructions.push(courante);
  return instructions.map((s) => s.trim()).filter(Boolean);
}

async function up(): Promise<void> {
  await ensureTable();
  const done = await applied();
  const pending = listFiles().filter((f) => !done.has(f));

  if (pending.length === 0) {
    console.log('✅ Aucune migration en attente.');
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`▶  ${file}`);
    const transaction = await sequelize.transaction();
    try {
      for (const statement of splitStatements(sql)) {
        await sequelize.query(statement, { transaction });
      }
      await sequelize.query('INSERT INTO schema_migrations (nom) VALUES (?)', {
        replacements: [file],
        transaction,
      });
      await transaction.commit();
      console.log(`   ✅ appliquée`);
    } catch (err) {
      await transaction.rollback();
      throw new Error(`Migration ${file} échouée : ${(err as Error).message}`);
    }
  }
}

async function status(): Promise<void> {
  await ensureTable();
  const done = await applied();
  for (const file of listFiles()) {
    console.log(`${done.has(file) ? '✅' : '⏳'}  ${file}`);
  }
}

async function main() {
  const command = process.argv[2] ?? 'up';
  if (command === 'up') await up();
  else if (command === 'status') await status();
  else {
    console.error(`Commande inconnue : ${command} (attendu : up | status)`);
    process.exit(1);
  }
  await sequelize.close();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
