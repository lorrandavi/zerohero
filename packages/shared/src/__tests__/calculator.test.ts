import { describe, it, expect } from 'vitest';
import {
  calculateStatementPeriod,
  calculatePayoffSchedule,
  calculateMonthlyBurnRate,
  calculatePayoffCurve,
} from '../calculator.js';
import type { Installment, Subscription } from '../commitment.js';

describe('calculateStatementPeriod', () => {
  it('allocates a mid-month purchase prior to closingDay to the current month statement period', () => {
    const card = { closingDay: 25, dueDay: 2 };
    const purchaseDate = '2026-03-15';

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2026-04',
      startDate: '2026-02-26',
      closingDate: '2026-03-25',
      dueDate: '2026-04-02',
    });
  });

  it('rolls over purchase on the exact closingDay to the subsequent statement period (exclusive boundary)', () => {
    const card = { closingDay: 25, dueDay: 2 };
    const purchaseDate = '2026-03-25'; // Exactly on closing day

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2026-05',
      startDate: '2026-03-26',
      closingDate: '2026-04-25',
      dueDate: '2026-05-02',
    });
  });

  it('allocates purchase on the day immediately before closingDay to the current statement period', () => {
    const card = { closingDay: 25, dueDay: 2 };
    const purchaseDate = '2026-03-24'; // Day before closing day

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2026-04',
      startDate: '2026-02-26',
      closingDate: '2026-03-25',
      dueDate: '2026-04-02',
    });
  });

  it('resolves dueDate in the same calendar month when dueDay > closingDay', () => {
    const card = { closingDay: 10, dueDay: 25 };
    const purchaseDate = '2026-05-05';

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2026-05',
      startDate: '2026-04-11',
      closingDate: '2026-05-10',
      dueDate: '2026-05-25',
    });
  });

  it('handles year-end rollover seamlessly when purchase closes in December and is due in January', () => {
    const card = { closingDay: 25, dueDay: 5 };
    const purchaseDate = '2026-12-10';

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2027-01',
      startDate: '2026-11-26',
      closingDate: '2026-12-25',
      dueDate: '2027-01-05',
    });
  });

  it('handles year-end rollover when purchase in late December rolls over to January cycle', () => {
    const card = { closingDay: 25, dueDay: 5 };
    const purchaseDate = '2026-12-26'; // >= 25, rolls over to January cycle

    const period = calculateStatementPeriod(card, purchaseDate);

    expect(period).toEqual({
      cycleId: '2027-02',
      startDate: '2026-12-26',
      closingDate: '2027-01-25',
      dueDate: '2027-02-05',
    });
  });

  describe('short month clamping', () => {
    it('clamps closingDay 31 to Feb 28 in a standard year', () => {
      const card = { closingDay: 31, dueDay: 15 };
      const purchaseDate = '2026-02-10';

      const period = calculateStatementPeriod(card, purchaseDate);

      expect(period).toEqual({
        cycleId: '2026-03',
        startDate: '2026-02-01',
        closingDate: '2026-02-28',
        dueDate: '2026-03-15',
      });
    });

    it('rolls over on Feb 28 when purchase occurs on the clamped closing date', () => {
      const card = { closingDay: 31, dueDay: 15 };
      const purchaseDate = '2026-02-28'; // >= 28, rolls over to March

      const period = calculateStatementPeriod(card, purchaseDate);

      expect(period).toEqual({
        cycleId: '2026-04',
        startDate: '2026-03-01',
        closingDate: '2026-03-31',
        dueDate: '2026-04-15',
      });
    });

    it('clamps closingDay 31 to Feb 29 in a leap year', () => {
      const card = { closingDay: 31, dueDay: 15 };
      const purchaseDate = '2024-02-28'; // in leap year, Feb has 29 days, so 28 < 29

      const period = calculateStatementPeriod(card, purchaseDate);

      expect(period).toEqual({
        cycleId: '2024-03',
        startDate: '2024-02-01',
        closingDate: '2024-02-29',
        dueDate: '2024-03-15',
      });
    });

    it('clamps closingDay 31 to April 30', () => {
      const card = { closingDay: 31, dueDay: 10 };
      const purchaseDate = '2026-04-15';

      const period = calculateStatementPeriod(card, purchaseDate);

      expect(period).toEqual({
        cycleId: '2026-05',
        startDate: '2026-04-01',
        closingDate: '2026-04-30',
        dueDate: '2026-05-10',
      });
    });
  });
});

