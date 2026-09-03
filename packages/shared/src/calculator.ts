import type { StatementPeriod } from './statement-period.js';
import type { Installment, Commitment } from './commitment.js';

export interface CardBillingConfig {
  closingDay: number;
  dueDay: number;
}

export interface ScheduledPayment {
  installmentNumber: number;
  cycleId: string;
  dueDate: string;
  amountInCents: number;
  isPaid: boolean;
}

export interface PayoffSchedule {
  totalAmountInCents: number;
  remainingAmountInCents: number;
  payoffDate: string;
  payments: ScheduledPayment[];
}

export interface MonthlyBurnRateItem {
  commitmentId?: string;
  name: string;
  type: 'subscription' | 'installment';
  amountInCents: number;
  dueDate: string;
}

export interface MonthlyBurnRate {
  targetMonth: string; // "YYYY-MM"
  totalBurnInCents: number;
  subscriptionBurnInCents: number;
  installmentBurnInCents: number;
  items: MonthlyBurnRateItem[];
}

export type CardLookup =
  | Record<string, CardBillingConfig>
  | Map<string, CardBillingConfig>
  | Array<CardBillingConfig & { id?: string }>;

export function getStatementPeriodForCycle(
  card: CardBillingConfig,
  cycleId: string
): StatementPeriod {
  const [dueYear, dueMonth] = parseDate(`${cycleId}-01`);

  let closingYear = dueYear;
  let closingMonth = dueMonth;
  if (card.dueDay <= card.closingDay) {
    [closingYear, closingMonth] = shiftMonth(dueYear, dueMonth, -1);
  }

  const effectiveClosingDay = Math.min(card.closingDay, getDaysInMonth(closingYear, closingMonth));
  const closingDate = formatDate(closingYear, closingMonth, effectiveClosingDay);

  const [prevYear, prevMonth] = shiftMonth(closingYear, closingMonth, -1);
  const prevClosingDay = Math.min(card.closingDay, getDaysInMonth(prevYear, prevMonth));
  const prevClosingDate = formatDate(prevYear, prevMonth, prevClosingDay);
  const startDate = addDays(prevClosingDate, 1);

  const effectiveDueDay = Math.min(card.dueDay, getDaysInMonth(dueYear, dueMonth));
  const dueDate = formatDate(dueYear, dueMonth, effectiveDueDay);

  return {
    cycleId,
    startDate,
    closingDate,
    dueDate,
  };
}

export function calculateMonthlyBurnRate(
  commitmentsOrItems:
    | Array<{ commitment: Commitment; card: CardBillingConfig }>
    | Commitment[],
  cardsOrTargetMonth: CardLookup | string,
  targetMonthArg?: string
): MonthlyBurnRate {
  let itemsToProcess: Array<{ commitment: Commitment; card: CardBillingConfig }>;
  let targetMonth: string;

  if (typeof cardsOrTargetMonth === 'string') {
    itemsToProcess = commitmentsOrItems as Array<{ commitment: Commitment; card: CardBillingConfig }>;
    targetMonth = cardsOrTargetMonth;
  } else {
    const commitments = commitmentsOrItems as Commitment[];
    const cards = cardsOrTargetMonth;
    targetMonth = targetMonthArg!;

    itemsToProcess = commitments.map((commitment) => {
      let card: CardBillingConfig | undefined;
      if (cards instanceof Map) {
        card = cards.get(commitment.cardId);
      } else if (Array.isArray(cards)) {
        card = cards.find((c) => c.id === commitment.cardId);
      } else {
        card = cards[commitment.cardId];
      }
      if (!card) {
        throw new Error(`Credit card configuration not found for cardId: ${commitment.cardId}`);
      }
      return { commitment, card };
    });
  }

  const burnRateItems: MonthlyBurnRateItem[] = [];
  let subscriptionBurnInCents = 0;
  let installmentBurnInCents = 0;

  for (const { commitment, card } of itemsToProcess) {
    const period = getStatementPeriodForCycle(card, targetMonth);

    if (commitment.type === 'subscription') {
      if (!commitment.isActive) {
        continue;
      }

      // Candidate renewal months that could fall in this period
      const [startYear, startMonth] = parseDate(period.startDate);
      const [closeYear, closeMonth] = parseDate(period.closingDate);

      const candidateMonths: Array<[number, number]> = [[startYear, startMonth]];
      if (startYear !== closeYear || startMonth !== closeMonth) {
        candidateMonths.push([closeYear, closeMonth]);
      }

      let isBilledInCycle = false;
      for (const [y, m] of candidateMonths) {
        if (commitment.frequency === 'yearly') {
          const createdMonth = commitment.createdAt
            ? parseDate(commitment.createdAt)[1]
            : 1;
          if (m !== createdMonth) {
            continue;
          }
        }

        const billingDay = Math.min(commitment.billingDay, getDaysInMonth(y, m));
        const renewalDate = formatDate(y, m, billingDay);

        if (renewalDate >= period.startDate && renewalDate < period.closingDate) {
          isBilledInCycle = true;
          break;
        }
      }

      if (isBilledInCycle) {
        subscriptionBurnInCents += commitment.amountInCents;
        burnRateItems.push({
          commitmentId: commitment.id,
          name: commitment.name,
          type: 'subscription',
          amountInCents: commitment.amountInCents,
          dueDate: period.dueDate,
        });
      }
    } else if (commitment.type === 'installment') {
      const schedule = calculatePayoffSchedule(commitment, card);
      const payment = schedule.payments.find(
        (p) => p.cycleId === targetMonth && !p.isPaid
      );

      if (payment) {
        installmentBurnInCents += payment.amountInCents;
        burnRateItems.push({
          commitmentId: commitment.id,
          name: commitment.name,
          type: 'installment',
          amountInCents: payment.amountInCents,
          dueDate: payment.dueDate,
        });
      }
    }
  }

  const totalBurnInCents = subscriptionBurnInCents + installmentBurnInCents;

  return {
    targetMonth,
    totalBurnInCents,
    subscriptionBurnInCents,
    installmentBurnInCents,
    items: burnRateItems,
  };
}

