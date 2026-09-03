import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { CreditCard, StatementPeriod, Commitment } from '@zerohero/shared';
import { db, sqlite, runMigrations, type AppDatabase } from './db/client';

export function initDatabase(): AppDatabase {
  runMigrations(db);
  return { db, sqlite };
}

import { createCardsRouter } from './modules/credit-cards/cards.routes';
import { createCommitmentsRouter } from './modules/commitments/commitments.routes';

export interface AppOptions {
  db?: AppDatabase;
}

export function createApp(options: AppOptions = {}): Hono {
  const appDb = options.db?.db ?? db;
  const appSqlite = options.db?.sqlite ?? sqlite;

  const app = new Hono();

  app.get('/health', (c) => {
    let dbStatus = 'unreachable';
    try {
      const dbCheck = appSqlite.prepare('SELECT 1 as healthy').get() as { healthy: number } | undefined;
      if (dbCheck?.healthy === 1) {
        dbStatus = 'connected';
      }
    } catch {
      dbStatus = 'error';
    }

    return c.json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/sample-contracts', (c) => {
    const sampleCard: CreditCard = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Sample Card',
      closingDay: 25,
      dueDay: 2,
    };

    const samplePeriod: StatementPeriod = {
      cycleId: '2026-10',
      startDate: '2026-08-26',
      closingDate: '2026-09-25',
      dueDate: '2026-10-02',
    };

    const sampleCommitment: Commitment = {
      type: 'subscription',
      cardId: sampleCard.id!,
      name: 'Streaming Service',
      amountInCents: 4990,
      billingDay: 15,
      frequency: 'monthly',
      isActive: true,
    };

    return c.json({
      card: sampleCard,
      period: samplePeriod,
      commitment: sampleCommitment,
    });
  });

  app.route('/api/cards', createCardsRouter(appDb));
  app.route('/api/commitments', createCommitmentsRouter(appDb));

  return app;
}

const app = createApp();

const port = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV !== 'test') {
  try {
    initDatabase();
    console.log('ZeroHero database migrations executed successfully');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
  }

  console.log(`ZeroHero API server running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;
