import React from 'react';
import type { MonthlyBurnRate } from '@zerohero/shared';
import { tokens } from '../tokens';
import { formatCentsToCurrency } from '../atoms/StatValue';
import { Badge } from '../atoms/Badge';
import { formatCycleLabel } from '../molecules/PeriodNavigator';
import { SubscriptionIcon, InstallmentIcon, CalendarIcon } from '../icons';

export interface BurnRateBreakdownProps {
  forecast: MonthlyBurnRate | null;
  selectedCycle: string;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function BurnRateBreakdown({
  forecast,
  selectedCycle,
  isLoading = false,
  className,
  style,
}: BurnRateBreakdownProps) {
  const totalBurn = forecast?.totalBurnInCents ?? 0;
  const subBurn = forecast?.subscriptionBurnInCents ?? 0;
  const instBurn = forecast?.installmentBurnInCents ?? 0;
  const items = forecast?.items ?? [];

  const subPercent = totalBurn > 0 ? Math.round((subBurn / totalBurn) * 100) : 0;
  const instPercent = totalBurn > 0 ? 100 - subPercent : 0;

  // Compute month calendar progress
  const [yearStr, monthStr] = selectedCycle.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 10;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Reference date: current day of month clamped to month
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
  const cycleElapsedPercent = Math.min(100, Math.round((currentDay / daysInMonth) * 100));

  return (
    <div
      className={className}
      style={{
        backgroundColor: tokens.colors.surfaceCard,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.borderSubtle}`,
        padding: '1.5rem',
        boxShadow: tokens.shadows.card,
        position: 'relative',
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: tokens.typography.weights.semibold,
              color: tokens.colors.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            Cycle Outflow Breakdown
          </h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.8125rem',
              color: tokens.colors.textSecondary,
            }}
          >
            Categorized distribution for {formatCycleLabel(selectedCycle)}
          </p>
        </div>

        <Badge variant="cyan" size="sm">
          {formatCentsToCurrency(totalBurn)} due
        </Badge>
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
            zIndex: 10,
            borderRadius: tokens.radii.lg,
          }}
        >
          <span style={{ color: tokens.colors.accentCyan, fontSize: '0.875rem' }}>
            Updating cycle breakdown...
          </span>
        </div>
      )}

      {/* Distribution Ratio Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            marginBottom: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: tokens.colors.chart.subscriptionBar,
              }}
            />
            <span style={{ color: tokens.colors.textSecondary }}>
              Subscriptions: <strong>{subPercent}%</strong> ({formatCentsToCurrency(subBurn)})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: tokens.colors.chart.installmentBar,
              }}
            />
            <span style={{ color: tokens.colors.textSecondary }}>
              Installments: <strong>{instPercent}%</strong> ({formatCentsToCurrency(instBurn)})
            </span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div
          style={{
            display: 'flex',
            height: '10px',
            backgroundColor: tokens.colors.surfaceElevated,
            borderRadius: tokens.radii.full,
            overflow: 'hidden',
            border: `1px solid ${tokens.colors.borderSubtle}`,
          }}
        >
          {totalBurn > 0 ? (
            <>
              <div
                style={{
                  width: `${subPercent}%`,
                  backgroundColor: tokens.colors.chart.subscriptionBar,
                  transition: 'width 0.4s ease',
                }}
              />
              <div
                style={{
                  width: `${instPercent}%`,
                  backgroundColor: tokens.colors.chart.installmentBar,
                  transition: 'width 0.4s ease',
                }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                backgroundColor: tokens.colors.surfaceElevated,
              }}
            />
          )}
        </div>
      </div>

      {/* Cycle Calendar Progress Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: tokens.colors.surfaceElevated,
          borderRadius: tokens.radii.md,
          border: `1px solid ${tokens.colors.borderSubtle}`,
          marginBottom: '1.25rem',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={16} color={tokens.colors.accentCyan} />
          <span style={{ color: tokens.colors.textSecondary }}>Cycle Progress:</span>
          <strong style={{ color: tokens.colors.textPrimary }}>
            {isCurrentMonth ? `Day ${currentDay} of ${daysInMonth}` : `${daysInMonth} Days in Cycle`}
          </strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tabular-nums" style={{ color: tokens.colors.accentCyan, fontWeight: 600 }}>
            {cycleElapsedPercent}% elapsed
          </span>
        </div>
      </div>

      {/* Commitments Ledger */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: tokens.colors.textMuted,
              fontWeight: 600,
            }}
          >
            Cycle Ledger ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: tokens.colors.textMuted,
              fontSize: '0.8125rem',
              backgroundColor: tokens.colors.surfaceElevated,
              borderRadius: tokens.radii.md,
              border: `1px dashed ${tokens.colors.borderSubtle}`,
            }}
          >
            No active commitments due in {formatCycleLabel(selectedCycle)}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {items.map((item, idx) => {
              const isSub = item.type === 'subscription';
              return (
                <div
                  key={item.commitmentId || `${item.name}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: tokens.colors.surfaceElevated,
                    borderRadius: tokens.radii.md,
                    border: `1px solid ${tokens.colors.borderSubtle}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: tokens.radii.sm,
                        backgroundColor: isSub
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(244, 63, 94, 0.15)',
                      }}
                    >
                      {isSub ? (
                        <SubscriptionIcon size={14} color={tokens.colors.chart.subscriptionBar} />
                      ) : (
                        <InstallmentIcon size={14} color={tokens.colors.chart.installmentBar} />
                      )}
                    </span>
                    <div>
                      <strong
                        style={{
                          fontSize: '0.8125rem',
                          color: tokens.colors.textPrimary,
                          display: 'block',
                        }}
                      >
                        {item.name}
                      </strong>
                      <span style={{ fontSize: '0.6875rem', color: tokens.colors.textMuted }}>
                        Due {item.dueDate}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge variant={isSub ? 'indigo' : 'rose'} size="sm">
                      {isSub ? 'Sub' : 'Inst'}
                    </Badge>
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: tokens.typography.weights.semibold,
                        color: tokens.colors.textPrimary,
                      }}
                    >
                      {formatCentsToCurrency(item.amountInCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
