import React from 'react';

export interface StatValueProps extends React.HTMLAttributes<HTMLDivElement> {
  amountInCents: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emerald' | 'cyan' | 'rose' | 'indigo' | 'neutral';
  label?: string;
  subtext?: string;
}

export function formatCentsToCurrency(cents: number, currency = 'USD'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function StatValue({
  amountInCents,
  currency = 'USD',
  size = 'md',
  variant = 'neutral',
  label,
  subtext,
  style,
  className = '',
  ...props
}: StatValueProps) {
  const formatted = formatCentsToCurrency(amountInCents, currency);

  const sizeMap: Record<NonNullable<StatValueProps['size']>, { value: string; label: string; sub: string }> = {
    sm: { value: '1.125rem', label: '0.75rem', sub: '0.7rem' },
    md: { value: '1.5rem', label: '0.8125rem', sub: '0.75rem' },
    lg: { value: '2rem', label: '0.875rem', sub: '0.8125rem' },
    xl: { value: '2.75rem', label: '0.875rem', sub: '0.875rem' },
  };

  const currentSize = sizeMap[size];

  const colorMap: Record<NonNullable<StatValueProps['variant']>, string> = {
    emerald: 'var(--zh-accent-emerald)',
    cyan: 'var(--zh-accent-cyan)',
    rose: 'var(--zh-accent-rose)',
    indigo: 'var(--zh-accent-indigo)',
    neutral: 'var(--zh-text-primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }} className={`zh-stat ${className}`} {...props}>
      {label && (
        <span
          style={{
            fontSize: currentSize.label,
            color: 'var(--zh-text-secondary)',
            fontWeight: 500,
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
      )}
      <div
        className="tabular-nums"
        style={{
          fontSize: currentSize.value,
          fontWeight: 700,
          color: colorMap[variant],
          lineHeight: 1.1,
          fontFamily: 'inherit',
          letterSpacing: '-0.02em',
        }}
      >
        {formatted}
      </div>
      {subtext && (
        <span
          style={{
            fontSize: currentSize.sub,
            color: 'var(--zh-text-muted)',
            marginTop: '4px',
          }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}
