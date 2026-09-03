/**
 * ZeroHero Typed API Client
 * Wraps native fetch with typed contracts from @zerohero/shared.
 */

import type {
  CreditCard,
  Commitment,
  MonthlyBurnRate,
  PayoffCurveForecast,
} from '@zerohero/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json() as Promise<T>;
}

export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

export const api = {
  // Health
  getHealth: () => request<HealthResponse>('/health'),

  // Credit Cards
  getCards: () => request<CreditCard[]>('/api/cards'),
  getCard: (id: string) => request<CreditCard>(`/api/cards/${encodeURIComponent(id)}`),
  createCard: (data: { name: string; closingDay: number; dueDay: number; color?: string }) =>
    request<CreditCard>('/api/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCard: (id: string) =>
    request<{ success: boolean }>(`/api/cards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Commitments
  getCommitments: (cardId?: string) => {
    const qs = cardId ? `?cardId=${encodeURIComponent(cardId)}` : '';
    return request<Commitment[]>(`/api/commitments${qs}`);
  },
  createCommitment: (data: any) =>
    request<Commitment>('/api/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCommitment: (id: string) =>
    request<{ success: boolean }>(`/api/commitments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Forecast & Payoff Curve
  getForecast: (targetMonth: string, cardId?: string) => {
    const params = new URLSearchParams({ targetMonth });
    if (cardId) params.append('cardId', cardId);
    return request<MonthlyBurnRate>(`/api/forecast?${params.toString()}`);
  },
  getPayoffCurve: (startMonth?: string, months?: number, cardId?: string) => {
    const params = new URLSearchParams();
    if (startMonth) params.append('startMonth', startMonth);
    if (months) params.append('months', months.toString());
    if (cardId) params.append('cardId', cardId);
    const qs = params.toString();
    return request<PayoffCurveForecast>(`/api/forecast/payoff-curve${qs ? `?${qs}` : ''}`);
  },
};
