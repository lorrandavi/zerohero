import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '../icons';
import { Badge } from '../atoms/Badge';

export interface PeriodNavigatorProps {
  cycleId: string; // 'YYYY-MM'
  onPeriodChange: (newCycleId: string) => void;
  isCurrentCycle?: boolean;
}

export function formatCycleLabel(cycleId: string): string {
  const [yearStr, monthStr] = cycleId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return cycleId;

  // Use UTC Date to avoid timezone shift
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function shiftCycleId(cycleId: string, deltaMonths: number): string {
  const [yearStr, monthStr] = cycleId.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month)) return cycleId;

  month += deltaMonths;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

export function PeriodNavigator({
  cycleId,
  onPeriodChange,
  isCurrentCycle = false,
}: PeriodNavigatorProps) {
  const label = formatCycleLabel(cycleId);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'var(--zh-surface-card)',
        padding: '6px 12px',
        borderRadius: 'var(--zh-radius-lg)',
        border: '1px solid var(--zh-border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={() => onPeriodChange(shiftCycleId(cycleId, -1))}
        aria-label="Previous Period"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--zh-text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: 'var(--zh-radius-sm)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ChevronLeftIcon size={18} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarIcon size={16} color="var(--zh-accent-cyan)" />
        <span
          className="tabular-nums"
          style={{
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--zh-text-primary)',
          }}
        >
          {label}
        </span>
        {isCurrentCycle && (
          <Badge variant="cyan" size="sm">
            Current
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPeriodChange(shiftCycleId(cycleId, 1))}
        aria-label="Next Period"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--zh-text-secondary)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: 'var(--zh-radius-sm)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ChevronRightIcon size={18} />
      </button>
    </div>
  );
}
