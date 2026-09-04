import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { CreditCardSchema } from '@zerohero/shared';
import { creditCards } from './cards.schema';
import { db as defaultDb } from '../../db/client';
import type { AppDatabase } from '../../db/client';

export const CreateCreditCardInputSchema = CreditCardSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export function createCardsRouter(dbInstance: AppDatabase['db'] = defaultDb) {
  const router = new Hono();

  // POST /api/cards
  router.post(
    '/',
    zValidator('json', CreateCreditCardInputSchema, (result, c) => {
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

      const [inserted] = dbInstance
        .insert(creditCards)
        .values({
          name: validated.name,
          closingDay: validated.closingDay,
          dueDay: validated.dueDay,
          userId: validated.userId ?? null,
        })
        .returning()
        .all();

      return c.json(inserted, 201);
    }
  );

  // GET /api/cards
  router.get('/', (c) => {
    const userId = c.req.query('userId');
    let query = dbInstance.select().from(creditCards);

    if (userId) {
      const cards = dbInstance
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, userId))
        .all();
      return c.json(cards, 200);
    }

    const cards = query.all();
    return c.json(cards, 200);
  });

  // GET /api/cards/:id
  router.get('/:id', (c) => {
    const id = c.req.param('id');
    const card = dbInstance
      .select()
      .from(creditCards)
      .where(eq(creditCards.id, id))
      .get();

    if (!card) {
      return c.json({ error: 'Credit card not found' }, 404);
    }

    return c.json(card, 200);
  });

  // DELETE /api/cards/:id
  router.delete('/:id', (c) => {
    const id = c.req.param('id');
    const existing = dbInstance
      .select()
      .from(creditCards)
      .where(eq(creditCards.id, id))
      .get();

    if (!existing) {
      return c.json({ error: 'Credit card not found' }, 404);
    }

    dbInstance.delete(creditCards).where(eq(creditCards.id, id)).run();

    return c.json({ success: true }, 200);
  });

  return router;
}
