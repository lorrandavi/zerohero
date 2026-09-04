import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CreditCard, Commitment } from '@zerohero/shared';
import { OperationalWorkbench } from '../organisms/OperationalWorkbench';
import { AddCardModal } from '../organisms/AddCardModal';
import { AddCommitmentModal } from '../organisms/AddCommitmentModal';

const mockCards: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Nubank Ultravioleta',
    closingDay: 25,
    dueDay: 2,
  },
  {
    id: 'card-2',
    name: 'Inter Black Mastercard',
    closingDay: 10,
    dueDay: 20,
  },
];

const mockCommitments: Commitment[] = [
  {
    type: 'subscription',
    id: 'comm-1',
    cardId: 'card-1',
    name: 'Netflix Premium',
    amountInCents: 5590,
    billingDay: 15,
    frequency: 'monthly',
    isActive: true,
  },
  {
    type: 'installment',
    id: 'comm-2',
    cardId: 'card-1',
    name: 'MacBook Pro M3 Max',
    totalAmountInCents: 240000,
    totalInstallments: 12,
    paidInstallments: 3,
    purchaseDate: '2026-07-15',
    payoffDate: '2027-07-02',
  },
  {
    type: 'installment',
    id: 'comm-3',
    cardId: 'card-2',
    name: 'iPhone 16 Pro',
    totalAmountInCents: 100000,
    totalInstallments: 10,
    paidInstallments: 10,
    purchaseDate: '2025-10-01',
    payoffDate: '2026-08-20',
  },
];

describe('OperationalWorkbench organism', () => {
  it('renders credit cards list with closingDay, dueDay, and items count', () => {
    const html = renderToStaticMarkup(
      <OperationalWorkbench
        cards={mockCards}
        commitments={mockCommitments}
        onSelectCard={() => {}}
        onOpenAddCard={() => {}}
        onOpenAddCommitment={() => {}}
        onDeleteCard={async () => {}}
        onDeleteCommitment={async () => {}}
      />
    );

    // Cards list header and titles
    expect(html).toContain('Active Credit Cards');
    expect(html).toContain('Nubank Ultravioleta');
    expect(html).toContain('Inter Black Mastercard');

    // Statement dates
    expect(html).toContain('Closes: <strong>25th</strong>');
    expect(html).toContain('Due: <strong>2nd</strong>');
    expect(html).toContain('Closes: <strong>10th</strong>');
    expect(html).toContain('Due: <strong>20th</strong>');

    // Item count badges (card-1 has 2 items, card-2 has 1 item)
    expect(html).toContain('2 items');
    expect(html).toContain('1 item');
  });

  it('renders commitments with subscription details and installment progress bar', () => {
    const html = renderToStaticMarkup(
      <OperationalWorkbench
        cards={mockCards}
        commitments={mockCommitments}
        onSelectCard={() => {}}
        onOpenAddCard={() => {}}
        onOpenAddCommitment={() => {}}
        onDeleteCard={async () => {}}
        onDeleteCommitment={async () => {}}
      />
    );

    // Subscriptions
    expect(html).toContain('Netflix Premium');
    expect(html).toContain('$55.90 / mo');
    expect(html).toContain('Renews on the 15th of each month');

    // Installments
    expect(html).toContain('MacBook Pro M3 Max');
    expect(html).toContain('$200.00 / mo'); // 240000 / 12 / 100
    expect(html).toContain('$2400.00 total');
    expect(html).toContain('3 of 12 paid (25%)');
    expect(html).toContain('9 remaining');
    expect(html).toContain('width:25%'); // progress bar fill

    // Fully paid installment
    expect(html).toContain('iPhone 16 Pro');
    expect(html).toContain('10 of 10 paid (100%)');
    expect(html).toContain('Fully paid!');
    expect(html).toContain('width:100%');
  });

  it('filters commitments by card when selectedCardId is passed', () => {
    const html = renderToStaticMarkup(
      <OperationalWorkbench
        cards={mockCards}
        commitments={mockCommitments}
        selectedCardId="card-2"
        onSelectCard={() => {}}
        onOpenAddCard={() => {}}
        onOpenAddCommitment={() => {}}
        onDeleteCard={async () => {}}
        onDeleteCommitment={async () => {}}
      />
    );

    // Should indicate filter is active
    expect(html).toContain('Showing commitments for <strong>Inter Black Mastercard</strong>');
    // Should show iPhone 16 Pro (card-2)
    expect(html).toContain('iPhone 16 Pro');
    // Should NOT show card-1 items
    expect(html).not.toContain('Netflix Premium');
    expect(html).not.toContain('MacBook Pro M3 Max');
  });

  it('renders empty states when cards or commitments are empty', () => {
    const html = renderToStaticMarkup(
      <OperationalWorkbench
        cards={[]}
        commitments={[]}
        onSelectCard={() => {}}
        onOpenAddCard={() => {}}
        onOpenAddCommitment={() => {}}
        onDeleteCard={async () => {}}
        onDeleteCommitment={async () => {}}
      />
    );

    expect(html).toContain('No credit cards configured');
    expect(html).toContain('No commitments found');
    expect(html).toContain('+ Add First Card');
  });
});

describe('AddCardModal organism', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <AddCardModal isOpen={false} onClose={() => {}} onSuccess={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with inputs when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <AddCardModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('Add Credit Card');
    expect(html).toContain('Card Name');
    expect(html).toContain('Closing Day');
    expect(html).toContain('Due Day');
    expect(html).toContain('Create Card');
  });
});

describe('AddCommitmentModal organism', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <AddCommitmentModal
        isOpen={false}
        cards={mockCards}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with card options and segmented control', () => {
    const html = renderToStaticMarkup(
      <AddCommitmentModal
        isOpen={true}
        cards={mockCards}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('Add Financial Commitment');
    expect(html).toContain('Subscription');
    expect(html).toContain('Installment');
    expect(html).toContain('Associated Credit Card');
    expect(html).toContain('Nubank Ultravioleta');
    expect(html).toContain('Inter Black Mastercard');
  });
});
