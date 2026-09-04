import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { CommitmentSchema, calculatePayoffSchedule } from '@zerohero/shared';
import { commitments } from './commitments.schema';
import { creditCards } from '../credit-cards/cards.schema';
import { db as defaultDb } from '../../db/client';
import type { AppDatabase } from '../../db/client';

export function createCommitmentsRouter(dbInstance: AppDatabase['db'] = defaultDb) {
  const router = new Hono();

  // POST /api/commitments
  router.post(
    '/',
    zValidator('json', CommitmentSchema, (result, c) => {
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
      const validated = c.req.valid('json');

      // Verify the associated credit card exists
      const card = dbInstance
        .select()
        .from(creditCards)
        .where(eq(creditCards.id, validated.cardId))
        .get();

      if (!card) {
        return c.json(
          { error: `Credit card not found with id: ${validated.cardId}` },
          400
        );
      }

      let calculatedPayoffDate: string | null = null;
      if (validated.type === 'installment') {
        if (validated.payoffDate) {
          calculatedPayoffDate = validated.payoffDate;
        } else {
          const schedule = calculatePayoffSchedule(validated, card);
          calculatedPayoffDate = schedule.payoffDate;
        }
      }

      const [inserted] = dbInstance
        .insert(commitments)
        .values({
          userId: validated.userId ?? null,
          cardId: validated.cardId,
          name: validated.name,
          type: validated.type,
          amountInCents: validated.type === 'subscription' ? validated.amountInCents : null,
          totalAmountInCents: validated.type === 'installment' ? validated.totalAmountInCents : null,
          totalInstallments: validated.type === 'installment' ? validated.totalInstallments : null,
          paidInstallments: validated.type === 'installment' ? (validated.paidInstallments ?? 0) : 0,
          billingDay: validated.type === 'subscription' ? validated.billingDay : null,
          frequency: validated.type === 'subscription' ? (validated.frequency ?? 'monthly') : 'monthly',
          purchaseDate: validated.type === 'installment' ? validated.purchaseDate : null,
          payoffDate: calculatedPayoffDate,
          isActive: validated.type === 'subscription' ? (validated.isActive ?? true) : true,
        })
        .returning()
        .all();

      return c.json(inserted, 201);
    }
  );

  // GET /api/commitments
  router.get('/', (c) => {
    const cardId = c.req.query('cardId');
    const type = c.req.query('type') as 'subscription' | 'installment' | undefined;

    const conditions = [];
    if (cardId) {
      conditions.push(eq(commitments.cardId, cardId));
    }
    if (type && (type === 'subscription' || type === 'installment')) {
      conditions.push(eq(commitments.type, type));
    }

    let items;
    if (conditions.length === 1) {
      items = dbInstance.select().from(commitments).where(conditions[0]).all();
    } else if (conditions.length > 1) {
      items = dbInstance.select().from(commitments).where(and(...conditions)).all();
    } else {
      items = dbInstance.select().from(commitments).all();
    }

    return c.json(items, 200);
  });

  // GET /api/commitments/:id
  router.get('/:id', (c) => {
    const id = c.req.param('id');
    const item = dbInstance
      .select()
      .from(commitments)
      .where(eq(commitments.id, id))
      .get();

    if (!item) {
      return c.json({ error: 'Commitment not found' }, 404);
    }

    return c.json(item, 200);
  });

  // DELETE /api/commitments/:id
  router.delete('/:id', (c) => {
    const id = c.req.param('id');
    const existing = dbInstance
      .select()
      .from(commitments)
      .where(eq(commitments.id, id))
      .get();

    if (!existing) {
      return c.json({ error: 'Commitment not found' }, 404);
    }

    dbInstance.delete(commitments).where(eq(commitments.id, id)).run();

    return c.json({ success: true }, 200);
  });

  return router;
}
