import { relations } from 'drizzle-orm';
import { creditCards } from '../modules/credit-cards/cards.schema';
import { commitments } from '../modules/commitments/commitments.schema';

export const creditCardsRelations = relations(creditCards, ({ many }) => ({
  commitments: many(commitments),
}));

export const commitmentsRelations = relations(commitments, ({ one }) => ({
  card: one(creditCards, {
    fields: [commitments.cardId],
    references: [creditCards.id],
  }),
}));
