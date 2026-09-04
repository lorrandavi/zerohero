import React, { useState, useEffect } from 'react';
import { CreditCardSchema, type CreditCard } from '@zerohero/shared';
import { Button } from '../atoms/Button';
import { XIcon, CreditCardIcon, AlertCircleIcon } from '../icons';
import { api } from '../../api/client';

const CardFormSchema = CreditCardSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCard: CreditCard) => void;
}

export function AddCardModal({ isOpen, onClose, onSuccess }: AddCardModalProps) {
  const [name, setName] = useState('');
  const [closingDay, setClosingDay] = useState<string>('25');
  const [dueDay, setDueDay] = useState<string>('2');
  const [selectedColor, setSelectedColor] = useState<string>('#06b6d4');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setClosingDay('25');
      setDueDay('2');
      setSelectedColor('#06b6d4');
      setErrors({});
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colorOptions = [
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Amber', value: '#f59e0b' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsedClosingDay = parseInt(closingDay, 10);
    const parsedDueDay = parseInt(dueDay, 10);

    const result = CardFormSchema.safeParse({
      name: name.trim(),
      closingDay: isNaN(parsedClosingDay) ? undefined : parsedClosingDay,
      dueDay: isNaN(parsedDueDay) ? undefined : parsedDueDay,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const newCard = await api.createCard({
        name: result.data.name,
        closingDay: result.data.closingDay,
        dueDay: result.data.dueDay,
        color: selectedColor,
      });
      onSuccess(newCard);
      onClose();
    } catch (err: any) {
      setServerError(err.data?.error || err.message || 'Failed to create credit card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-card-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 100,
        animation: 'zhFadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--zh-surface-card)',
          border: '1px solid var(--zh-border-subtle)',
          borderRadius: 'var(--zh-radius-xl)',
          boxShadow: 'var(--zh-shadow-card)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--zh-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--zh-radius-md)',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CreditCardIcon size={18} color="var(--zh-accent-cyan)" />
            </div>
            <div>
              <h2
                id="add-card-title"
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--zh-text-primary)',
                }}
              >
                Add Credit Card
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: 'var(--zh-text-secondary)',
                }}
              >
                Configure billing cycle and payment due dates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--zh-text-secondary)',
              padding: '4px',
              borderRadius: 'var(--zh-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {serverError && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--zh-radius-md)',
                color: 'var(--zh-accent-rose)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircleIcon size={16} color="var(--zh-accent-rose)" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Card Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="card-name-input"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--zh-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Card Name <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
            </label>
            <input
              id="card-name-input"
              type="text"
              placeholder="e.g. Nubank Ultravioleta, Chase Sapphire"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--zh-surface-elevated)',
                border: `1px solid ${errors.name ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                borderRadius: 'var(--zh-radius-md)',
                color: 'var(--zh-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Days Grid: Closing Day and Due Day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label
                htmlFor="closing-day-input"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--zh-text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Closing Day <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
              </label>
              <input
                id="closing-day-input"
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--zh-surface-elevated)',
                  border: `1px solid ${errors.closingDay ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                  borderRadius: 'var(--zh-radius-md)',
                  color: 'var(--zh-text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--zh-text-muted)', marginTop: '4px', display: 'block' }}>
                Statement cutoff (1-31)
              </span>
              {errors.closingDay && (
                <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '2px', display: 'block' }}>
                  {errors.closingDay}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="due-day-input"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--zh-text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Due Day <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
              </label>
              <input
                id="due-day-input"
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--zh-surface-elevated)',
                  border: `1px solid ${errors.dueDay ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                  borderRadius: 'var(--zh-radius-md)',
                  color: 'var(--zh-text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--zh-text-muted)', marginTop: '4px', display: 'block' }}>
                Invoice payment due (1-31)
              </span>
              {errors.dueDay && (
                <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '2px', display: 'block' }}>
                  {errors.dueDay}
                </span>
              )}
            </div>
          </div>

          {/* Accent Color Picker */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--zh-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Card Accent Color
            </span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    border: selectedColor === c.value ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: selectedColor === c.value ? `0 0 10px ${c.value}` : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid var(--zh-border-subtle)',
              paddingTop: '1.25rem',
            }}
          >
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              icon={<CreditCardIcon size={16} />}
            >
              {isSubmitting ? 'Creating...' : 'Create Card'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
