import { useState, useEffect, useCallback } from 'react';
import type { CreditCard, Commitment, MonthlyBurnRate, PayoffCurveForecast } from '@zerohero/shared';
import { api, type HealthResponse } from './client';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useHealth(): AsyncState<HealthResponse> {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getHealth();
      setData(res);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { data, isLoading, error, refetch: fetchHealth };
}

export function useCards(): AsyncState<CreditCard[]> {
  const [data, setData] = useState<CreditCard[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cards = await api.getCards();
      setData(cards);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { data, isLoading, error, refetch: fetchCards };
}

export function useCommitments(cardId?: string): AsyncState<Commitment[]> {
  const [data, setData] = useState<Commitment[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCommitments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const commitments = await api.getCommitments(cardId);
      setData(commitments);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  return { data, isLoading, error, refetch: fetchCommitments };
}

export function useForecast(targetMonth: string, cardId?: string): AsyncState<MonthlyBurnRate> {
  const [data, setData] = useState<MonthlyBurnRate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchForecast = useCallback(async () => {
    if (!targetMonth) return;
    setIsLoading(true);
    setError(null);
    try {
      const forecast = await api.getForecast(targetMonth, cardId);
      setData(forecast);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [targetMonth, cardId]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { data, isLoading, error, refetch: fetchForecast };
}

export function usePayoffCurve(
  startMonth?: string,
  months?: number,
  cardId?: string
): AsyncState<PayoffCurveForecast> {
  const [data, setData] = useState<PayoffCurveForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayoffCurve = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const curve = await api.getPayoffCurve(startMonth, months, cardId);
      setData(curve);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [startMonth, months, cardId]);

  useEffect(() => {
    fetchPayoffCurve();
  }, [fetchPayoffCurve]);

  return { data, isLoading, error, refetch: fetchPayoffCurve };
}
