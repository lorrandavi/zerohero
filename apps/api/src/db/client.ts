import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from './schema';

export type SqliteDatabase = BetterSqlite3.Database;

export const DEFAULT_MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

export interface DbConfig {
  dbPath?: string;
  sqlite?: BetterSqlite3.Database;
}

export interface AppDatabase {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: BetterSqlite3.Database;
}

export function createSqliteClient(dbPath: string): BetterSqlite3.Database {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');
  return sqliteInstance;
}

export function createDb(config: DbConfig = {}): AppDatabase {
  const dbPath = config.dbPath || process.env.DATABASE_PATH || './data/zerohero.db';
  const sqliteInstance = config.sqlite ?? createSqliteClient(dbPath);
  const dbInstance = drizzle(sqliteInstance, { schema });

  return {
    db: dbInstance,
    sqlite: sqliteInstance,
  };
}

export function runMigrations(
  dbInstance: BetterSQLite3Database<typeof schema>,
  migrationsFolder: string = DEFAULT_MIGRATIONS_FOLDER
): void {
  migrate(dbInstance, { migrationsFolder });
}

// Global/singleton instance for the running API application
const appDatabase = createDb();
export const db: BetterSQLite3Database<typeof schema> = appDatabase.db;
export const sqlite: BetterSqlite3.Database = appDatabase.sqlite;

export * from './schema';
