import React, { useState } from 'react';
import type { CreditCard, StatementPeriod, Commitment } from '@zerohero/shared';

export function App() {
  const [sampleCard] = useState<CreditCard>({
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Nubank Ultravioleta',
    closingDay: 25,
    dueDay: 2,
  });

  const [samplePeriod] = useState<StatementPeriod>({
    cycleId: '2026-10',
    startDate: '2026-08-26',
    closingDate: '2026-09-25',
    dueDate: '2026-10-02',
  });

  const [sampleCommitment] = useState<Commitment>({
    type: 'subscription',
    cardId: sampleCard.id!,
    name: 'GitHub Copilot',
    amountInCents: 1000,
    billingDay: 10,
    frequency: 'monthly',
    isActive: true,
  });

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#09090b' }}>ZeroHero</h1>
        <p style={{ color: '#71717a', margin: '0.25rem 0 0' }}>
          Personal Financial Command Center & Payoff Forecast
        </p>
      </header>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <section style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#18181b' }}>Credit Card Specimen</h2>
          <p><strong>Name:</strong> {sampleCard.name}</p>
          <p><strong>Closing Day:</strong> Day {sampleCard.closingDay}</p>
          <p><strong>Payment Due Day:</strong> Day {sampleCard.dueDay}</p>
        </section>

        <section style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#18181b' }}>Statement Period Specimen</h2>
          <p><strong>Cycle ID (Due Month):</strong> {samplePeriod.cycleId}</p>
          <p><strong>Start Date:</strong> {samplePeriod.startDate}</p>
          <p><strong>Closing Date:</strong> {samplePeriod.closingDate}</p>
          <p><strong>Due Date:</strong> {samplePeriod.dueDate}</p>
        </section>

        <section style={{ border: '1px solid #e4e4e7', borderRadius: 8, padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#18181b' }}>Commitment Specimen</h2>
          <p><strong>Type:</strong> {sampleCommitment.type}</p>
          <p><strong>Name:</strong> {sampleCommitment.name}</p>
          <p>
            <strong>Amount:</strong>{' '}
            {sampleCommitment.type === 'subscription'
              ? `$${(sampleCommitment.amountInCents / 100).toFixed(2)} / ${sampleCommitment.frequency}`
              : `$${(sampleCommitment.totalAmountInCents / 100).toFixed(2)} total (${sampleCommitment.paidInstallments}/${sampleCommitment.totalInstallments})`}
          </p>
        </section>
      </div>
    </div>
  );
}