describe('calculatePayoffSchedule', () => {
  const card = { closingDay: 25, dueDay: 2 };

  it('calculates a 1-installment payoff schedule correctly', () => {
    const installment: Installment = {
      type: 'installment',
      cardId: '11111111-1111-4111-8111-111111111111',
      name: 'Coffee Grinder',
      totalAmountInCents: 5000,
      totalInstallments: 1,
      paidInstallments: 0,
      purchaseDate: '2026-03-10',
      payoffDate: null,
    };

    const schedule = calculatePayoffSchedule(installment, card);

    expect(schedule).toEqual({
      totalAmountInCents: 5000,
      remainingAmountInCents: 5000,
      payoffDate: '2026-04-02',
      payments: [
        {
          installmentNumber: 1,
          cycleId: '2026-04',
          dueDate: '2026-04-02',
          amountInCents: 5000,
          isPaid: false,
        },
      ],
    });
  });

  it('allocates remainder pennies to the first installment on uneven divisions (ADR-0002)', () => {
    const installment: Installment = {
      type: 'installment',
      cardId: '11111111-1111-4111-8111-111111111111',
      name: 'Wireless Headphones',
      totalAmountInCents: 1000, // 1000 / 3 = 333 remainder 1
      totalInstallments: 3,
      paidInstallments: 0,
      purchaseDate: '2026-01-20',
      payoffDate: null,
    };

    const schedule = calculatePayoffSchedule(installment, card);

    expect(schedule.payments).toHaveLength(3);
    expect(schedule.payments[0].amountInCents).toBe(334);
    expect(schedule.payments[1].amountInCents).toBe(333);
    expect(schedule.payments[2].amountInCents).toBe(333);

    const totalSum = schedule.payments.reduce((sum, p) => sum + p.amountInCents, 0);
    expect(totalSum).toBe(1000);
    expect(schedule.payoffDate).toBe('2026-04-02');
  });

  it('handles multi-installment calendar progression across year-end and short-month clamping', () => {
    const cardWith31 = { closingDay: 25, dueDay: 31 }; // dueDay > closingDay, clamps to 30, 31, 31, 28
    const installment: Installment = {
      type: 'installment',
      cardId: '11111111-1111-4111-8111-111111111111',
      name: 'Home Gym',
      totalAmountInCents: 40000,
      totalInstallments: 4,
      paidInstallments: 0,
      purchaseDate: '2026-11-20',
      payoffDate: null,
    };

    const schedule = calculatePayoffSchedule(installment, cardWith31);

    expect(schedule.payments.map((p) => ({ cycleId: p.cycleId, dueDate: p.dueDate }))).toEqual([
      { cycleId: '2026-11', dueDate: '2026-11-30' },
      { cycleId: '2026-12', dueDate: '2026-12-31' },
      { cycleId: '2027-01', dueDate: '2027-01-31' },
      { cycleId: '2027-02', dueDate: '2027-02-28' },
    ]);
    expect(schedule.payoffDate).toBe('2027-02-28');
  });

  it('correctly flags isPaid and deducts from remainingAmountInCents when paidInstallments > 0', () => {
    const installment: Installment = {
      type: 'installment',
      cardId: '11111111-1111-4111-8111-111111111111',
      name: 'Smart TV',
      totalAmountInCents: 50000,
      totalInstallments: 5, // 5 x 10000 cents
      paidInstallments: 2,  // 2 already paid
      purchaseDate: '2026-01-10',
      payoffDate: null,
    };

    const schedule = calculatePayoffSchedule(installment, card);

    expect(schedule.totalAmountInCents).toBe(50000);
    expect(schedule.remainingAmountInCents).toBe(30000); // 3 remaining x 10000

    expect(schedule.payments[0].isPaid).toBe(true);
    expect(schedule.payments[1].isPaid).toBe(true);
    expect(schedule.payments[2].isPaid).toBe(false);
    expect(schedule.payments[3].isPaid).toBe(false);
    expect(schedule.payments[4].isPaid).toBe(false);
  });
});

