import { describe, it, expect } from 'vitest';
import { tokens, colors, radii, spacing, typography } from '../tokens';
import { formatCentsToCurrency } from '../atoms/StatValue';
import { formatCycleLabel, shiftCycleId } from '../molecules/PeriodNavigator';
import { api } from '../../api/client';

describe('Design System Tokens SST', () => {
  it('defines the core dark slate surface palette and command center accents', () => {
    expect(colors.bgPrimary).toBe('#090a0f');
    expect(colors.surfaceCard).toBe('#12141d');
    expect(colors.surfaceElevated).toBe('#1a1d29');
    expect(colors.accentEmerald).toBe('#10b981');
    expect(colors.accentCyan).toBe('#06b6d4');
    expect(colors.accentIndigo).toBe('#6366f1');
    expect(colors.accentRose).toBe('#f43f5e');
  });

  it('defines chart visualization constants', () => {
    expect(tokens.colors.chart.curveLine).toBe('#06b6d4');
    expect(tokens.colors.chart.milestonePin).toBe('#10b981');
    expect(tokens.colors.chart.gridLine).toBe('#1e2235');
  });

  it('exports valid typography tokens and tabular-nums utility', () => {
    expect(typography.tabularNums).toBe('tabular-nums');
    expect(typography.fontFamilySans).toContain('Inter');
  });
});

describe('StatValue currency formatting', () => {
  it('formats integer cents to USD currency string correctly', () => {
    expect(formatCentsToCurrency(0)).toBe('$0.00');
    expect(formatCentsToCurrency(14990)).toBe('$149.90');
    expect(formatCentsToCurrency(100000)).toBe('$1,000.00');
    expect(formatCentsToCurrency(12345678)).toBe('$123,456.78');
  });
});

describe('PeriodNavigator cycle calculation', () => {
  it('formats cycle IDs into localized readable month names', () => {
    expect(formatCycleLabel('2026-10')).toBe('October 2026');
    expect(formatCycleLabel('2027-01')).toBe('January 2027');
  });

  it('shifts cycle months correctly across calendar boundaries', () => {
    expect(shiftCycleId('2026-10', 1)).toBe('2026-11');
    expect(shiftCycleId('2026-10', -1)).toBe('2026-09');
    expect(shiftCycleId('2026-12', 1)).toBe('2027-01');
    expect(shiftCycleId('2027-01', -1)).toBe('2026-12');
  });
});

describe('Typed API client contracts', () => {
  it('exposes all required CRUD and forecast methods', () => {
    expect(typeof api.getHealth).toBe('function');
    expect(typeof api.getCards).toBe('function');
    expect(typeof api.createCard).toBe('function');
    expect(typeof api.getCommitments).toBe('function');
    expect(typeof api.createCommitment).toBe('function');
    expect(typeof api.getForecast).toBe('function');
    expect(typeof api.getPayoffCurve).toBe('function');
  });
});
