import { describe, it, expect, beforeAll } from 'vitest';
import app, { initDatabase } from '../index';

describe('ZeroHero Hono API Shell', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('serves /health with ok status and connected database', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.database).toBe('connected');
    expect(body.timestamp).toBeDefined();
  });

  it('serves /api/sample-contracts with valid contracts', async () => {
    const res = await app.request('/api/sample-contracts');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.card).toBeDefined();
    expect(body.period).toBeDefined();
    expect(body.commitment).toBeDefined();
    expect(body.card.name).toBe('Sample Card');
    expect(body.period.cycleId).toBe('2026-10');
    expect(body.commitment.type).toBe('subscription');
  });
});
