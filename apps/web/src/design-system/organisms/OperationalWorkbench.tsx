import React, { useState } from 'react';
import type { CreditCard, Commitment, Subscription, Installment } from '@zerohero/shared';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import {
  CreditCardIcon,
  SubscriptionIcon,
  InstallmentIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XIcon,
} from '../icons';

export interface OperationalWorkbenchProps {
  cards: CreditCard[];
  commitments: Commitment[];
  selectedCardId?: string;
  onSelectCard: (cardId?: string) => void;
  onOpenAddCard: () => void;
  onOpenAddCommitment: (cardId?: string) => void;
  onDeleteCard: (cardId: string) => Promise<void>;
  onDeleteCommitment: (commitmentId: string) => Promise<void>;
  isLoadingCards?: boolean;
  isLoadingCommitments?: boolean;
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function OperationalWorkbench({
  cards,
  commitments,
  selectedCardId,
  onSelectCard,
  onOpenAddCard,
  onOpenAddCommitment,
  onDeleteCard,
  onDeleteCommitment,
  isLoadingCards = false,
  isLoadingCommitments = false,
}: OperationalWorkbenchProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'subscription' | 'installment'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Map cardId -> CreditCard for fast lookup
  const cardMap = React.useMemo(() => {
    const map = new Map<string, CreditCard>();
    cards.forEach((c) => {
      if (c.id) map.set(c.id, c);
    });
    return map;
  }, [cards]);

  // Count commitments per card
  const commitmentCountPerCard = React.useMemo(() => {
    const counts = new Map<string, number>();
    commitments.forEach((item) => {
      counts.set(item.cardId, (counts.get(item.cardId) ?? 0) + 1);
    });
    return counts;
  }, [commitments]);

  // Filtered commitments list
  const filteredCommitments = React.useMemo(() => {
    return commitments.filter((item) => {
      if (selectedCardId && item.cardId !== selectedCardId) {
        return false;
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [commitments, selectedCardId, typeFilter]);

  const handleDeleteCard = async (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    if (!card.id) return;
    const confirmMsg = `Are you sure you want to delete card "${card.name}"? This will also remove any linked commitments.`;
    if (window.confirm(confirmMsg)) {
      setDeletingId(card.id);
      try {
        await onDeleteCard(card.id);
        if (selectedCardId === card.id) {
          onSelectCard(undefined);
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDeleteCommitment = async (e: React.MouseEvent, item: Commitment) => {
    e.stopPropagation();
    if (!item.id) return;
    if (window.confirm(`Delete commitment "${item.name}"?`)) {
      setDeletingId(item.id);
      try {
        await onDeleteCommitment(item.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const selectedCard = selectedCardId ? cardMap.get(selectedCardId) : undefined;

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                margin: 0,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--zh-text-primary)',
              }}
            >
              Operational Split Workbench
            </h2>
            <Badge variant="cyan" size="sm">
              Live Operations
            </Badge>
          </div>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '0.875rem',
              color: 'var(--zh-text-secondary)',
            }}
          >
            Manage active credit cards, statement cutoff cycles, and installment payoff progress
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<CreditCardIcon size={16} />}
            onClick={onOpenAddCard}
          >
            + Add Card
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={16} />}
            onClick={() => onOpenAddCommitment(selectedCardId)}
          >
            + Add Commitment
          </Button>
        </div>
      </div>

      {/* Split Workbench Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Active Credit Cards */}
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCardIcon size={20} color="var(--zh-accent-cyan)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Active Credit Cards</h3>
              <Badge variant="neutral" size="sm">
                {cards.length}
              </Badge>
            </div>
            {selectedCardId && (
              <button
                type="button"
                onClick={() => onSelectCard(undefined)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--zh-accent-cyan)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                Clear Filter
              </button>
            )}
          </div>

          {isLoadingCards ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--zh-text-muted)' }}>
              Loading cards...
            </div>
          ) : cards.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--zh-surface-elevated)',
                borderRadius: 'var(--zh-radius-lg)',
                border: '1px dashed var(--zh-border-subtle)',
              }}
            >
              <CreditCardIcon size={36} color="var(--zh-text-muted)" style={{ margin: '0 auto 12px' }} />
              <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '4px' }}>
                No credit cards configured
              </strong>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: 'var(--zh-text-secondary)' }}>
                Add your credit card with its closing and due dates to begin tracking commitments.
              </p>
              <Button size="sm" variant="secondary" onClick={onOpenAddCard}>
                + Add First Card
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cards.map((card) => {
                const isSelected = selectedCardId === card.id;
                const count = card.id ? commitmentCountPerCard.get(card.id) ?? 0 : 0;

                return (
                  <div
                    key={card.id}
                    onClick={() => onSelectCard(isSelected ? undefined : card.id)}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: isSelected
                        ? 'rgba(6, 182, 212, 0.08)'
                        : 'var(--zh-surface-elevated)',
                      border: isSelected
                        ? '1px solid var(--zh-accent-cyan)'
                        : '1px solid var(--zh-border-subtle)',
                      borderRadius: 'var(--zh-radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(6, 182, 212, 0.15)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: isSelected
                              ? 'var(--zh-accent-cyan)'
                              : 'var(--zh-accent-indigo)',
                            boxShadow: isSelected ? '0 0 8px var(--zh-accent-cyan)' : 'none',
                          }}
                        />
                        <strong
                          style={{
                            fontSize: '0.9375rem',
                            color: isSelected ? 'var(--zh-accent-cyan)' : 'var(--zh-text-primary)',
                          }}
                        >
                          {card.name}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge variant={isSelected ? 'cyan' : 'neutral'} size="sm">
                          {count} {count === 1 ? 'item' : 'items'}
                        </Badge>
                        <button
                          type="button"
                          aria-label={`Delete card ${card.name}`}
                          onClick={(e) => handleDeleteCard(e, card)}
                          disabled={deletingId === card.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--zh-text-muted)',
                            padding: '4px',
                            borderRadius: 'var(--zh-radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TrashIcon size={15} color="var(--zh-accent-rose)" />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--zh-text-secondary)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} />
                        Closes: <strong>{formatOrdinal(card.closingDay)}</strong>
                      </span>
                      <span>
                        Due: <strong>{formatOrdinal(card.dueDay)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Column: Commitments Ledger with Progress Bars */}
        <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header & Filter Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {selectedCard ? `${selectedCard.name} Commitments` : 'All Commitments & Debt'}
              </h3>
              <Badge variant="indigo" size="sm">
                {filteredCommitments.length}
              </Badge>
            </div>

            {/* Type Filter Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: 'var(--zh-surface-elevated)',
                padding: '3px',
                borderRadius: 'var(--zh-radius-md)',
                border: '1px solid var(--zh-border-subtle)',
              }}
            >
              {(['all', 'subscription', 'installment'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    border: 'none',
                    background: typeFilter === t ? 'var(--zh-surface-card)' : 'transparent',
                    color: typeFilter === t ? 'var(--zh-text-primary)' : 'var(--zh-text-secondary)',
                    fontWeight: typeFilter === t ? 600 : 400,
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--zh-radius-sm)',
                    cursor: 'pointer',
                    boxShadow: typeFilter === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Active Card Filter Notice */}
          {selectedCard && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--zh-radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--zh-accent-cyan)',
                marginBottom: '1rem',
              }}
            >
              <span>Showing commitments for <strong>{selectedCard.name}</strong></span>
              <button
                type="button"
                onClick={() => onSelectCard(undefined)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--zh-accent-cyan)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Show all cards <XIcon size={12} />
              </button>
            </div>
          )}

          {/* Commitments List */}
          {isLoadingCommitments ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--zh-text-muted)' }}>
              Loading commitments...
            </div>
          ) : filteredCommitments.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--zh-surface-elevated)',
                borderRadius: 'var(--zh-radius-lg)',
                border: '1px dashed var(--zh-border-subtle)',
              }}
            >
              <SubscriptionIcon size={36} color="var(--zh-text-muted)" style={{ margin: '0 auto 12px' }} />
              <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '4px' }}>
                No commitments found
              </strong>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: 'var(--zh-text-secondary)' }}>
                {selectedCard
                  ? `No commitments linked to ${selectedCard.name}.`
                  : 'Add subscriptions or installment purchases to track your payoff timeline.'}
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => onOpenAddCommitment(selectedCardId)}
              >
                + Add Commitment
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredCommitments.map((item) => {
                const card = cardMap.get(item.cardId);
                const isInstallment = item.type === 'installment';

                if (isInstallment) {
                  const inst = item as Installment;
                  const progressPct =
                    inst.totalInstallments > 0
                      ? Math.min(100, Math.round((inst.paidInstallments / inst.totalInstallments) * 100))
                      : 0;
                  const remainingInstallments = Math.max(0, inst.totalInstallments - inst.paidInstallments);
                  const monthlyCents = Math.round(inst.totalAmountInCents / inst.totalInstallments);

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'var(--zh-surface-elevated)',
                        borderRadius: 'var(--zh-radius-lg)',
                        border: '1px solid var(--zh-border-subtle)',
                      }}
                    >
                      {/* Top Row: Title, Badge, Card, Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Badge variant="rose" size="sm" icon={<InstallmentIcon size={12} />}>
                            Installment
                          </Badge>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--zh-text-primary)' }}>
                            {inst.name}
                          </strong>
                          {card && (
                            <Badge variant="neutral" size="sm">
                              {card.name}
                            </Badge>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <strong
                              className="tabular-nums"
                              style={{ fontSize: '0.9375rem', color: 'var(--zh-accent-rose)' }}
                            >
                              ${(monthlyCents / 100).toFixed(2)} / mo
                            </strong>
                            <span
                              className="tabular-nums"
                              style={{ display: 'block', fontSize: '0.75rem', color: 'var(--zh-text-muted)' }}
                            >
                              ${(inst.totalAmountInCents / 100).toFixed(2)} total
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`Delete ${inst.name}`}
                            onClick={(e) => handleDeleteCommitment(e, inst)}
                            disabled={deletingId === inst.id}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--zh-text-muted)',
                              padding: '4px',
                              borderRadius: 'var(--zh-radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <TrashIcon size={15} color="var(--zh-accent-rose)" />
                          </button>
                        </div>
                      </div>

                      {/* Installment Progress Bar */}
                      <div style={{ marginTop: '10px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--zh-text-secondary)',
                            marginBottom: '5px',
                          }}
                        >
                          <span className="tabular-nums">
                            {inst.paidInstallments} of {inst.totalInstallments} paid ({progressPct}%)
                          </span>
                          <span style={{ color: remainingInstallments === 0 ? 'var(--zh-accent-emerald)' : 'var(--zh-accent-amber)' }}>
                            {remainingInstallments === 0
                              ? 'Fully paid!'
                              : `${remainingInstallments} remaining`}
                            {inst.payoffDate && remainingInstallments > 0
                              ? ` • Payoff: ${inst.payoffDate}`
                              : ''}
                          </span>
                        </div>

                        {/* Progress track */}
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--zh-radius-full)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background:
                                progressPct === 100
                                  ? 'var(--zh-accent-emerald)'
                                  : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                              borderRadius: 'var(--zh-radius-full)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // Subscription item
                const sub = item as Subscription;
                return (
                  <div
                    key={sub.id}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--zh-surface-elevated)',
                      borderRadius: 'var(--zh-radius-lg)',
                      border: '1px solid var(--zh-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <Badge variant="indigo" size="sm" icon={<SubscriptionIcon size={12} />}>
                          Subscription
                        </Badge>
                        <strong style={{ fontSize: '0.9375rem', color: 'var(--zh-text-primary)' }}>
                          {sub.name}
                        </strong>
                        {card && (
                          <Badge variant="neutral" size="sm">
                            {card.name}
                          </Badge>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--zh-text-muted)' }}>
                        Renews on the {formatOrdinal(sub.billingDay)} of each month ({sub.frequency})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong
                        className="tabular-nums"
                        style={{ fontSize: '0.9375rem', color: 'var(--zh-accent-indigo)' }}
                      >
                        ${(sub.amountInCents / 100).toFixed(2)} / mo
                      </strong>
                      <button
                        type="button"
                        aria-label={`Delete ${sub.name}`}
                        onClick={(e) => handleDeleteCommitment(e, sub)}
                        disabled={deletingId === sub.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--zh-text-muted)',
                          padding: '4px',
                          borderRadius: 'var(--zh-radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrashIcon size={15} color="var(--zh-accent-rose)" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