describe('calculateMonthlyBurnRate', () => {
  const cardId = '11111111-1111-4111-8111-111111111111';
  const card = { closingDay: 25, dueDay: 2 };

  it('calculates monthly burn rate for an active subscription', () => {
    const sub: Subscription = {
      type: 'subscription',
      id: 'sub-1',
      cardId,
      name: 'Netflix 4K',
      amountInCents: 5590,
      billingDay: 15,
      frequency: 'monthly',
      isActive: true,
    };

    const result = calculateMonthlyBurnRate(
      [{ commitment: sub, card }],
      '2026-10'
    );

    expect(result).toEqual({
      targetMonth: '2026-10',
      totalBurnInCents: 5590,
      subscriptionBurnInCents: 5590,
      installmentBurnInCents: 0,
      items: [
        {
          commitmentId: 'sub-1',
          name: 'Netflix 4K',
          type: 'subscription',
          amountInCents: 5590,
          dueDate: '2026-10-02',
        },
      ],
    });
  });

  it('excludes inactive subscriptions from monthly burn rate', () => {
    const inactiveSub: Subscription = {
      type: 'subscription',
      id: 'sub-inactive',
      cardId,
      name: 'Old Gym',
      amountInCents: 8900,
      billingDay: 10,
      frequency: 'monthly',
      isActive: false,
    };

    const result = calculateMonthlyBurnRate(
      [{ commitment: inactiveSub, card }],
      '2026-10'
    );

    expect(result.totalBurnInCents).toBe(0);
    expect(result.subscriptionBurnInCents).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('includes unpaid installments scheduled for the target month', () => {
    const installment: Installment = {
      type: 'installment',
      id: 'inst-1',
      cardId,
      name: 'iPad Mini',
      totalAmountInCents: 30000,
      totalInstallments: 3,
      paidInstallments: 1, // first installment was in 2026-09, already paid
      purchaseDate: '2026-08-10',
      payoffDate: null,
    };

    const result = calculateMonthlyBurnRate(
      [{ commitment: installment, card }],
      '2026-10'
    );

    expect(result).toEqual({
      targetMonth: '2026-10',
      totalBurnInCents: 10000,
      subscriptionBurnInCents: 0,
      installmentBurnInCents: 10000,
      items: [
        {
          commitmentId: 'inst-1',
          name: 'iPad Mini',
          type: 'installment',
          amountInCents: 10000,
          dueDate: '2026-10-02',
        },
      ],
    });
  });

  it('excludes already paid installment payments from the target month burn rate', () => {
    const installment: Installment = {
      type: 'installment',
      id: 'inst-paid',
      cardId,
      name: 'iPad Mini',
      totalAmountInCents: 30000,
      totalInstallments: 3,
      paidInstallments: 2, // 2026-09 and 2026-10 already paid
      purchaseDate: '2026-08-10',
      payoffDate: null,
    };

    const result = calculateMonthlyBurnRate(
      [{ commitment: installment, card }],
      '2026-10'
    );

    expect(result.totalBurnInCents).toBe(0);
    expect(result.installmentBurnInCents).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('aggregates combined subscriptions and installments across multiple cards with record/array lookup', () => {
    const cardNubank = { id: 'card-1', closingDay: 25, dueDay: 2 };
    const cardInter = { id: 'card-2', closingDay: 10, dueDay: 20 };

    const sub: Subscription = {
      type: 'subscription',
      id: 'sub-spotify',
      cardId: 'card-1',
      name: 'Spotify Family',
      amountInCents: 3490,
      billingDay: 12,
      frequency: 'monthly',
      isActive: true,
    };

    const inst: Installment = {
      type: 'installment',
      id: 'inst-laptop',
      cardId: 'card-2',
      name: 'Dell XPS',
      totalAmountInCents: 600000,
      totalInstallments: 6,
      paidInstallments: 0,
      purchaseDate: '2026-05-02', // card-2 closes on 10th, due on 20th. Billed in 2026-05!
      payoffDate: null,
    };

    // Test with Array lookup
    const resultWithArray = calculateMonthlyBurnRate(
      [sub, inst],
      [cardNubank, cardInter],
      '2026-05'
    );

    // sub: billed in 2026-05 (April 26 to May 25, billingDay 12 falls on May 12)
    // inst: installment 1 due 2026-05-20 (100000 cents)
    expect(resultWithArray.totalBurnInCents).toBe(103490);
    expect(resultWithArray.subscriptionBurnInCents).toBe(3490);
    expect(resultWithArray.installmentBurnInCents).toBe(100000);
    expect(resultWithArray.items).toHaveLength(2);

    // Test with Record lookup
    const resultWithRecord = calculateMonthlyBurnRate(
      [sub, inst],
      { 'card-1': cardNubank, 'card-2': cardInter },
      '2026-05'
    );
    expect(resultWithRecord.totalBurnInCents).toBe(103490);

    // Test with Map lookup
    const map = new Map<string, typeof cardNubank>();
    map.set('card-1', cardNubank);
    map.set('card-2', cardInter);
    const resultWithMap = calculateMonthlyBurnRate([sub, inst], map, '2026-05');
    expect(resultWithMap.totalBurnInCents).toBe(103490);
  });

  it('throws descriptive error if a cardId is missing from card lookup', () => {
    const sub: Subscription = {
      type: 'subscription',
      id: 'sub-orphan',
      cardId: 'unknown-card',
      name: 'Mystery',
      amountInCents: 1000,
      billingDay: 5,
      frequency: 'monthly',
      isActive: true,
    };

    expect(() =>
      calculateMonthlyBurnRate([sub], {}, '2026-05')
    ).toThrow('Credit card configuration not found for cardId: unknown-card');
  });

  it('handles yearly subscription frequency (billed only in anniversary month)', () => {
    const card = { closingDay: 25, dueDay: 2 };
    const yearlySub: Subscription = {
      type: 'subscription',
      id: 'sub-annual-domain',
      cardId: 'card-1',
      name: 'Google Domains',
      amountInCents: 12000, // $120.00 / year
      billingDay: 10,
      frequency: 'yearly',
      createdAt: '2025-05-10T00:00:00.000Z', // Anniversary in May
      isActive: true,
    };

    // In 2026-06 (due month June), the May 10 renewal (closed 2026-05-25) is due on 2026-06-02!
    const resultJune = calculateMonthlyBurnRate(
      [{ commitment: yearlySub, card }],
      '2026-06'
    );
    expect(resultJune.totalBurnInCents).toBe(12000);
    expect(resultJune.subscriptionBurnInCents).toBe(12000);
    expect(resultJune.items[0].dueDate).toBe('2026-06-02');

    // In 2026-07 (due month July), yearly sub should NOT be billed
    const resultJuly = calculateMonthlyBurnRate(
      [{ commitment: yearlySub, card }],
      '2026-07'
    );
    expect(resultJuly.totalBurnInCents).toBe(0);
    expect(resultJuly.subscriptionBurnInCents).toBe(0);
  });
});

describe('calculatePayoffCurve', () => {
  const cardNubank = { id: 'card-1', closingDay: 25, dueDay: 2 };
  const cardInter = { id: 'card-2', closingDay: 10, dueDay: 20 };

  it('returns an empty timeline with 0 totals when no commitments exist', () => {
    const forecast = calculatePayoffCurve([], [], {
      startMonth: '2026-06',
      months: 6,
    });

    expect(forecast.startMonth).toBe('2026-06');
    expect(forecast.endMonth).toBe('2026-11');
    expect(forecast.totalInitialDebtInCents).toBe(0);
    expect(forecast.payoffDate).toBeNull();
    expect(forecast.timeline).toHaveLength(6);

    for (const point of forecast.timeline) {
      expect(point.totalBurnInCents).toBe(0);
      expect(point.subscriptionBurnInCents).toBe(0);
      expect(point.installmentBurnInCents).toBe(0);
      expect(point.remainingInstallmentBalanceInCents).toBe(0);
      expect(point.activeInstallmentsCount).toBe(0);
    }
  });

  it('projects constant subscription burn without changing installment debt', () => {
    const sub: Subscription = {
      type: 'subscription',
      id: 'sub-netflix',
      cardId: 'card-1',
      name: 'Netflix',
      amountInCents: 5590,
      billingDay: 15,
      frequency: 'monthly',
      isActive: true,
    };

    const forecast = calculatePayoffCurve([sub], [cardNubank], {
      startMonth: '2026-06',
      months: 3,
    });

    expect(forecast.totalInitialDebtInCents).toBe(0);
    expect(forecast.payoffDate).toBeNull();
    expect(forecast.timeline).toHaveLength(3);
    expect(forecast.timeline[0].month).toBe('2026-06');
    expect(forecast.timeline[0].totalBurnInCents).toBe(5590);
    expect(forecast.timeline[0].subscriptionBurnInCents).toBe(5590);
    expect(forecast.timeline[0].installmentBurnInCents).toBe(0);
    expect(forecast.timeline[0].remainingInstallmentBalanceInCents).toBe(0);
    expect(forecast.timeline[0].activeInstallmentsCount).toBe(0);
  });

  it('projects installment debt reduction and cash flow recovery across months', () => {
    // Card Nubank: closes on 25th, due on 2nd of following month.
    // Purchase 2026-05-10: closes May 25, 1st installment due 2026-06-02.
    // 3 installments of $100 (total 30000 cents):
    // Payment 1: 2026-06-02 (10000 cents)
    // Payment 2: 2026-07-02 (10000 cents)
    // Payment 3: 2026-08-02 (10000 cents) -> payoff date!
    const installment: Installment = {
      type: 'installment',
      id: 'inst-phone',
      cardId: 'card-1',
      name: 'Smartphone',
      totalAmountInCents: 30000,
      totalInstallments: 3,
      paidInstallments: 0,
      purchaseDate: '2026-05-10',
      payoffDate: null,
    };

    const forecast = calculatePayoffCurve([installment], [cardNubank], {
      startMonth: '2026-06',
      months: 4,
    });

    expect(forecast.startMonth).toBe('2026-06');
    expect(forecast.endMonth).toBe('2026-09');
    expect(forecast.totalInitialDebtInCents).toBe(30000);
    expect(forecast.payoffDate).toBe('2026-08-02');
    expect(forecast.timeline).toHaveLength(4);

    // Month 1: 2026-06
    const m1 = forecast.timeline[0];
    expect(m1.month).toBe('2026-06');
    expect(m1.installmentBurnInCents).toBe(10000);
    expect(m1.remainingInstallmentBalanceInCents).toBe(20000);
    expect(m1.activeInstallmentsCount).toBe(1);

    // Month 2: 2026-07
    const m2 = forecast.timeline[1];
    expect(m2.month).toBe('2026-07');
    expect(m2.installmentBurnInCents).toBe(10000);
    expect(m2.remainingInstallmentBalanceInCents).toBe(10000);
    expect(m2.activeInstallmentsCount).toBe(1);

    // Month 3: 2026-08 (Final installment month)
    const m3 = forecast.timeline[2];
    expect(m3.month).toBe('2026-08');
    expect(m3.installmentBurnInCents).toBe(10000);
    expect(m3.remainingInstallmentBalanceInCents).toBe(0);
    expect(m3.activeInstallmentsCount).toBe(1);

    // Month 4: 2026-09 (Post-payoff: cash flow recovered!)
    const m4 = forecast.timeline[3];
    expect(m4.month).toBe('2026-09');
    expect(m4.installmentBurnInCents).toBe(0);
    expect(m4.remainingInstallmentBalanceInCents).toBe(0);
    expect(m4.activeInstallmentsCount).toBe(0);
  });

  it('aggregates multi-card and multi-commitment payoff schedules correctly', () => {
    const sub: Subscription = {
      type: 'subscription',
      id: 'sub-spotify',
      cardId: 'card-1',
      name: 'Spotify',
      amountInCents: 3490,
      billingDay: 1,
      frequency: 'monthly',
      isActive: true,
    };

    const inst1: Installment = {
      type: 'installment',
      id: 'inst-nubank',
      cardId: 'card-1',
      name: 'Item 1',
      totalAmountInCents: 20000,
      totalInstallments: 2,
      paidInstallments: 0,
      purchaseDate: '2026-05-10', // Due 2026-06, 2026-07
      payoffDate: null,
    };

    const inst2: Installment = {
      type: 'installment',
      id: 'inst-inter',
      cardId: 'card-2',
      name: 'Item 2',
      totalAmountInCents: 40000,
      totalInstallments: 4,
      paidInstallments: 0,
      purchaseDate: '2026-05-05', // Closes May 10, due 2026-05, 2026-06, 2026-07, 2026-08
      payoffDate: null,
    };

    const forecast = calculatePayoffCurve(
      [sub, inst1, inst2],
      [cardNubank, cardInter],
      { startMonth: '2026-06', months: 4 }
    );

    // In 2026-06:
    // inst1 due: 10000
    // inst2 due: 10000
    // sub due: 3490
    // totalBurn: 23490
    expect(forecast.timeline[0].month).toBe('2026-06');
    expect(forecast.timeline[0].installmentBurnInCents).toBe(20000);
    expect(forecast.timeline[0].subscriptionBurnInCents).toBe(3490);
    expect(forecast.timeline[0].totalBurnInCents).toBe(23490);
    expect(forecast.timeline[0].activeInstallmentsCount).toBe(2);

    // Latest payoff date is inst2's final payment (2026-08-20)
    expect(forecast.payoffDate).toBe('2026-08-20');
  });
});



