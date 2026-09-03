import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const creditCards = sqliteTable('credit_cards', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  name: text('name').notNull(),
  closingDay: integer('closing_day').notNull(),
  dueDay: integer('due_day').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type CreditCardRow = typeof creditCards.$inferSelect;
export type NewCreditCardRow = typeof creditCards.$inferInsert;