export function calculatePayoffSchedule(
  installment: Installment,
  card: CardBillingConfig
): PayoffSchedule {
  const firstPeriod = calculateStatementPeriod(card, installment.purchaseDate);
  const [firstDueYear, firstDueMonth] = parseDate(firstPeriod.dueDate);

  const baseAmount = Math.floor(installment.totalAmountInCents / installment.totalInstallments);
  const remainder = installment.totalAmountInCents % installment.totalInstallments;

  const payments: ScheduledPayment[] = [];
  let remainingAmountInCents = 0;

  for (let i = 1; i <= installment.totalInstallments; i++) {
    const step = i - 1;
    const [dueYear, dueMonth] = shiftMonth(firstDueYear, firstDueMonth, step);
    const effectiveDueDay = Math.min(card.dueDay, getDaysInMonth(dueYear, dueMonth));
    const dueDate = formatDate(dueYear, dueMonth, effectiveDueDay);
    const cycleId = `${dueYear}-${pad2(dueMonth)}`;

    const amountInCents = i === 1 ? baseAmount + remainder : baseAmount;
    const isPaid = i <= (installment.paidInstallments ?? 0);

    if (!isPaid) {
      remainingAmountInCents += amountInCents;
    }

    payments.push({
      installmentNumber: i,
      cycleId,
      dueDate,
      amountInCents,
      isPaid,
    });
  }

  const payoffDate = payments[payments.length - 1].dueDate;

  return {
    totalAmountInCents: installment.totalAmountInCents,
    remainingAmountInCents,
    payoffDate,
    payments,
  };
}

function parseDate(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function shiftMonth(year: number, month: number, offset: number): [number, number] {
  let m = month - 1 + offset;
  let y = year + Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;
  return [y, m + 1];
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = parseDate(iso);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function calculateStatementPeriod(
  card: CardBillingConfig,
  purchaseDate: string
): StatementPeriod {
  const [pYear, pMonth, pDay] = parseDate(purchaseDate);

  // Closing date candidate in the purchase month
  const candidateClosingDay = Math.min(card.closingDay, getDaysInMonth(pYear, pMonth));
  const candidateClosingDate = formatDate(pYear, pMonth, candidateClosingDay);

  let closingYear = pYear;
  let closingMonth = pMonth;

  if (purchaseDate >= candidateClosingDate) {
    [closingYear, closingMonth] = shiftMonth(pYear, pMonth, 1);
  }

  const effectiveClosingDay = Math.min(card.closingDay, getDaysInMonth(closingYear, closingMonth));
  const closingDate = formatDate(closingYear, closingMonth, effectiveClosingDay);

  // Prior closing date
  const [prevYear, prevMonth] = shiftMonth(closingYear, closingMonth, -1);
  const prevClosingDay = Math.min(card.closingDay, getDaysInMonth(prevYear, prevMonth));
  const prevClosingDate = formatDate(prevYear, prevMonth, prevClosingDay);
  const startDate = addDays(prevClosingDate, 1);

  // Due date calculation per ADR-0002
  let dueYear = closingYear;
  let dueMonth = closingMonth;
  if (card.dueDay <= card.closingDay) {
    [dueYear, dueMonth] = shiftMonth(closingYear, closingMonth, 1);
  }

  const effectiveDueDay = Math.min(card.dueDay, getDaysInMonth(dueYear, dueMonth));
  const dueDate = formatDate(dueYear, dueMonth, effectiveDueDay);
  const cycleId = `${dueYear}-${pad2(dueMonth)}`;

  return {
    cycleId,
    startDate,
    closingDate,
    dueDate,
  };
}
