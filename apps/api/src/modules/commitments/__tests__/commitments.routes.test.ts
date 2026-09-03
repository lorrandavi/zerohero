import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations, DEFAULT_MIGRATIONS_FOLDER, type AppDatabase } from '../../../db/client';
import { createApp } from '../../../index';

describe('Commitments Route Handlers (/api/commitments)', () => {
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

    // Seed a credit card for commitments to link to
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

  describe('POST /api/commitments', () => {
    it('creates a subscription commitment and returns 201', async () => {
      const payload = {
        type: 'subscription',
        cardId: sampleCardId,
        name: 'Netflix Premium',
        amountInCents: 5590,
        billingDay: 15,
        frequency: 'monthly',
      };

      const res = await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.cardId).toBe(sampleCardId);
      expect(data.name).toBe('Netflix Premium');
      expect(data.type).toBe('subscription');
      expect(data.amountInCents).toBe(5590);
      expect(data.billingDay).toBe(15);
      expect(data.frequency).toBe('monthly');
      expect(data.isActive).toBe(true);
    });

    it('creates an installment commitment and automatically computes payoffDate if omitted', async () => {
      const payload = {
        type: 'installment',
        cardId: sampleCardId,
        name: 'MacBook Pro M3',
        totalAmountInCents: 1200000,
        totalInstallments: 12,
        paidInstallments: 0,
        purchaseDate: '2026-06-01',
      };

      const res = await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.cardId).toBe(sampleCardId);
      expect(data.name).toBe('MacBook Pro M3');
      expect(data.type).toBe('installment');
      expect(data.totalAmountInCents).toBe(1200000);
      expect(data.totalInstallments).toBe(12);
      expect(data.paidInstallments).toBe(0);
      expect(data.purchaseDate).toBe('2026-06-01');
      expect(data.payoffDate).toBeDefined();
      expect(typeof data.payoffDate).toBe('string');
      // Closing day 25, due day 2. Purchase June 1 -> statement closes June 25, due July 2 (payment 1). 12 installments -> payoff is 2027-06-02!
      expect(data.payoffDate).toBe('2027-06-02');
    });

    it('rejects commitment creation if cardId does not exist with 400 Bad Request', async () => {
      const payload = {
        type: 'subscription',
        cardId: '00000000-0000-0000-0000-000000000000',
        name: 'Orphan Subscription',
        amountInCents: 1990,
        billingDay: 10,
      };

      const res = await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Credit card not found/);
    });

    it('rejects invalid commitment payload with 400 Bad Request', async () => {
      const invalidPayload = {
        type: 'invalid-type',
        cardId: sampleCardId,
        name: '',
      };

      const res = await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error || data.details).toBeDefined();
    });
  });

  describe('GET /api/commitments', () => {
    it('returns list of commitments and supports filtering by cardId and type', async () => {
      // Create another card
      const card2Res = await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Card 2', closingDay: 10, dueDay: 20 }),
      });
      const card2 = await card2Res.json();

      // Seed commitments
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

      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'installment',
          cardId: sampleCardId,
          name: 'Phone',
          totalAmountInCents: 50000,
          totalInstallments: 5,
          purchaseDate: '2026-05-10',
        }),
      });

      await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: card2.id,
          name: 'iCloud',
          amountInCents: 1490,
          billingDay: 10,
        }),
      });

      // 1. Get all
      const allRes = await app.request('/api/commitments');
      expect(allRes.status).toBe(200);
      const allData = await allRes.json();
      expect(allData).toHaveLength(3);

      // 2. Filter by cardId
      const cardFiltered = await app.request(`/api/commitments?cardId=${sampleCardId}`);
      expect(cardFiltered.status).toBe(200);
      const cardData = await cardFiltered.json();
      expect(cardData).toHaveLength(2);

      // 3. Filter by type
      const typeFiltered = await app.request('/api/commitments?type=installment');
      expect(typeFiltered.status).toBe(200);
      const typeData = await typeFiltered.json();
      expect(typeData).toHaveLength(1);
      expect(typeData[0].name).toBe('Phone');
    });
  });

  describe('GET /api/commitments/:id', () => {
    it('returns commitment by id when it exists', async () => {
      const createRes = await app.request('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          cardId: sampleCardId,
          name: 'GitHub Copilot',
          amountInCents: 1000,
          billingDay: 15,
        }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/commitments/${created.id}`);
      expect(res.status).toBe(200);
      const retrieved = await res.json();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('GitHub Copilot');
    });

    it('returns 404 when commitment does not exist', async () => {
      const res = await app.request('/api/commitments/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Commitment not found');
    });
  });
});
