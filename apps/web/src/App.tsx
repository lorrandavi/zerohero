import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  StatValue,
  PeriodNavigator,
  formatCycleLabel,
  HeroPayoffChart,
  BurnRateBreakdown,
  OperationalWorkbench,
  AddCardModal,
  AddCommitmentModal,
  CreditCardIcon,
  SubscriptionIcon,
  InstallmentIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  AlertCircleIcon,
  TrendingDownIcon,
} from './design-system';
import { useHealth, useCards, useCommitments, useForecast, usePayoffCurve, api } from './api';

export function App() {
  const [currentCycle, setCurrentCycle] = useState<string>('2026-10');
  const [selectedCardFilter, setSelectedCardFilter] = useState<string | undefined>(undefined);
  const [isAddCardOpen, setIsAddCardOpen] = useState<boolean>(false);
  const [isAddCommitmentOpen, setIsAddCommitmentOpen] = useState<boolean>(false);
  const [modalInitialCardId, setModalInitialCardId] = useState<string | undefined>(undefined);

  // Live API Hooks
  const health = useHealth();
  const cards = useCards();
  const commitments = useCommitments();
  const forecast = useForecast(currentCycle);
  const payoffCurve = usePayoffCurve(currentCycle, 12);

  const handleOpenAddCommitment = (cardId?: string) => {
    setModalInitialCardId(cardId ?? selectedCardFilter);
    setIsAddCommitmentOpen(true);
  };

  const handleCardCreated = async () => {
    await Promise.all([
      cards.refetch(),
      forecast.refetch(),
      payoffCurve.refetch(),
    ]);
  };

  const handleCommitmentCreated = async () => {
    await Promise.all([
      commitments.refetch(),
      forecast.refetch(),
      payoffCurve.refetch(),
    ]);
  };

  const handleDeleteCard = async (cardId: string) => {
    await api.deleteCard(cardId);
    await Promise.all([
      cards.refetch(),
      commitments.refetch(),
      forecast.refetch(),
      payoffCurve.refetch(),
    ]);
  };

  const handleDeleteCommitment = async (commitmentId: string) => {
    await api.deleteCommitment(commitmentId);
    await Promise.all([
      commitments.refetch(),
      forecast.refetch(),
      payoffCurve.refetch(),
    ]);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--zh-bg-primary)',
        color: 'var(--zh-text-primary)',
        padding: '2rem 1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Top Header & Command Center Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--zh-border-subtle)',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--zh-radius-lg)',
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
            }}
          >
            <TrendingDownIcon size={24} color="#090a0f" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.625rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ZeroHero
              </h1>
              <Badge variant="cyan" size="sm">
                v0.1 SST
              </Badge>
            </div>
            <p
              style={{
                margin: '2px 0 0',
                color: 'var(--zh-text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              Personal Financial Command Center & Payoff Forecast
            </p>
          </div>
        </div>

        {/* Header Right: API Health Status & Period Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Health Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--zh-surface-card)',
              border: '1px solid var(--zh-border-subtle)',
              borderRadius: 'var(--zh-radius-full)',
              fontSize: '0.8125rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  health.data?.status === 'ok' ? 'var(--zh-accent-emerald)' : 'var(--zh-accent-amber)',
                boxShadow:
                  health.data?.status === 'ok'
                    ? '0 0 8px var(--zh-accent-emerald)'
                    : '0 0 8px var(--zh-accent-amber)',
              }}
            />
            <span style={{ color: 'var(--zh-text-secondary)' }}>API:</span>
            <strong style={{ color: health.data?.status === 'ok' ? 'var(--zh-accent-emerald)' : 'var(--zh-accent-amber)' }}>
              {health.isLoading ? 'Checking...' : health.data?.status === 'ok' ? 'Connected (Hono)' : 'Offline'}
            </strong>
          </div>

          {/* Statement Period Navigator */}
          <PeriodNavigator
            cycleId={currentCycle}
            onPeriodChange={setCurrentCycle}
            isCurrentCycle={currentCycle === '2026-10'}
          />
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <Card variant="glass" glow="cyan" padding="lg">
          <StatValue
            label="Cycle Burn Rate"
            amountInCents={forecast.data?.totalBurnInCents ?? 14990}
            variant="cyan"
            size="lg"
            subtext={`Total due for period ${currentCycle}`}
          />
        </Card>

        <Card variant="glass" padding="lg">
          <StatValue
            label="Fixed Subscriptions"
            amountInCents={forecast.data?.subscriptionBurnInCents ?? 4990}
            variant="indigo"
            size="lg"
            subtext="Monthly recurring commitments"
          />
        </Card>

        <Card variant="glass" padding="lg">
          <StatValue
            label="Active Installments"
            amountInCents={forecast.data?.installmentBurnInCents ?? 10000}
            variant="rose"
            size="lg"
            subtext="Installment debt portion"
          />
        </Card>

        <Card variant="glass" glow="emerald" padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--zh-text-secondary)',
                fontWeight: 500,
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Zero Debt Target
            </span>
            <div
              className="tabular-nums"
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--zh-accent-emerald)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {payoffCurve.data?.payoffDate
                ? formatCycleLabel(payoffCurve.data.payoffDate)
                : payoffCurve.data?.totalInitialDebtInCents === 0
                ? 'Debt Free!'
                : 'June 2027'}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--zh-text-muted)', marginTop: '4px' }}>
              Projected payoff date at current rate
            </span>
          </div>
        </Card>
      </section>

      {/* Hero Visualization & Breakdown Section */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
          alignItems: 'start',
        }}
      >
        {/* Custom Responsive SVG Hero Payoff Curve Chart */}
        <HeroPayoffChart
          data={payoffCurve.data}
          selectedCycle={currentCycle}
          onSelectCycle={setCurrentCycle}
          isLoading={payoffCurve.isLoading}
        />

        {/* Categorized Burn Rate Breakdown & Cycle Ledger */}
        <BurnRateBreakdown
          forecast={forecast.data}
          selectedCycle={currentCycle}
          isLoading={forecast.isLoading}
        />
      </section>

      {/* Operational Split Workbench */}
      <OperationalWorkbench
        cards={cards.data ?? []}
        commitments={commitments.data ?? []}
        selectedCardId={selectedCardFilter}
        onSelectCard={setSelectedCardFilter}
        onOpenAddCard={() => setIsAddCardOpen(true)}
        onOpenAddCommitment={handleOpenAddCommitment}
        onDeleteCard={handleDeleteCard}
        onDeleteCommitment={handleDeleteCommitment}
        isLoadingCards={cards.isLoading}
        isLoadingCommitments={commitments.isLoading}
      />

      {/* Live API Feed & Verified Workspaces */}
      <Card variant="glass" padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 600 }}>Decoupled Monorepo & Typed API Client</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--zh-text-secondary)' }}>
              Consuming strongly-typed contracts from <code style={{ color: 'var(--zh-accent-cyan)' }}>@zerohero/shared</code> via Vite dev proxy.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              health.refetch();
              cards.refetch();
              commitments.refetch();
              forecast.refetch();
            }}
          >
            Refetch All
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--zh-surface-elevated)', borderRadius: 'var(--zh-radius-md)', border: '1px solid var(--zh-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.875rem' }}>Credit Cards API (/api/cards)</strong>
              <Badge variant="cyan" size="sm">{cards.data?.length ?? 0} active</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--zh-text-secondary)', margin: 0 }}>
              {cards.isLoading ? 'Querying API...' : cards.data?.length ? `${cards.data.length} cards connected` : 'No cards registered in SQLite yet'}
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--zh-surface-elevated)', borderRadius: 'var(--zh-radius-md)', border: '1px solid var(--zh-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.875rem' }}>Commitments API (/api/commitments)</strong>
              <Badge variant="indigo" size="sm">{commitments.data?.length ?? 0} total</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--zh-text-secondary)', margin: 0 }}>
              {commitments.isLoading ? 'Querying API...' : commitments.data?.length ? `${commitments.data.length} active commitments` : 'No commitments registered yet'}
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--zh-surface-elevated)', borderRadius: 'var(--zh-radius-md)', border: '1px solid var(--zh-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.875rem' }}>Forecast Engine (/api/forecast)</strong>
              <Badge variant="emerald" size="sm">{currentCycle}</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--zh-text-secondary)', margin: 0 }}>
              {forecast.isLoading ? 'Calculating burn rate...' : `Total: $${((forecast.data?.totalBurnInCents ?? 0) / 100).toFixed(2)}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Interactive Modals */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onSuccess={handleCardCreated}
      />

      <AddCommitmentModal
        isOpen={isAddCommitmentOpen}
        cards={cards.data ?? []}
        initialCardId={modalInitialCardId}
        onClose={() => setIsAddCommitmentOpen(false)}
        onSuccess={handleCommitmentCreated}
        onOpenAddCard={() => {
          setIsAddCommitmentOpen(false);
          setIsAddCardOpen(true);
        }}
      />
    </div>
  );
}
