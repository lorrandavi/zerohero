import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { creditCards } from '../credit-cards/cards.schema';

export const commitments = sqliteTable('commitments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  cardId: text('card_id')
    .notNull()
    .references(() => creditCards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['subscription', 'installment'] }).notNull(),
  amountInCents: integer('amount_in_cents'),
  totalAmountInCents: integer('total_amount_in_cents'),
  totalInstallments: integer('total_installments'),
  paidInstallments: integer('paid_installments').default(0),
  billingDay: integer('billing_day'),
  frequency: text('frequency', { enum: ['monthly', 'yearly'] }).default('monthly'),
  purchaseDate: text('purchase_date'),
  payoffDate: text('payoff_date'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type CommitmentRow = typeof commitments.$inferSelect;
export type NewCommitmentRow = typeof commitments.$inferInsert;
