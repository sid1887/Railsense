/**
 * useTrainData Hook
 * Fetches and manages train insight data with polling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrainInsightData } from '@/types/train';

interface UseTrainDataOptions {
  pollInterval?: number; // ms between updates, 0 = no polling
  onError?: (error: Error) => void;
}

export function useTrainData(trainNumber: string, options: UseTrainDataOptions = {}) {
  const { pollInterval = 5000, onError } = options;

  const [data, setData] = useState<TrainInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/train-details?trainNumber=${trainNumber}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const insightData: TrainInsightData = await response.json();
      setData(insightData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [trainNumber, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [trainNumber, fetchData]);

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * useLiveLocation Hook
 * Tracks live train location updates
 */
export function useLiveLocation(trainNumber: string) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { data: insightData } = useTrainData(trainNumber, { pollInterval: 3000 });

  useEffect(() => {
    if (insightData?.trainData.currentLocation) {
      setLocation(insightData.trainData.currentLocation);
    }
  }, [insightData]);

  return location;
}

/**
 * useTrainSearch Hook
 * Search trains by name or number
 */
export function useTrainSearch(query: string) {
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTrains = async () => {
      try {
        setSearching(true);
        setError(null);

        const response = await fetch(`/api/train?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(searchTrains, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, searching, error };
}

/**
 * useNearbyTrains Hook
 * Get trains near a location
 */
export function useNearbyTrains(
  latitude?: number,
  longitude?: number,
  radius: number = 5
) {
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      setTrains([]);
      return;
    }

    const fetchNearby = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/nearby-trains?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch nearby trains');
        }

        const data = await response.json();
        setTrains(data.trains || []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [latitude, longitude, radius]);

  return { trains, loading, error };
}
