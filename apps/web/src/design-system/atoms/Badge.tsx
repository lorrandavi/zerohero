import React from 'react';

export type BadgeVariant = 'emerald' | 'cyan' | 'indigo' | 'amber' | 'rose' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  style,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const colorMap: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: 'var(--zh-accent-emerald)',
      border: 'rgba(16, 185, 129, 0.28)',
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      text: 'var(--zh-accent-cyan)',
      border: 'rgba(6, 182, 212, 0.28)',
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      text: 'var(--zh-accent-indigo)',
      border: 'rgba(99, 102, 241, 0.28)',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: 'var(--zh-accent-amber)',
      border: 'rgba(245, 158, 11, 0.28)',
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.12)',
      text: 'var(--zh-accent-rose)',
      border: 'rgba(244, 63, 94, 0.28)',
    },
    neutral: {
      bg: 'rgba(100, 116, 139, 0.12)',
      text: 'var(--zh-text-secondary)',
      border: 'var(--zh-border-subtle)',
    },
  };

  const currentColors = colorMap[variant];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: size === 'sm' ? '3px 9px' : '4px 12px',
    fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
    fontWeight: 500,
    borderRadius: 'var(--zh-radius-full)',
    backgroundColor: currentColors.bg,
    color: currentColors.text,
    border: `1px solid ${currentColors.border}`,
    letterSpacing: '0.01em',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <span style={baseStyle} className={`zh-badge tabular-nums ${className}`} {...props}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
