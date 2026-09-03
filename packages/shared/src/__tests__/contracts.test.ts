import { describe, it, expect } from 'vitest';
import {
  CreditCardSchema,
  StatementPeriodSchema,
  SubscriptionSchema,
  InstallmentSchema,
  CommitmentSchema,
} from '../index.js';

describe('Shared Domain Contracts', () => {
  describe('CreditCardSchema', () => {
    it('validates a correct credit card', () => {
      const validCard = {
        name: 'Nubank Platinum',
        closingDay: 25,
        dueDay: 2,
      };

      const result = CreditCardSchema.safeParse(validCard);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Nubank Platinum');
        expect(result.data.closingDay).toBe(25);
        expect(result.data.dueDay).toBe(2);
      }
    });

    it('rejects invalid closing or due days', () => {
      const invalidCard = {
        name: 'Invalid Card',
        closingDay: 32, // out of bounds
        dueDay: 0,     // out of bounds
      };

      const result = CreditCardSchema.safeParse(invalidCard);
      expect(result.success).toBe(false);
    });
  });

  describe('StatementPeriodSchema', () => {
    it('validates a compliant statement period per ADR-0002', () => {
      const validPeriod = {
        cycleId: '2026-10',
        startDate: '2026-08-26',
        closingDate: '2026-09-25',
        dueDate: '2026-10-02',
      };

      const result = StatementPeriodSchema.safeParse(validPeriod);
      expect(result.success).toBe(true);
    });

    it('rejects invalid cycleId format', () => {
      const invalidPeriod = {
        cycleId: '2026-13', // invalid month
        startDate: '2026-08-26',
        closingDate: '2026-09-25',
        dueDate: '2026-10-02',
      };

      const result = StatementPeriodSchema.safeParse(invalidPeriod);
      expect(result.success).toBe(false);
    });
  });

  describe('CommitmentSchema (Subscription & Installment)', () => {
    const cardId = '11111111-1111-4111-8111-111111111111';

    it('validates a subscription commitment', () => {
      const sub = {
        type: 'subscription' as const,
        cardId,
        name: 'Netflix 4K',
        amountInCents: 5590,
        billingDay: 15,
        frequency: 'monthly' as const,
        isActive: true,
      };

      const result = CommitmentSchema.safeParse(sub);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('subscription');
      }
    });

    it('validates an installment commitment with nullable payoffDate', () => {
      const installment = {
        type: 'installment' as const,
        cardId,
        name: 'MacBook Pro',
        totalAmountInCents: 1200000,
        totalInstallments: 12,
        paidInstallments: 2,
        purchaseDate: '2026-01-10',
        payoffDate: '2026-12-10',
      };

      const result = CommitmentSchema.safeParse(installment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('installment');
      }
    });

    it('rejects float amounts (requires strict integer cents)', () => {
      const invalidSub = {
        type: 'subscription' as const,
        cardId,
        name: 'Spotify',
        amountInCents: 21.9, // float is forbidden
        billingDay: 10,
      };

      const result = SubscriptionSchema.safeParse(invalidSub);
      expect(result.success).toBe(false);
    });
  });
});
