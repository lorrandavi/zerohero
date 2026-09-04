import { describe, it, expect } from 'vitest';
import type { PayoffCurvePoint } from '@zerohero/shared';
import {
  scaleCurvePoints,
  generateCubicBezierPath,
  generateAreaFillPath,
  findMilestoneIndex,
  generateYAxisTicks,
  DEFAULT_BOUNDS,
} from '../utils/svg-curve';

const mockTimeline: PayoffCurvePoint[] = [
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
];

describe('scaleCurvePoints', () => {
  it('returns safe fallback values when points array is empty', () => {
    const res = scaleCurvePoints([]);
    expect(res.scaled).toEqual([]);
    expect(res.maxBalance).toBe(0);
    expect(res.baselineY).toBe(DEFAULT_BOUNDS.height - DEFAULT_BOUNDS.paddingBottom);
  });

  it('correctly maps coordinates into SVG bounds', () => {
    const res = scaleCurvePoints(mockTimeline, DEFAULT_BOUNDS);
    expect(res.scaled).toHaveLength(4);

    // First point should be at left padding
    expect(res.scaled[0].x).toBe(DEFAULT_BOUNDS.paddingLeft);

    // Last point should be at right bound
    const expectedRightX = DEFAULT_BOUNDS.width - DEFAULT_BOUNDS.paddingRight;
    expect(res.scaled[3].x).toBeCloseTo(expectedRightX);

    // Last point with 0 balance should sit exactly at baseline
    expect(res.scaled[3].y).toBeCloseTo(res.baselineY);

    // First point with highest balance should be near top (with 10% ceiling headroom)
    expect(res.scaled[0].y).toBeLessThan(res.scaled[1].y);
    expect(res.scaled[1].y).toBeLessThan(res.scaled[2].y);
    expect(res.scaled[2].y).toBeLessThan(res.scaled[3].y);
  });
});

describe('generateCubicBezierPath', () => {
  it('handles empty and single-point arrays gracefully', () => {
    expect(generateCubicBezierPath([])).toBe('');
    expect(generateCubicBezierPath([{ x: 10, y: 20 }])).toBe('M 10.00,20.00');
  });

  it('renders a straight line for two points', () => {
    const path = generateCubicBezierPath([
      { x: 10, y: 20 },
      { x: 50, y: 80 },
    ]);
    expect(path).toBe('M 10.00,20.00 L 50.00,80.00');
  });

  it('generates smooth cubic Bézier commands for 3+ points', () => {
    const points = [
      { x: 10, y: 100 },
      { x: 50, y: 50 },
      { x: 90, y: 20 },
      { x: 130, y: 0 },
    ];
    const path = generateCubicBezierPath(points, 100);
    expect(path).toContain('M 10.00,100.00');
    expect(path).toContain(' C ');
    // Should have 3 cubic Bézier segments
    const segments = path.split(' C ');
    expect(segments.length).toBe(4);
  });
});

describe('generateAreaFillPath', () => {
  it('creates closed SVG path ending with baseline closure Z', () => {
    const points = [
      { x: 65, y: 100 },
      { x: 200, y: 150 },
      { x: 350, y: 250 },
    ];
    const baselineY = 275;
    const areaPath = generateAreaFillPath(points, baselineY);

    expect(areaPath.startsWith('M 65.00,100.00')).toBe(true);
    expect(areaPath.endsWith('L 350.00,275.00 L 65.00,275.00 Z')).toBe(true);
  });
});

describe('findMilestoneIndex', () => {
  it('identifies milestone by explicit payoffDate', () => {
    const idx = findMilestoneIndex(mockTimeline, '2027-01');
    expect(idx).toBe(3);
  });

  it('identifies milestone when remaining debt reaches zero', () => {
    const idx = findMilestoneIndex(mockTimeline);
    expect(idx).toBe(3);
  });

  it('returns -1 if debt is never zero and payoffDate is null', () => {
    const activeTimeline = mockTimeline.slice(0, 3);
    const idx = findMilestoneIndex(activeTimeline, null);
    expect(idx).toBe(-1);
  });
});

describe('generateYAxisTicks', () => {
  it('generates sensible rounded ticks for dollar amounts', () => {
    const ticks = generateYAxisTicks(60000, 4);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks[0]).toBe(0);
    expect(ticks.every((t) => t >= 0)).toBe(true);
  });
});
