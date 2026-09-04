import React, { useState, useRef, useCallback, useId } from 'react';
import type { PayoffCurveForecast, PayoffCurvePoint } from '@zerohero/shared';
import { tokens } from '../tokens';
import { formatCentsToCurrency } from '../atoms/StatValue';
import { formatCycleLabel } from '../molecules/PeriodNavigator';
import {
  scaleCurvePoints,
  generateCubicBezierPath,
  generateAreaFillPath,
  findMilestoneIndex,
  generateYAxisTicks,
  DEFAULT_BOUNDS,
  type ScaledPoint,
} from '../utils/svg-curve';
import { TrendingDownIcon, CheckIcon, CalendarIcon } from '../icons';

export interface HeroPayoffChartProps {
  data: PayoffCurveForecast | null;
  selectedCycle: string;
  onSelectCycle?: (cycleId: string) => void;
  isLoading?: boolean;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function HeroPayoffChart({
  data,
  selectedCycle,
  onSelectCycle,
  isLoading = false,
  height = 340,
  className,
  style,
}: HeroPayoffChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartId = useId();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const timeline = data?.timeline ?? [];
  const bounds = DEFAULT_BOUNDS;

  const { scaled, maxBalance, baselineY } = scaleCurvePoints(timeline, bounds);
  const milestoneIndex = findMilestoneIndex(timeline, data?.payoffDate);
  const milestonePoint = milestoneIndex !== -1 ? scaled[milestoneIndex] : null;

  // Identify currently selected cycle point
  const selectedIndex = scaled.findIndex((sp) => sp.point.month === selectedCycle);
  const selectedPoint = selectedIndex !== -1 ? scaled[selectedIndex] : null;

  // Active point for tooltip is hovered point, or selected point if not hovering
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex !== -1 ? selectedIndex : null;
  const activePoint = activeIndex !== null ? scaled[activeIndex] : null;

  const linePath = generateCubicBezierPath(scaled, baselineY);
  const areaPath = generateAreaFillPath(scaled, baselineY);
  const yTicks = generateYAxisTicks(maxBalance, 4);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!svgRef.current || scaled.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const normalizedX = (clientX / rect.width) * bounds.width;

      // Find closest scaled point along x-axis
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < scaled.length; i++) {
        const diff = Math.abs(scaled[i].x - normalizedX);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      setHoveredIndex(closestIdx);
    },
    [scaled, bounds.width]
  );

  const handlePointerLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredIndex !== null && scaled[hoveredIndex] && onSelectCycle) {
      onSelectCycle(scaled[hoveredIndex].point.month);
    }
  }, [hoveredIndex, scaled, onSelectCycle]);

  const gradientId = `chart-grad-${chartId}`;
  const glowFilterId = `chart-glow-${chartId}`;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: tokens.colors.surfaceCard,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.borderSubtle}`,
        padding: '1.5rem',
        boxShadow: tokens.shadows.card,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Chart Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: tokens.radii.md,
                backgroundColor: tokens.colors.accentCyanGlow,
                color: tokens.colors.accentCyan,
              }}
            >
              <TrendingDownIcon size={16} color={tokens.colors.accentCyan} />
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: tokens.typography.weights.semibold,
                color: tokens.colors.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              Debt Payoff Curve Forecast
            </h3>
          </div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.8125rem',
              color: tokens.colors.textSecondary,
            }}
          >
            Multi-month projected remaining installment principal & zero-debt trajectory
          </p>
        </div>

        {/* Milestone Indicator Badge */}
        {milestonePoint && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: tokens.colors.accentEmeraldGlow,
              border: `1px solid ${tokens.colors.accentEmerald}`,
              borderRadius: tokens.radii.full,
              fontSize: '0.8125rem',
              color: tokens.colors.accentEmerald,
              fontWeight: tokens.typography.weights.medium,
            }}
          >
            <CheckIcon size={14} color={tokens.colors.accentEmerald} />
            <span>
              Zero Debt Target: <strong>{formatCycleLabel(milestonePoint.point.month)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(9, 10, 15, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            borderRadius: tokens.radii.lg,
          }}
        >
          <div style={{ color: tokens.colors.accentCyan, fontSize: '0.875rem' }}>
            Calculating payoff projection...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && timeline.length === 0 && (
        <div
          style={{
            height,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.colors.textMuted,
            gap: '8px',
          }}
        >
          <CalendarIcon size={32} color={tokens.colors.textMuted} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No installment commitments recorded</p>
        </div>
      )}

      {/* SVG Canvas */}
      {timeline.length > 0 && (
        <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${bounds.width} ${bounds.height}`}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: height,
              display: 'block',
              overflow: 'visible',
              cursor: onSelectCycle ? 'pointer' : 'default',
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
          >
            <defs>
              {/* Curve Area Gradient Fill */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.colors.chart.gradientStart} />
                <stop offset="100%" stopColor={tokens.colors.chart.gradientEnd} />
              </linearGradient>

              {/* Glowing Filter for Curve Stroke */}
              <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((cents) => {
              const ratio = cents / (maxBalance * 1.1);
              const y = baselineY - ratio * (baselineY - bounds.paddingTop);
              if (y < bounds.paddingTop - 5) return null;

              return (
                <g key={cents} className="tabular-nums">
                  <line
                    x1={bounds.paddingLeft}
                    y1={y}
                    x2={bounds.width - bounds.paddingRight}
                    y2={y}
                    stroke={tokens.colors.chart.gridLine}
                    strokeDasharray={cents === 0 ? undefined : '3 3'}
                    strokeWidth={cents === 0 ? 1.5 : 1}
                  />
                  <text
                    x={bounds.paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill={tokens.colors.textMuted}
                    fontSize="11"
                    fontFamily={tokens.typography.fontFamilySans}
                  >
                    {formatCentsToCurrency(cents).split('.')[0]}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                style={{ transition: 'all 0.3s ease' }}
              />
            )}

            {/* Cubic Bézier Stroke Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={tokens.colors.chart.curveLine}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowFilterId})`}
              />
            )}

            {/* Zero-Debt Milestone Pin */}
            {milestonePoint && (
              <g>
                {/* Vertical Milestone Guideline */}
                <line
                  x1={milestonePoint.x}
                  y1={bounds.paddingTop}
                  x2={milestonePoint.x}
                  y2={baselineY}
                  stroke={tokens.colors.chart.milestonePin}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.75"
                />
                {/* Milestone Pin Target */}
                <circle
                  cx={milestonePoint.x}
                  cy={milestonePoint.y}
                  r="7"
                  fill={tokens.colors.chart.milestonePin}
                  stroke={tokens.colors.bgPrimary}
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))',
                  }}
                />
                <circle
                  cx={milestonePoint.x}
                  cy={milestonePoint.y}
                  r="3"
                  fill="#ffffff"
                />
                {/* Milestone Tag Flag */}
                <g transform={`translate(${milestonePoint.x}, ${bounds.paddingTop - 12})`}>
                  <rect
                    x="-44"
                    y="-12"
                    width="88"
                    height="18"
                    rx="9"
                    fill={tokens.colors.accentEmerald}
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#090a0f"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily={tokens.typography.fontFamilySans}
                  >
                    ★ ZERO DEBT
                  </text>
                </g>
              </g>
            )}

            {/* Selected Cycle Indicator (if not currently hovered) */}
            {selectedPoint && hoveredIndex === null && (
              <g>
                <line
                  x1={selectedPoint.x}
                  y1={bounds.paddingTop}
                  x2={selectedPoint.x}
                  y2={baselineY}
                  stroke={tokens.colors.accentCyan}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
                <circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  r="5"
                  fill={tokens.colors.accentCyan}
                  stroke={tokens.colors.bgPrimary}
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Hover Scrubber Line & Active Dot */}
            {activePoint && (
              <g style={{ pointerEvents: 'none' }}>
                <line
                  x1={activePoint.x}
                  y1={bounds.paddingTop}
                  x2={activePoint.x}
                  y2={baselineY}
                  stroke={tokens.colors.chart.scrubberLine}
                  strokeWidth="1.5"
                  opacity="0.9"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="8"
                  fill={tokens.colors.accentCyan}
                  stroke={tokens.colors.textPrimary}
                  strokeWidth="2.5"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))',
                  }}
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="3.5"
                  fill={tokens.colors.bgPrimary}
                />
              </g>
            )}

            {/* X-Axis Month Labels */}
            {scaled.map((sp, idx) => {
              // On dense datasets, thin out labels if there are more than 12 points
              if (scaled.length > 12 && idx % 2 !== 0 && idx !== scaled.length - 1) {
                return null;
              }

              const isSelected = sp.point.month === selectedCycle;
              const [year, month] = sp.point.month.split('-');
              const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ];
              const monthIdx = parseInt(month, 10) - 1;
              const label = `${monthNames[monthIdx]} '${year.slice(2)}`;

              return (
                <text
                  key={sp.point.month}
                  x={sp.x}
                  y={baselineY + 22}
                  textAnchor="middle"
                  fill={isSelected ? tokens.colors.accentCyan : tokens.colors.textSecondary}
                  fontWeight={isSelected ? '600' : '400'}
                  fontSize="11"
                  fontFamily={tokens.typography.fontFamilySans}
                  style={{ cursor: 'pointer' }}
                >
                  {label}
                </text>
              );
            })}
          </svg>

          {/* Floating Tooltip Card */}
          {activePoint && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: `${Math.min(
                  Math.max((activePoint.x / bounds.width) * 100, 15),
                  85
                )}%`,
                transform: 'translateX(-50%)',
                backgroundColor: tokens.colors.chart.tooltipBg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${tokens.colors.borderMedium}`,
                borderRadius: tokens.radii.md,
                padding: '10px 14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                pointerEvents: 'none',
                zIndex: 15,
                minWidth: '190px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                  borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
                  paddingBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: tokens.typography.weights.semibold,
                    color: tokens.colors.textPrimary,
                  }}
                >
                  {formatCycleLabel(activePoint.point.month)}
                </span>
                {activePoint.point.month === selectedCycle && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: tokens.colors.accentCyan,
                      backgroundColor: tokens.colors.accentCyanGlow,
                      padding: '2px 6px',
                      borderRadius: tokens.radii.xs,
                      fontWeight: tokens.typography.weights.medium,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: tokens.colors.textSecondary }}>Remaining Debt:</span>
                  <strong
                    className="tabular-nums"
                    style={{
                      color:
                        activePoint.point.remainingInstallmentBalanceInCents === 0
                          ? tokens.colors.accentEmerald
                          : tokens.colors.accentCyan,
                    }}
                  >
                    {formatCentsToCurrency(activePoint.point.remainingInstallmentBalanceInCents)}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: tokens.colors.textSecondary }}>Monthly Burn:</span>
                  <strong className="tabular-nums" style={{ color: tokens.colors.textPrimary }}>
                    {formatCentsToCurrency(activePoint.point.totalBurnInCents)}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.6875rem',
                    color: tokens.colors.textMuted,
                    paddingTop: '2px',
                  }}
                >
                  <span>
                    Sub: {formatCentsToCurrency(activePoint.point.subscriptionBurnInCents)}
                  </span>
                  <span>
                    Inst: {formatCentsToCurrency(activePoint.point.installmentBurnInCents)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
