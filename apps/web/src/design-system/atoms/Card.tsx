import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'none' | 'cyan' | 'emerald';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  glow = 'none',
  style,
  children,
  className = '',
  ...props
}: CardProps) {
  const paddingMap = {
    none: '0',
    sm: '0.9rem',
    md: '1.5rem',
    lg: '2.1rem',
  };

  const bgMap = {
    default: 'var(--zh-surface-card)',
    elevated: 'var(--zh-surface-elevated)',
    glass: 'rgba(18, 20, 29, 0.75)',
  };

  const glowMap = {
    none: 'var(--zh-shadow-card)',
    cyan: 'var(--zh-glow-cyan), var(--zh-shadow-card)',
    emerald: 'var(--zh-glow-emerald), var(--zh-shadow-card)',
  };

  const baseStyle: React.CSSProperties = {
    backgroundColor: bgMap[variant],
    borderRadius: 'var(--zh-radius-lg)',
    border: '1px solid var(--zh-border-subtle)',
    boxShadow: glowMap[glow],
    padding: paddingMap[padding],
    backdropFilter: variant === 'glass' ? 'blur(12px)' : undefined,
    WebkitBackdropFilter: variant === 'glass' ? 'blur(12px)' : undefined,
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ...style,
  };

  return (
    <div style={baseStyle} className={`zh-card ${className}`} {...props}>
      {children}
    </div>
  );
}
