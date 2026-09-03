import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations, DEFAULT_MIGRATIONS_FOLDER, type AppDatabase } from '../../../db/client';
import { createApp } from '../../../index';

describe('Forecast Route Handlers (/api/forecast)', () => {
  let sqlite: InstanceType<typeof Database>;
  let appDb: AppDatabase;
  let app: ReturnType<typeof createApp>;
  let sampleCardId: string;

  beforeEach(async () => {
    sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    appDb = createDb({ sqlite });
    runMigrations(appDb.db, DEFAULT_MIGRATIONS_FOLDER);

    app = createApp({ db: appDb });

    // Seed a credit card: closes 25th, due 2nd
    const cardRes = await app.request('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nubank Ultravioleta',
        closingDay: 25,
        dueDay: 2,
      }),
    });
    const cardData = await cardRes.json();
    sampleCardId = cardData.id;
  });

  describe('GET /api/forecast', () => {
    it('returns monthly burn rate breakdown for a valid targetMonth', async () => {
      // 1. Create a subscription
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: sampleCardId,
          name: 'Netflix Premium',
          amountInCents: 5590,
          billingDay: 15,
          frequency: 'monthly',
        }),
      });

      // 2. Create an installment
      // Purchase 2026-06-01 -> closes June 25 -> 1st payment due 2026-07-02
      // 6 installments of 20000 cents = 120000 cents
      // In 2026-08 (due 2026-08-02), installment #2 is due!
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          cardId: sampleCardId,
          name: 'Smartphone',
          totalAmountInCents: 120000,
          totalInstallments: 6,
          purchaseDate: '2026-06-01',
        }),
      });

      const res = await app.request('/api/forecast?targetMonth=2026-08');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.targetMonth).toBe('2026-08');
      expect(data.subscriptionBurnInCents).toBe(5590);
      expect(data.installmentBurnInCents).toBe(20000);
      expect(data.totalBurnInCents).toBe(25590);
      expect(data.items).toHaveLength(2);
      expect(data.items.map((i: any) => i.name)).toEqual(
        expect.arrayContaining(['Netflix Premium', 'Smartphone'])
      );
    });

    it('rejects request with 400 Bad Request when targetMonth is missing or invalid', async () => {
      const resMissing = await app.request('/api/forecast');
      expect(resMissing.status).toBe(400);

      const resInvalidFormat = await app.request('/api/forecast?targetMonth=2026-8');
      expect(resInvalidFormat.status).toBe(400);

      const resInvalidText = await app.request('/api/forecast?targetMonth=october');
      expect(resInvalidText.status).toBe(400);
    });

    it('handles empty database state with 200 and zero burn rate', async () => {
      // Create a fresh empty in-memory db app
      const emptySqlite = new Database(':memory:');
      const emptyDb = createDb({ sqlite: emptySqlite });
      runMigrations(emptyDb.db, DEFAULT_MIGRATIONS_FOLDER);
      const emptyApp = createApp({ db: emptyDb });

      const res = await emptyApp.request('/api/forecast?targetMonth=2026-10');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.targetMonth).toBe('2026-10');
      expect(data.totalBurnInCents).toBe(0);
      expect(data.subscriptionBurnInCents).toBe(0);
      expect(data.installmentBurnInCents).toBe(0);
      expect(data.items).toEqual([]);
    });

    it('filters burn rate by cardId', async () => {
      // Create second card
      const card2Res = await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Inter Black',
          closingDay: 10,
          dueDay: 20,
        }),
      });
      const card2Data = await card2Res.json();

      // Seed commitment on card 1
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: sampleCardId,
          name: 'Spotify',
          amountInCents: 3490,
          billingDay: 1,
        }),
      });

      // Seed commitment on card 2
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: card2Data.id,
          name: 'Amazon Prime',
          amountInCents: 1990,
          billingDay: 5,
        }),
      });

      // Filter by card 1
      const res = await app.request(`/api/forecast?targetMonth=2026-06&cardId=${sampleCardId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe('Spotify');
      expect(data.totalBurnInCents).toBe(3490);
    });

    it('returns 404 when filtering by non-existent cardId', async () => {
      const res = await app.request('/api/forecast?targetMonth=2026-10&cardId=00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Credit card not found');
    });
  });

  describe('GET /api/forecast/payoff-curve', () => {
    it('returns projected multi-month payoff curve timeline', async () => {
      // 1. Subscription
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: sampleCardId,
          name: 'Cloud Storage',
          amountInCents: 2000,
          billingDay: 10,
        }),
      });

      // 2. Installment: 3 payments of 10000 cents (total 30000)
      // Closes 25th, due 2nd. Purchase 2026-05-10 -> payments in 2026-06, 2026-07, 2026-08 (payoff: 2026-08-02)
      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          cardId: sampleCardId,
          name: 'Tablet',
          totalAmountInCents: 30000,
          totalInstallments: 3,
          purchaseDate: '2026-05-10',
        }),
      });

      const res = await app.request('/api/forecast/payoff-curve?startMonth=2026-06&months=4');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.startMonth).toBe('2026-06');
      expect(data.endMonth).toBe('2026-09');
      expect(data.totalInitialDebtInCents).toBe(30000);
      expect(data.payoffDate).toBe('2026-08-02');
      expect(data.timeline).toHaveLength(4);

      // Month 1: 2026-06 (payment 1)
      expect(data.timeline[0].month).toBe('2026-06');
      expect(data.timeline[0].installmentBurnInCents).toBe(10000);
      expect(data.timeline[0].subscriptionBurnInCents).toBe(2000);
      expect(data.timeline[0].totalBurnInCents).toBe(12000);
      expect(data.timeline[0].remainingInstallmentBalanceInCents).toBe(20000);
      expect(data.timeline[0].activeInstallmentsCount).toBe(1);

      // Month 3: 2026-08 (final payment)
      expect(data.timeline[2].month).toBe('2026-08');
      expect(data.timeline[2].installmentBurnInCents).toBe(10000);
      expect(data.timeline[2].remainingInstallmentBalanceInCents).toBe(0);
      expect(data.timeline[2].activeInstallmentsCount).toBe(1);

      // Month 4: 2026-09 (post-payoff, cash flow recovered)
      expect(data.timeline[3].month).toBe('2026-09');
      expect(data.timeline[3].installmentBurnInCents).toBe(0);
      expect(data.timeline[3].remainingInstallmentBalanceInCents).toBe(0);
      expect(data.timeline[3].activeInstallmentsCount).toBe(0);
      expect(data.timeline[3].totalBurnInCents).toBe(2000); // Only subscription remains!
    });

    it('returns empty curve for empty database state', async () => {
      const emptySqlite = new Database(':memory:');
      const emptyDb = createDb({ sqlite: emptySqlite });
      runMigrations(emptyDb.db, DEFAULT_MIGRATIONS_FOLDER);
      const emptyApp = createApp({ db: emptyDb });

      const res = await emptyApp.request('/api/forecast/payoff-curve?startMonth=2026-01&months=3');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.startMonth).toBe('2026-01');
      expect(data.endMonth).toBe('2026-03');
      expect(data.totalInitialDebtInCents).toBe(0);
      expect(data.payoffDate).toBeNull();
      expect(data.timeline).toHaveLength(3);
      for (const pt of data.timeline) {
        expect(pt.totalBurnInCents).toBe(0);
        expect(pt.remainingInstallmentBalanceInCents).toBe(0);
      }
    });

    it('validates query parameters with 400 Bad Request on invalid inputs', async () => {
      const resInvalidMonth = await app.request('/api/forecast/payoff-curve?startMonth=2026-1');
      expect(resInvalidMonth.status).toBe(400);

      const resInvalidMonthsCount = await app.request('/api/forecast/payoff-curve?months=100');
      expect(resInvalidMonthsCount.status).toBe(400);
    });
  });
});
