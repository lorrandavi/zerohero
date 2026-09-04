import React, { useState, useEffect } from 'react';
import {
  SubscriptionSchema,
  InstallmentSchema,
  type Commitment,
  type CreditCard,
} from '@zerohero/shared';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import {
  XIcon,
  SubscriptionIcon,
  InstallmentIcon,
  AlertCircleIcon,
  PlusIcon,
} from '../icons';
import { api } from '../../api/client';

export interface AddCommitmentModalProps {
  isOpen: boolean;
  cards: CreditCard[];
  initialCardId?: string;
  onClose: () => void;
  onSuccess: (newCommitment: Commitment) => void;
  onOpenAddCard?: () => void;
}

export function AddCommitmentModal({
  isOpen,
  cards,
  initialCardId,
  onClose,
  onSuccess,
  onOpenAddCard,
}: AddCommitmentModalProps) {
  const [type, setType] = useState<'subscription' | 'installment'>('subscription');
  const [cardId, setCardId] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Subscription fields
  const [amountStr, setAmountStr] = useState<string>('19.90');
  const [billingDayStr, setBillingDayStr] = useState<string>('10');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');

  // Installment fields
  const [totalAmountStr, setTotalAmountStr] = useState<string>('600.00');
  const [totalInstallmentsStr, setTotalInstallmentsStr] = useState<string>('6');
  const [paidInstallmentsStr, setPaidInstallmentsStr] = useState<string>('0');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      const defaultCardId = initialCardId || (cards.length > 0 ? (cards[0].id ?? '') : '');
      setCardId(defaultCardId);
      setName('');
      setAmountStr('19.90');
      setBillingDayStr('10');
      setFrequency('monthly');
      setTotalAmountStr('600.00');
      setTotalInstallmentsStr('6');
      setPaidInstallmentsStr('0');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setErrors({});
      setServerError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialCardId, cards]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!cardId) {
      setErrors({ cardId: 'Please select a credit card' });
      return;
    }

    if (type === 'subscription') {
      const parsedAmount = Math.round(parseFloat(amountStr) * 100);
      const parsedBillingDay = parseInt(billingDayStr, 10);

      const payload = {
        type: 'subscription' as const,
        cardId,
        name: name.trim(),
        amountInCents: isNaN(parsedAmount) ? undefined : parsedAmount,
        billingDay: isNaN(parsedBillingDay) ? undefined : parsedBillingDay,
        frequency,
        isActive: true,
      };

      const result = SubscriptionSchema.safeParse(payload);
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
        const created = await api.createCommitment(result.data);
        onSuccess(created);
        onClose();
      } catch (err: any) {
        setServerError(err.data?.error || err.message || 'Failed to create subscription.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Installment
      const parsedTotalAmount = Math.round(parseFloat(totalAmountStr) * 100);
      const parsedTotalInstallments = parseInt(totalInstallmentsStr, 10);
      const parsedPaidInstallments = parseInt(paidInstallmentsStr, 10);

      const payload = {
        type: 'installment' as const,
        cardId,
        name: name.trim(),
        totalAmountInCents: isNaN(parsedTotalAmount) ? undefined : parsedTotalAmount,
        totalInstallments: isNaN(parsedTotalInstallments) ? undefined : parsedTotalInstallments,
        paidInstallments: isNaN(parsedPaidInstallments) ? 0 : parsedPaidInstallments,
        purchaseDate,
        payoffDate: null,
      };

      const result = InstallmentSchema.safeParse(payload);
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
        const created = await api.createCommitment(result.data);
        onSuccess(created);
        onClose();
      } catch (err: any) {
        setServerError(err.data?.error || err.message || 'Failed to create installment.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-commitment-title"
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
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
                backgroundColor:
                  type === 'subscription'
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {type === 'subscription' ? (
                <SubscriptionIcon size={18} color="var(--zh-accent-indigo)" />
              ) : (
                <InstallmentIcon size={18} color="var(--zh-accent-rose)" />
              )}
            </div>
            <div>
              <h2
                id="add-commitment-title"
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--zh-text-primary)',
                }}
              >
                Add Financial Commitment
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: 'var(--zh-text-secondary)',
                }}
              >
                Track recurring subscriptions and split purchases
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

          {/* Type Segmented Control */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--zh-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Commitment Type
            </span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '4px',
                backgroundColor: 'var(--zh-surface-elevated)',
                borderRadius: 'var(--zh-radius-lg)',
                border: '1px solid var(--zh-border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setType('subscription')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--zh-radius-md)',
                  border: 'none',
                  backgroundColor:
                    type === 'subscription' ? 'var(--zh-accent-indigo)' : 'transparent',
                  color: type === 'subscription' ? '#ffffff' : 'var(--zh-text-secondary)',
                  fontWeight: type === 'subscription' ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <SubscriptionIcon size={16} />
                <span>Subscription</span>
              </button>
              <button
                type="button"
                onClick={() => setType('installment')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: 'var(--zh-radius-md)',
                  border: 'none',
                  backgroundColor:
                    type === 'installment' ? 'var(--zh-accent-rose)' : 'transparent',
                  color: type === 'installment' ? '#ffffff' : 'var(--zh-text-secondary)',
                  fontWeight: type === 'installment' ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <InstallmentIcon size={16} />
                <span>Installment</span>
              </button>
            </div>
          </div>

          {/* Credit Card Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="card-select"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--zh-text-secondary)',
                }}
              >
                Associated Credit Card <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
              </label>
              {onOpenAddCard && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddCard();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--zh-accent-cyan)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  + Add new card
                </button>
              )}
            </div>
            {cards.length === 0 ? (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 'var(--zh-radius-md)',
                  fontSize: '0.8125rem',
                  color: 'var(--zh-accent-amber)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>No credit cards created yet.</span>
                {onOpenAddCard && (
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddCard();
                    }}
                  >
                    Add Card Now
                  </Button>
                )}
              </div>
            ) : (
              <select
                id="card-select"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--zh-surface-elevated)',
                  border: `1px solid ${errors.cardId ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                  borderRadius: 'var(--zh-radius-md)',
                  color: 'var(--zh-text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="" disabled>
                  Select a card...
                </option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Closing: {c.closingDay}th / Due: {c.dueDay}th)
                  </option>
                ))}
              </select>
            )}
            {errors.cardId && (
              <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                {errors.cardId}
              </span>
            )}
          </div>

          {/* Commitment Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="commitment-name-input"
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--zh-text-secondary)',
                marginBottom: '6px',
              }}
            >
              Name / Description <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
            </label>
            <input
              id="commitment-name-input"
              type="text"
              placeholder={type === 'subscription' ? 'e.g. Netflix, Spotify, AWS' : 'e.g. iPhone 16 Pro, MacBook M3'}
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

          {/* Dynamic Fields: Subscription */}
          {type === 'subscription' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  htmlFor="subscription-amount-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--zh-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Amount ($) <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--zh-text-muted)',
                      fontSize: '0.875rem',
                    }}
                  >
                    $
                  </span>
                  <input
                    id="subscription-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="19.90"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 26px',
                      backgroundColor: 'var(--zh-surface-elevated)',
                      border: `1px solid ${errors.amountInCents ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                      borderRadius: 'var(--zh-radius-md)',
                      color: 'var(--zh-text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {errors.amountInCents && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                    {errors.amountInCents}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="billing-day-input"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--zh-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Billing Renewal Day <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
                </label>
                <input
                  id="billing-day-input"
                  type="number"
                  min="1"
                  max="31"
                  value={billingDayStr}
                  onChange={(e) => setBillingDayStr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'var(--zh-surface-elevated)',
                    border: `1px solid ${errors.billingDay ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                    borderRadius: 'var(--zh-radius-md)',
                    color: 'var(--zh-text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.billingDay && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                    {errors.billingDay}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Fields: Installment */}
          {type === 'installment' && (
            <>
              {/* Total Amount and Purchase Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label
                    htmlFor="installment-total-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--zh-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Total Cost ($) <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--zh-text-muted)',
                        fontSize: '0.875rem',
                      }}
                    >
                      $
                    </span>
                    <input
                      id="installment-total-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="600.00"
                      value={totalAmountStr}
                      onChange={(e) => setTotalAmountStr(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 26px',
                        backgroundColor: 'var(--zh-surface-elevated)',
                        border: `1px solid ${errors.totalAmountInCents ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                        borderRadius: 'var(--zh-radius-md)',
                        color: 'var(--zh-text-primary)',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  {errors.totalAmountInCents && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                      {errors.totalAmountInCents}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="purchase-date-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--zh-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Purchase Date <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
                  </label>
                  <input
                    id="purchase-date-input"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--zh-surface-elevated)',
                      border: `1px solid ${errors.purchaseDate ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                      borderRadius: 'var(--zh-radius-md)',
                      color: 'var(--zh-text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.purchaseDate && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                      {errors.purchaseDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Installments split: Total installments and already paid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label
                    htmlFor="total-installments-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--zh-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Total Installments <span style={{ color: 'var(--zh-accent-rose)' }}>*</span>
                  </label>
                  <input
                    id="total-installments-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={totalInstallmentsStr}
                    onChange={(e) => setTotalInstallmentsStr(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--zh-surface-elevated)',
                      border: `1px solid ${errors.totalInstallments ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                      borderRadius: 'var(--zh-radius-md)',
                      color: 'var(--zh-text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.totalInstallments && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                      {errors.totalInstallments}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="paid-installments-input"
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'var(--zh-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    Already Paid
                  </label>
                  <input
                    id="paid-installments-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={paidInstallmentsStr}
                    onChange={(e) => setPaidInstallmentsStr(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--zh-surface-elevated)',
                      border: `1px solid ${errors.paidInstallments ? 'var(--zh-accent-rose)' : 'var(--zh-border-subtle)'}`,
                      borderRadius: 'var(--zh-radius-md)',
                      color: 'var(--zh-text-primary)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.paidInstallments && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--zh-accent-rose)', marginTop: '4px', display: 'block' }}>
                      {errors.paidInstallments}
                    </span>
                  )}
                </div>
              </div>

              {/* Installment preview calculation */}
              {parseFloat(totalAmountStr) > 0 && parseInt(totalInstallmentsStr, 10) > 0 && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    borderRadius: 'var(--zh-radius-md)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    fontSize: '0.8125rem',
                    color: 'var(--zh-text-secondary)',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Est. monthly installment:</span>
                  <strong style={{ color: 'var(--zh-accent-rose)' }}>
                    ${(parseFloat(totalAmountStr) / parseInt(totalInstallmentsStr, 10)).toFixed(2)} / mo
                  </strong>
                </div>
              )}
            </>
          )}

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
              disabled={isSubmitting || cards.length === 0}
              icon={type === 'subscription' ? <SubscriptionIcon size={16} /> : <InstallmentIcon size={16} />}
            >
              {isSubmitting ? 'Saving...' : type === 'subscription' ? 'Add Subscription' : 'Add Installment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
