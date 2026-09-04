import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PayoffCurveForecast, MonthlyBurnRate } from '@zerohero/shared';
import { HeroPayoffChart } from '../organisms/HeroPayoffChart';
import { BurnRateBreakdown } from '../organisms/BurnRateBreakdown';

const mockForecast: PayoffCurveForecast = {
  startMonth: '2026-10',
  endMonth: '2027-01',
  totalInitialDebtInCents: 60000,
  payoffDate: '2027-01',
  timeline: [
    {
      month: '2026-10',
      totalBurnInCents: 15000,
      subscriptionBurnInCents: 5000,
      installmentBurnInCents: 10000,
      remainingInstallmentBalanceInCents: 60000,
      activeInstallmentsCount: 3,
    },
    {
      month: '2026-11',
      totalBurnInCents: 15000,
      subscriptionBurnInCents: 5000,
      installmentBurnInCents: 10000,
      remainingInstallmentBalanceInCents: 40000,
      activeInstallmentsCount: 3,
    },
    {
      month: '2026-12',
      totalBurnInCents: 15000,
      subscriptionBurnInCents: 5000,
      installmentBurnInCents: 10000,
      remainingInstallmentBalanceInCents: 20000,
      activeInstallmentsCount: 2,
    },
    {
      month: '2027-01',
      totalBurnInCents: 15000,
      subscriptionBurnInCents: 5000,
      installmentBurnInCents: 10000,
      remainingInstallmentBalanceInCents: 0,
      activeInstallmentsCount: 0,
    },
  ],
};

const mockMonthlyBurnRate: MonthlyBurnRate = {
  targetMonth: '2026-10',
  totalBurnInCents: 14990,
  subscriptionBurnInCents: 4990,
  installmentBurnInCents: 10000,
  items: [
    {
      commitmentId: 'sub-1',
      name: 'Netflix 4K',
      type: 'subscription',
      amountInCents: 2290,
      dueDate: '2026-10-15',
    },
    {
      commitmentId: 'sub-2',
      name: 'Spotify Family',
      type: 'subscription',
      amountInCents: 2700,
      dueDate: '2026-10-18',
    },
    {
      commitmentId: 'inst-1',
      name: 'MacBook Pro 16',
      type: 'installment',
      amountInCents: 10000,
      dueDate: '2026-10-25',
    },
  ],
};

describe('HeroPayoffChart organism', () => {
  it('renders SVG with cubic Bézier curve path and gradient area fill', () => {
    const html = renderToStaticMarkup(
      <HeroPayoffChart data={mockForecast} selectedCycle="2026-10" />
    );

    // Should contain SVG element
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 800 320"');

    // Should contain cubic Bézier path commands
    expect(html).toContain('stroke="#06b6d4"');
    expect(html).toContain('fill="none"');

    // Should render gradient definition
    expect(html).toContain('<linearGradient');

    // Should display Zero Debt Milestone flag
    expect(html).toContain('★ ZERO DEBT');
    expect(html).toContain('Zero Debt Target:');
    expect(html).toContain('January 2027');
  });

  it('renders empty state when timeline is empty', () => {
    const emptyData: PayoffCurveForecast = {
      startMonth: '2026-10',
      endMonth: '2026-10',
      totalInitialDebtInCents: 0,
      payoffDate: null,
      timeline: [],
    };

    const html = renderToStaticMarkup(
      <HeroPayoffChart data={emptyData} selectedCycle="2026-10" />
    );

    expect(html).toContain('No installment commitments recorded');
    expect(html).not.toContain('viewBox="0 0 800 320"');
    expect(html).not.toContain('stroke-width="3"');
  });

  it('renders loading overlay when isLoading is true', () => {
    const html = renderToStaticMarkup(
      <HeroPayoffChart data={mockForecast} selectedCycle="2026-10" isLoading={true} />
    );

    expect(html).toContain('Calculating payoff projection...');
  });
});

describe('BurnRateBreakdown organism', () => {
  it('renders categorized outflow distribution bar and amounts', () => {
    const html = renderToStaticMarkup(
      <BurnRateBreakdown forecast={mockMonthlyBurnRate} selectedCycle="2026-10" />
    );

    expect(html).toContain('Cycle Outflow Breakdown');
    expect(html).toContain('$149.90'); // total
    expect(html).toContain('Subscriptions:');
    expect(html).toContain('Installments:');
    expect(html).toContain('Day');
    expect(html).toContain('elapsed');

    // Should render items ledger
    expect(html).toContain('Netflix 4K');
    expect(html).toContain('Spotify Family');
    expect(html).toContain('MacBook Pro 16');
    expect(html).toContain('Due 2026-10-15');
    expect(html).toContain('Due 2026-10-25');
  });

  it('renders empty ledger state when items array is empty', () => {
    const emptyBurnRate: MonthlyBurnRate = {
      targetMonth: '2026-10',
      totalBurnInCents: 0,
      subscriptionBurnInCents: 0,
      installmentBurnInCents: 0,
      items: [],
    };

    const html = renderToStaticMarkup(
      <BurnRateBreakdown forecast={emptyBurnRate} selectedCycle="2026-10" />
    );

    expect(html).toContain('No active commitments due in October 2026');
  });
});
