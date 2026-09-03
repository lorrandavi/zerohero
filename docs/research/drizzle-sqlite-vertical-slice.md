# Research: Drizzle ORM + SQLite in a Vertical Slice Hono Architecture

## Context
Ticket: [#4 Research Drizzle ORM SQLite vertical slice structure for Hono](https://github.com/lorrandavi/subhub/issues/4)

## Primary Sources & Facts
- **Drizzle ORM SQLite Driver**: `drizzle-orm/better-sqlite3` is the standard synchronous SQLite driver for Node.js. It is fast, battle-tested, and runs embedded without external database processes.
- **Migration Execution on Startup**: Drizzle provides a runtime migration runner via `drizzle-orm/better-sqlite3/migrator`:
  ```ts
  import { drizzle } from 'drizzle-orm/better-sqlite3';
  import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
  import Database from 'better-sqlite3';

  const sqlite = new Database('./data/subhub.db');
  export const db = drizzle(sqlite, { schema });

  // Run pending migrations on server startup
  migrate(db, { migrationsFolder: './drizzle' });
  ```
- **Vertical Slice Schema Organization**:
  Rather than a monolithic schema file, each vertical module defines its own table:
  - `apps/api/src/modules/credit-cards/cards.schema.ts`
  - `apps/api/src/modules/commitments/commitments.schema.ts`
  A central barrel export (`apps/api/src/db/schema.ts`) aggregates them:
  ```ts
  export * from '../modules/credit-cards/cards.schema.js';
  export * from '../modules/commitments/commitments.schema.js';
  ```
  This satisfies Drizzle Kit's CLI requirement for a single schema entrypoint while keeping feature schema files collocated with their feature logic.

## Recommendation for SubHub
1. Use `better-sqlite3` with `drizzle-orm`.
2. Configure `drizzle.config.ts` pointing to `apps/api/src/db/schema.ts` and outputting migrations to `apps/api/drizzle/`.
3. Include automatic startup migration in the Hono server bootstrap so local developers or production containers automatically apply migrations when starting the server.
