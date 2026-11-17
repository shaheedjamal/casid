import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import { getDb } from '../backend/config/db';

export function runMigrations(dbInstance?: Database.Database): void {
  const db = dbInstance || getDb();
  const migrationsDir = path.resolve(process.cwd(), 'database', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: string }>;
  const applied = new Set(appliedRows.map((r) => r.version));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const migrateTx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(file);
    });
    migrateTx();
    console.log(`[DB] Applied migration: ${file}`);
  }
}

// Allow direct CLI execution: npm run db:migrate
const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith('migrate.ts');
if (isMain) {
  runMigrations();
  console.log('[DB] Migrations complete.');
}
