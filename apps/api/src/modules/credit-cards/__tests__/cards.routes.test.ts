import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDb, runMigrations, DEFAULT_MIGRATIONS_FOLDER, type AppDatabase } from '../../../db/client';
import { createApp } from '../../../index';

describe('Credit Cards Route Handlers (/api/cards)', () => {
  let sqlite: InstanceType<typeof Database>;
  let appDb: AppDatabase;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    appDb = createDb({ sqlite });
    runMigrations(appDb.db, DEFAULT_MIGRATIONS_FOLDER);

    app = createApp({ db: appDb });
  });

  describe('POST /api/cards', () => {
    it('creates a new credit card with valid input and returns 201', async () => {
      const payload = {
        name: 'Nubank Ultravioleta',
        closingDay: 25,
        dueDay: 2,
      };

      const res = await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Nubank Ultravioleta');
      expect(data.closingDay).toBe(25);
      expect(data.dueDay).toBe(2);
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('rejects invalid inputs with 400 Bad Request', async () => {
      const invalidPayload = {
        name: '',
        closingDay: 40,
        dueDay: -1,
      };

      const res = await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error || data.errors || data.message).toBeDefined();
    });
  });

  describe('GET /api/cards', () => {
    it('returns empty array when no cards exist', async () => {
      const res = await app.request('/api/cards');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    it('lists all created cards', async () => {
      await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Card A', closingDay: 10, dueDay: 20 }),
      });
      await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Card B', closingDay: 15, dueDay: 25 }),
      });

      const res = await app.request('/api/cards');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(data.map((c: any) => c.name)).toEqual(expect.arrayContaining(['Card A', 'Card B']));
    });
  });

  describe('GET /api/cards/:id', () => {
    it('returns 200 and the card when card exists', async () => {
      const createRes = await app.request('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Inter Black', closingDay: 5, dueDay: 15 }),
      });
      const created = await createRes.json();

      const res = await app.request(`/api/cards/${created.id}`);
      expect(res.status).toBe(200);
      const retrieved = await res.json();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Inter Black');
    });

    it('returns 404 when card does not exist', async () => {
      const res = await app.request('/api/cards/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Credit card not found');
    });
  });
});
