import type { PayoffCurvePoint } from '@zerohero/shared';

export interface Point {
  x: number;
  y: number;
}

export interface ChartBounds {
  width: number;
  height: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export interface ScaledPoint extends Point {
  point: PayoffCurvePoint;
  index: number;
}

export const DEFAULT_BOUNDS: ChartBounds = {
  width: 800,
  height: 320,
  paddingTop: 30,
  paddingBottom: 45,
  paddingLeft: 65,
  paddingRight: 35,
};

/**
 * Projects an array of timeline points onto SVG 2D coordinate space.
 */
export function scaleCurvePoints(
  points: PayoffCurvePoint[],
  bounds: ChartBounds = DEFAULT_BOUNDS,
  explicitMaxCents?: number
): { scaled: ScaledPoint[]; maxY: number; minY: number; maxBalance: number; baselineY: number } {
  const { width, height, paddingTop, paddingBottom, paddingLeft, paddingRight } = bounds;
  const baselineY = height - paddingBottom;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = baselineY - paddingTop;

  if (!points || points.length === 0) {
    return { scaled: [], maxY: paddingTop, minY: baselineY, maxBalance: 0, baselineY };
  }

  const rawMax = Math.max(...points.map((p) => p.remainingInstallmentBalanceInCents), 0);
  const maxBalance = explicitMaxCents && explicitMaxCents > rawMax ? explicitMaxCents : Math.max(rawMax, 1000);

  // Add 10% headroom above highest value for visual breathing room
  const ceiling = maxBalance * 1.1;

  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const scaled: ScaledPoint[] = points.map((point, index) => {
    const x = points.length === 1 ? paddingLeft + plotWidth / 2 : paddingLeft + index * stepX;
    const ratio = Math.max(0, point.remainingInstallmentBalanceInCents) / ceiling;
    const y = baselineY - ratio * plotHeight;

    return {
      x,
      y,
      point,
      index,
    };
  });

  return {
    scaled,
    maxY: paddingTop,
    minY: baselineY,
    maxBalance,
    baselineY,
  };
}

/**
 * Generates a smooth cubic Bézier path (M ... C ...) through the given coordinate points
 * using Catmull-Rom spline to cubic Bézier control points conversion.
 */
export function generateCubicBezierPath(points: Point[], baselineY?: number): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)},${points[1].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom tangent tension (1/6 standard)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Clamp control points to not exceed baseline (prevent dipping below zero-debt line)
    if (baselineY !== undefined) {
      if (cp1y > baselineY) cp1y = baselineY;
      if (cp2y > baselineY) cp2y = baselineY;
    }

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return path;
}

/**
 * Generates a closed area fill path that matches the cubic Bézier top curve and closes
 * horizontally along the baseline.
 */
export function generateAreaFillPath(points: Point[], baselineY: number): string {
  if (!points || points.length === 0) return '';
  const linePath = generateCubicBezierPath(points, baselineY);
  const firstX = points[0].x.toFixed(2);
  const lastX = points[points.length - 1].x.toFixed(2);
  const base = baselineY.toFixed(2);

  return `${linePath} L ${lastX},${base} L ${firstX},${base} Z`;
}

/**
 * Finds the index of the first zero-debt milestone in the timeline.
 */
export function findMilestoneIndex(
  points: PayoffCurvePoint[],
  payoffDate?: string | null
): number {
  if (!points || points.length === 0) return -1;

  if (payoffDate) {
    const idx = points.findIndex((p) => p.month === payoffDate);
    if (idx !== -1) return idx;
  }

  // Look for first point where remaining installment balance reaches zero
  return points.findIndex((p) => p.remainingInstallmentBalanceInCents === 0);
}

/**
 * Generates round, readable Y-axis tick values in cents.
 */
export function generateYAxisTicks(maxCents: number, count = 4): number[] {
  if (maxCents <= 0) return [0];

  const ceiling = maxCents * 1.1;
  const rawStep = ceiling / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceFactor = 1;
  if (normalized > 5) niceFactor = 10;
  else if (normalized > 2) niceFactor = 5;
  else if (normalized > 1) niceFactor = 2;

  const step = Math.max(niceFactor * magnitude, 1000);
  const ticks: number[] = [];

  for (let val = 0; val <= ceiling; val += step) {
    ticks.push(Math.round(val));
    if (ticks.length > count + 2) break;
  }

  return ticks;
}
