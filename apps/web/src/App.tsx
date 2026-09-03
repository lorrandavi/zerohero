import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  StatValue,
  PeriodNavigator,
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
import { useHealth, useCards, useCommitments, useForecast } from './api';

export function App() {
  const [currentCycle, setCurrentCycle] = useState<string>('2026-10');
  const [selectedVariant, setSelectedVariant] = useState<string>('all');

  // Live API Hooks
  const health = useHealth();
  const cards = useCards();
  const commitments = useCommitments();
  const forecast = useForecast(currentCycle);

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
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--zh-accent-emerald)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              June 2027
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--zh-text-muted)', marginTop: '4px' }}>
              Projected payoff date at current rate
            </span>
          </div>
        </Card>
      </section>

      {/* Design System SST & Component Matrix Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
        {/* Local SVG Icons Matrix */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 600 }}>Local Standalone SVG Icons</h2>
            <Badge variant="cyan" size="sm">Zero CDN</Badge>
          </div>
          <p style={{ color: 'var(--zh-text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>
            Self-contained React SVG icon components located in <code style={{ color: 'var(--zh-accent-cyan)' }}>src/design-system/icons/</code>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
            {[
              { name: 'CreditCard', Icon: CreditCardIcon, color: 'var(--zh-accent-cyan)' },
              { name: 'Subscription', Icon: SubscriptionIcon, color: 'var(--zh-accent-indigo)' },
              { name: 'Installment', Icon: InstallmentIcon, color: 'var(--zh-accent-rose)' },
              { name: 'Calendar', Icon: CalendarIcon, color: 'var(--zh-accent-amber)' },
              { name: 'TrendDown', Icon: TrendingDownIcon, color: 'var(--zh-accent-emerald)' },
              { name: 'ChevronLeft', Icon: ChevronLeftIcon, color: 'var(--zh-text-secondary)' },
              { name: 'ChevronRight', Icon: ChevronRightIcon, color: 'var(--zh-text-secondary)' },
              { name: 'Plus', Icon: PlusIcon, color: 'var(--zh-text-primary)' },
              { name: 'Check', Icon: CheckIcon, color: 'var(--zh-accent-emerald)' },
              { name: 'Trash', Icon: TrashIcon, color: 'var(--zh-accent-rose)' },
              { name: 'AlertCircle', Icon: AlertCircleIcon, color: 'var(--zh-accent-amber)' },
            ].map(({ name, Icon, color }) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 8px',
                  backgroundColor: 'var(--zh-surface-elevated)',
                  borderRadius: 'var(--zh-radius-md)',
                  border: '1px solid var(--zh-border-subtle)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={24} color={color} />
                <span style={{ fontSize: '0.75rem', color: 'var(--zh-text-secondary)', marginTop: '8px' }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Atomic Primitives: Badges & Buttons */}
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 600 }}>Atomic Primitives</h2>
            <Badge variant="indigo" size="sm">Atoms & Molecules</Badge>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--zh-text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Badges
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="emerald" icon={<CheckIcon size={12} />}>Paid Off</Badge>
              <Badge variant="cyan" icon={<CalendarIcon size={12} />}>Cycle 2026-10</Badge>
              <Badge variant="indigo" icon={<SubscriptionIcon size={12} />}>Monthly</Badge>
              <Badge variant="amber" icon={<AlertCircleIcon size={12} />}>Closing in 3d</Badge>
              <Badge variant="rose" icon={<InstallmentIcon size={12} />}>3/12 Left</Badge>
              <Badge variant="neutral">Archived</Badge>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--zh-text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Button Variants
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="primary" icon={<PlusIcon size={16} />}>
                Add Commitment
              </Button>
              <Button variant="secondary" icon={<CreditCardIcon size={16} />}>
                Manage Cards
              </Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger" icon={<TrashIcon size={16} />}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </div>

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
    </div>
  );
}
