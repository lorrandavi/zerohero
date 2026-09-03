import { z } from 'zod';
import { ISO_DATE_REGEX } from './statement-period.js';

export const SubscriptionSchema = z.object({
  type: z.literal('subscription'),
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  cardId: z.string().uuid('cardId must be a valid UUID'),
  name: z.string().trim().min(1, 'Subscription name is required'),
  /** Fixed amount in integer cents */
  amountInCents: z.number().int().positive('amountInCents must be a positive integer'),
  /** Day of the month on which subscription renews (1-31) */
  billingDay: z.number().int().min(1).max(31),
  frequency: z.enum(['monthly', 'yearly']).default('monthly'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

export const InstallmentSchema = z.object({
  type: z.literal('installment'),
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  cardId: z.string().uuid('cardId must be a valid UUID'),
  name: z.string().trim().min(1, 'Installment name is required'),
  /** Fixed total cost in integer cents */
  totalAmountInCents: z.number().int().positive('totalAmountInCents must be a positive integer'),
  /** Total number of scheduled installment payments */
  totalInstallments: z.number().int().min(1, 'totalInstallments must be at least 1'),
  /** Number of installment payments already paid */
  paidInstallments: z.number().int().min(0).default(0),
  /** "YYYY-MM-DD" initial purchase date */
  purchaseDate: z.string().regex(ISO_DATE_REGEX, 'purchaseDate must follow YYYY-MM-DD format'),
  /** "YYYY-MM-DD" payment due date of the final installment payment, or null if uncalculated */
  payoffDate: z.string().regex(ISO_DATE_REGEX, 'payoffDate must follow YYYY-MM-DD format').nullable().default(null),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Installment = z.infer<typeof InstallmentSchema>;

export const CommitmentSchema = z.discriminatedUnion('type', [
  SubscriptionSchema,
  InstallmentSchema,
]);

export type Commitment = z.infer<typeof CommitmentSchema>;
