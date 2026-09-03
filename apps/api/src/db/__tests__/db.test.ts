import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { createDb, runMigrations, DEFAULT_MIGRATIONS_FOLDER } from '../client';
import { creditCards } from '../../modules/credit-cards/cards.schema';
import { commitments } from '../../modules/commitments/commitments.schema';

describe('SQLite Database & Drizzle ORM Integration', () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof createDb>['db'];

  beforeEach(() => {
    // In-memory sqlite instance for each test
    sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    const initialized = createDb({ sqlite });
    db = initialized.db;

    // Run migrations using the generated migration scripts
    runMigrations(db, DEFAULT_MIGRATIONS_FOLDER);
  });

  it('runs migrations idempotently on a fresh SQLite database', () => {
    // Running migrations a second time should succeed without error
    expect(() => runMigrations(db, DEFAULT_MIGRATIONS_FOLDER)).not.toThrow();

    // Verify tables exist in sqlite_master
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('credit_cards');
    expect(tableNames).toContain('commitments');
    expect(tableNames).toContain('__drizzle_migrations');
  });

  it('inserts and retrieves credit cards with defaults', () => {
    const [inserted] = db
      .insert(creditCards)
      .values({
        name: 'Nubank Ultravioleta',
        closingDay: 25,
        dueDay: 2,
      })
      .returning()
      .all();

    expect(inserted).toBeDefined();
    expect(inserted.id).toBeDefined();
    expect(inserted.name).toBe('Nubank Ultravioleta');
    expect(inserted.closingDay).toBe(25);
    expect(inserted.dueDay).toBe(2);
    expect(inserted.createdAt).toBeDefined();
    expect(inserted.updatedAt).toBeDefined();

    const retrieved = db
      .select()
      .from(creditCards)
      .where(eq(creditCards.id, inserted.id))
      .get();

    expect(retrieved).toEqual(inserted);
  });

  it('inserts and retrieves subscription commitments', () => {
    const [card] = db
      .insert(creditCards)
      .values({
        name: 'Inter Black',
        closingDay: 10,
        dueDay: 18,
      })
      .returning()
      .all();

    const [subscription] = db
      .insert(commitments)
      .values({
        cardId: card.id,
        name: 'Netflix Premium',
        type: 'subscription',
        amountInCents: 5590,
        billingDay: 15,
        frequency: 'monthly',
      })
      .returning()
      .all();

    expect(subscription).toBeDefined();
    expect(subscription.id).toBeDefined();
    expect(subscription.cardId).toBe(card.id);
    expect(subscription.name).toBe('Netflix Premium');
    expect(subscription.type).toBe('subscription');
    expect(subscription.amountInCents).toBe(5590);
    expect(subscription.billingDay).toBe(15);
    expect(subscription.frequency).toBe('monthly');
    expect(subscription.isActive).toBe(true);
  });

  it('inserts and retrieves installment commitments', () => {
    const [card] = db
      .insert(creditCards)
      .values({
        name: 'XP Visa Infinite',
        closingDay: 5,
        dueDay: 15,
      })
      .returning()
      .all();

    const [installment] = db
      .insert(commitments)
      .values({
        cardId: card.id,
        name: 'MacBook Pro M3',
        type: 'installment',
        totalAmountInCents: 1500000,
        totalInstallments: 12,
        paidInstallments: 3,
        purchaseDate: '2026-06-01',
        payoffDate: '2027-05-15',
      })
      .returning()
      .all();

    expect(installment).toBeDefined();
    expect(installment.id).toBeDefined();
    expect(installment.cardId).toBe(card.id);
    expect(installment.name).toBe('MacBook Pro M3');
    expect(installment.type).toBe('installment');
    expect(installment.totalAmountInCents).toBe(1500000);
    expect(installment.totalInstallments).toBe(12);
    expect(installment.paidInstallments).toBe(3);
    expect(installment.purchaseDate).toBe('2026-06-01');
    expect(installment.payoffDate).toBe('2027-05-15');
    expect(installment.isActive).toBe(true);
  });

  it('queries relational associations between credit cards and commitments', async () => {
    const [card] = db
      .insert(creditCards)
      .values({
        name: 'C6 Carbon',
        closingDay: 12,
        dueDay: 20,
      })
      .returning()
      .all();

    db.insert(commitments)
      .values([
        {
          cardId: card.id,
          name: 'Spotify Family',
          type: 'subscription',
          amountInCents: 3490,
          billingDay: 8,
        },
        {
          cardId: card.id,
          name: 'iPhone 17',
          type: 'installment',
          totalAmountInCents: 900000,
          totalInstallments: 10,
          purchaseDate: '2026-01-10',
        },
      ])
      .run();

    // Query card with nested commitments
    const cardWithCommitments = await db.query.creditCards.findFirst({
      where: eq(creditCards.id, card.id),
      with: {
        commitments: true,
      },
    });

    expect(cardWithCommitments).toBeDefined();
    expect(cardWithCommitments?.name).toBe('C6 Carbon');
    expect(cardWithCommitments?.commitments).toHaveLength(2);

    // Query commitment with parent card
    const commitmentWithCard = await db.query.commitments.findFirst({
      where: eq(commitments.name, 'Spotify Family'),
      with: {
        card: true,
      },
    });

    expect(commitmentWithCard).toBeDefined();
    expect(commitmentWithCard?.card?.name).toBe('C6 Carbon');
  });

  it('enforces foreign key constraints when inserting commitment for non-existent card', () => {
    expect(() => {
      db.insert(commitments)
        .values({
          cardId: 'non-existent-uuid',
          name: 'Orphan Commitment',
          type: 'subscription',
          amountInCents: 1000,
          billingDay: 1,
        })
        .run();
    }).toThrowError(/FOREIGN KEY constraint failed/);
  });

  it('cascades delete from credit card to its commitments', () => {
    const [card] = db
      .insert(creditCards)
      .values({
        name: 'Card To Delete',
        closingDay: 1,
        dueDay: 10,
      })
      .returning()
      .all();

    const [commitment] = db
      .insert(commitments)
      .values({
        cardId: card.id,
        name: 'Gym Membership',
        type: 'subscription',
        amountInCents: 15000,
        billingDay: 5,
      })
      .returning()
      .all();

    expect(commitment).toBeDefined();

    // Delete the card
    db.delete(creditCards).where(eq(creditCards.id, card.id)).run();

    // Card should be gone
    const deletedCard = db
      .select()
      .from(creditCards)
      .where(eq(creditCards.id, card.id))
      .get();
    expect(deletedCard).toBeUndefined();

    // Commitment should be cascade-deleted
    const orphanedCommitment = db
      .select()
      .from(commitments)
      .where(eq(commitments.id, commitment.id))
      .get();
    expect(orphanedCommitment).toBeUndefined();
  });
});
