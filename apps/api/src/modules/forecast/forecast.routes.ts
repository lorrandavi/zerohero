import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import {
  calculateMonthlyBurnRate,
  calculatePayoffCurve,
  type Commitment,
  type CardBillingConfig,
} from '@zerohero/shared';
import { creditCards } from '../credit-cards/cards.schema';
import { commitments } from '../commitments/commitments.schema';
import { db as defaultDb } from '../../db/client';
import type { AppDatabase } from '../../db/client';

export const ForecastQuerySchema = z.object({
  targetMonth: z
    .string({ required_error: 'targetMonth is required' })
    .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'targetMonth must follow YYYY-MM format with valid month (01-12)'),
  cardId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const PayoffCurveQuerySchema = z.object({
  startMonth: z
    .string()
    .regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, 'startMonth must follow YYYY-MM format with valid month (01-12)')
    .optional(),
  months: z.coerce.number().int().min(1).max(60).optional(),
  cardId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

function toDomainCommitment(row: typeof commitments.$inferSelect): Commitment {
  if (row.type === 'subscription') {
    return {
      type: 'subscription',
      id: row.id,
      cardId: row.cardId,
      name: row.name,
      amountInCents: row.amountInCents ?? 0,
      billingDay: row.billingDay ?? 1,
      frequency: (row.frequency as 'monthly' | 'yearly') ?? 'monthly',
      isActive: row.isActive ?? true,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId ?? undefined,
    };
  } else {
    return {
      type: 'installment',
      id: row.id,
      cardId: row.cardId,
      name: row.name,
      totalAmountInCents: row.totalAmountInCents ?? 0,
      totalInstallments: row.totalInstallments ?? 1,
      paidInstallments: row.paidInstallments ?? 0,
      purchaseDate: row.purchaseDate!,
      payoffDate: row.payoffDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId ?? undefined,
    };
  }
}

export function createForecastRouter(dbInstance: AppDatabase['db'] = defaultDb) {
  const router = new Hono();

  // GET /api/forecast/payoff-curve
  router.get(
    '/payoff-curve',
    zValidator('query', PayoffCurveQuerySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: 'Validation failed',
            details: result.error.flatten(),
          },
          400
        );
      }
    }),
    async (c) => {
      const { startMonth, months, cardId, userId } = c.req.valid('query');

      if (cardId) {
        const card = dbInstance
          .select()
          .from(creditCards)
          .where(eq(creditCards.id, cardId))
          .get();
        if (!card) {
          return c.json({ error: 'Credit card not found' }, 404);
        }
      }

      let cardsQuery = dbInstance.select().from(creditCards);
      if (cardId) {
        cardsQuery = cardsQuery.where(eq(creditCards.id, cardId)) as any;
      }
      const cardsList = cardsQuery.all();

      const conditions = [];
      if (cardId) {
        conditions.push(eq(commitments.cardId, cardId));
      }
      if (userId) {
        conditions.push(eq(commitments.userId, userId));
      }

      let commitmentRows;
      if (conditions.length === 1) {
        commitmentRows = dbInstance.select().from(commitments).where(conditions[0]).all();
      } else if (conditions.length > 1) {
        commitmentRows = dbInstance.select().from(commitments).where(and(...conditions)).all();
      } else {
        commitmentRows = dbInstance.select().from(commitments).all();
      }

      if (cardsList.length === 0 || commitmentRows.length === 0) {
        const emptyCurve = calculatePayoffCurve([], [], { startMonth, months });
        return c.json(emptyCurve, 200);
      }

      const cardMap = new Map<string, (typeof cardsList)[0]>();
      for (const card of cardsList) {
        cardMap.set(card.id, card);
      }

      const items: Array<{ commitment: Commitment; card: CardBillingConfig }> = [];
      for (const row of commitmentRows) {
        const card = cardMap.get(row.cardId);
        if (!card) continue;
        items.push({
          commitment: toDomainCommitment(row),
          card: { closingDay: card.closingDay, dueDay: card.dueDay },
        });
      }

      const curve = calculatePayoffCurve(items, { startMonth, months });
      return c.json(curve, 200);
    }
  );

  // GET /api/forecast
  router.get(
    '/',
    zValidator('query', ForecastQuerySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: 'Validation failed',
            details: result.error.flatten(),
          },
          400
        );
      }
    }),
    async (c) => {
      const { targetMonth, cardId, userId } = c.req.valid('query');

      if (cardId) {
        const card = dbInstance
          .select()
          .from(creditCards)
          .where(eq(creditCards.id, cardId))
          .get();
        if (!card) {
          return c.json({ error: 'Credit card not found' }, 404);
        }
      }

      let cardsQuery = dbInstance.select().from(creditCards);
      if (cardId) {
        cardsQuery = cardsQuery.where(eq(creditCards.id, cardId)) as any;
      }
      const cardsList = cardsQuery.all();

      const conditions = [];
      if (cardId) {
        conditions.push(eq(commitments.cardId, cardId));
      }
      if (userId) {
        conditions.push(eq(commitments.userId, userId));
      }

      let commitmentRows;
      if (conditions.length === 1) {
        commitmentRows = dbInstance.select().from(commitments).where(conditions[0]).all();
      } else if (conditions.length > 1) {
        commitmentRows = dbInstance.select().from(commitments).where(and(...conditions)).all();
      } else {
        commitmentRows = dbInstance.select().from(commitments).all();
      }

      if (cardsList.length === 0 || commitmentRows.length === 0) {
        return c.json(
          {
            targetMonth,
            totalBurnInCents: 0,
            subscriptionBurnInCents: 0,
            installmentBurnInCents: 0,
            items: [],
          },
          200
        );
      }

      const cardMap = new Map<string, (typeof cardsList)[0]>();
      for (const card of cardsList) {
        cardMap.set(card.id, card);
      }

      const items: Array<{ commitment: Commitment; card: CardBillingConfig }> = [];
      for (const row of commitmentRows) {
        const card = cardMap.get(row.cardId);
        if (!card) continue;
        items.push({
          commitment: toDomainCommitment(row),
          card: { closingDay: card.closingDay, dueDay: card.dueDay },
        });
      }

      const burnRate = calculateMonthlyBurnRate(items, targetMonth);
      return c.json(burnRate, 200);
    }
  );

  return router;
}
