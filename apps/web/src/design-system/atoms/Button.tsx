import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  style,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeMap: Record<ButtonSize, { padding: string; fontSize: string; height: string }> = {
    sm: { padding: '0 12px', fontSize: '0.8125rem', height: '38px' },
    md: { padding: '0 20px', fontSize: '0.875rem', height: '48px' },
    lg: { padding: '0 26px', fontSize: '1rem', height: '58px' },
  };

  const currentSize = sizeMap[size];

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--zh-accent-indigo)',
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
    },
    secondary: {
      backgroundColor: 'var(--zh-surface-elevated)',
      color: 'var(--zh-text-primary)',
      border: '1px solid var(--zh-border-subtle)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--zh-text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'rgba(244, 63, 94, 0.15)',
      color: 'var(--zh-accent-rose)',
      border: '1px solid rgba(244, 63, 94, 0.3)',
    },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    height: currentSize.height,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: 500,
    fontFamily: 'inherit',
    borderRadius: 'var(--zh-radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease-in-out',
    outline: 'none',
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled}
      className={`zh-button ${className}`}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
