'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Unified Train Data Contract
 * All pages read from this single source of truth
 */
export interface TrainData {
  // Identity
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;

  // Route and live state
  route: RouteStop[];
  currentStationCode: string;
  currentStationName: string;
  nextStationCode: string;
  nextStationName: string;

  // GPS and movement
  lat: number;
  lng: number;
  speedKmph: number;
  delayMinutes: number;
  timestamp: string;

  // Live availability
  liveAvailable: boolean;
  liveProvider?: string;

  // Confidence metrics
  predictionConfidence: number;
  mapConfidence: number;
  dataQuality: number;
  safetyConfidence: number;

  // Quality metadata
  quality?: {
    staticDataQuality: number;
    liveDataQuality: number;
    predictionConfidence: number;
    mapConfidence: number;
    liveAvailable: boolean;
  };

  // Intelligence modules
  intelligence?: {
    delayRisk?: number;
    networkImpact?: number;
    safetyRisk?: number;
    explainabilityScore?: number;
    activeAlertsCount?: number;
  };
}

export interface RouteStop {
  code: string;
  name: string;
  arrivalTime: string;
  departureTime: string;
  status: 'completed' | 'current' | 'upcoming';
  platformNumber?: string;
  distance?: number;
}

export interface TrackedTrain {
  number: string;
  name: string;
  status: 'moving' | 'halted' | 'delayed';
  delayMinutes: number;
  currentStation: string;
  nextStation: string;
  speedKmph: number;
  confidence: number;
}

export interface TrainContextType {
  // Current selected train
  selectedTrainNumber: string | null;
  trainData: TrainData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  selectTrain: (trainNumber: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearSelection: () => void;

  // Tracked trains list
  trackedTrains: TrackedTrain[];
  refreshTrackedTrains: () => Promise<void>;
}

const TrainContext = createContext<TrainContextType | undefined>(undefined);

export function TrainProvider({ children }: { children: React.ReactNode }) {
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string | null>(null);
  const [trainData, setTrainData] = useState<TrainData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedTrains, setTrackedTrains] = useState<TrackedTrain[]>([]);

  // Fetch train data from unified endpoint
  const selectTrain = async (trainNumber: string) => {
    if (!trainNumber.trim()) {
      setError('Invalid train number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/train/${trainNumber}`);

      if (!response.ok) {
        throw new Error(`Train ${trainNumber} not found`);
      }

      const data = await response.json();
      setSelectedTrainNumber(trainNumber);
      setTrainData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch train data');
      setTrainData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh current train data
  const refreshData = async () => {
    if (!selectedTrainNumber) return;
    await selectTrain(selectedTrainNumber);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTrainNumber(null);
    setTrainData(null);
    setError(null);
  };

  // Load tracked trains from backend
  const refreshTrackedTrains = async () => {
    try {
      const response = await fetch('/api/train/tracked');
      if (response.ok) {
        const data = await response.json();
        setTrackedTrains(data.trains || []);
      }
    } catch (err) {
      console.error('Failed to fetch tracked trains:', err);
    }
  };

  // Load tracked trains on mount
  useEffect(() => {
    refreshTrackedTrains();
  }, []);

  const value: TrainContextType = {
    selectedTrainNumber,
    trainData,
    isLoading,
    error,
    selectTrain,
    refreshData,
    clearSelection,
    trackedTrains,
    refreshTrackedTrains,
  };

  return <TrainContext.Provider value={value}>{children}</TrainContext.Provider>;
}

export function useTrainContext() {
  const context = useContext(TrainContext);
  if (!context) {
    throw new Error('useTrainContext must be used within a TrainProvider');
  }
  return context;
}
